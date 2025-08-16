import { ChatOpenAI } from "@langchain/openai";
import { StateAnnotation } from "../state-annotation";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { RootSchema } from "../schemas/node";

export async function assembleNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini-2024-07-18",
    temperature: 0,
  })
    .withStructuredOutput(RootSchema)
    .withRetry({
      stopAfterAttempt: 6,
      onFailedAttempt: () => console.debug("Rate Limit hit, retrying."),
    });

  const prevNodes = state._sections.sort((a, b) => a.index - b.index).flatMap((s) => s.nodes);
  const { nodes } = await llm.invoke([
    new SystemMessage(
      [
        "Edit strictly for cohesion. Return the same node array you receive.",
        "Preserve every word and structure exactly unless a minimal change is required to improve flow between adjacent sections or subsections.",
        "Make the smallest possible edits only when necessary (e.g., a brief transition).",
        "Do not drop, reorder, paraphrase, or invent content. Do not alter headings, levels, or metadata.",
        "Output must be a valid RootSchema node array."
      ].join(" ")
    ),
    new HumanMessage(JSON.stringify(prevNodes)),
  ]);

  return { _nodes: nodes };
}
