import asyncio
import json
from uuid import uuid4

from langchain_core.messages import AIMessage, ToolMessage

from agent.context import BusinessContext
from agent.graph import graph


RESEARCH_REQUEST = """
Research DeepSeek V4 Flash using public web sources only.

You must:
1. Call web_search.
2. Call web_extract on at least one official DeepSeek source found by search.
3. Report its release date, context window, tool-calling support, and direct API
   pricing.
4. Include the source URLs and clearly identify anything you could not verify.

Do not query the private Knowledge Base. Keep the final report concise.
""".strip()


async def main() -> None:
    result = await graph.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": RESEARCH_REQUEST,
                }
            ]
        },
        config={
            "configurable": {
                "thread_id": str(uuid4()),
            }
        },
        context=BusinessContext(business_id="test-business"),
    )

    final_response = ""
    for message in result["messages"]:
        if isinstance(message, AIMessage):
            for call in message.tool_calls:
                print(f"\nTOOL CALL: {call['name']}")
                print(json.dumps(call.get("args", {}), indent=2))
            if not message.tool_calls and message.content:
                final_response = str(message.content)

        if isinstance(message, ToolMessage):
            print(f"\nTOOL RESULT: {message.name}")
            print(str(message.content)[:1_500])

            artifact = message.artifact
            if isinstance(artifact, dict):
                sources = artifact.get("results", [])
                if sources:
                    print("SOURCES:")
                    for source in sources:
                        if isinstance(source, dict):
                            print(
                                f"- {source.get('title', 'Untitled')}: "
                                f"{source.get('url', source.get('source', ''))}"
                            )

    print("\nFINAL RESPONSE:")
    print(final_response or "No final response was produced.")


asyncio.run(main())
