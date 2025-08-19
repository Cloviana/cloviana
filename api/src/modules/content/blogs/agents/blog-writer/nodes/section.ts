import { ChatOpenAI } from "@langchain/openai";
import { Section } from "../schemas/outline";
import { Payload } from "../state-annotation";
import { NodePayload, RootSchema } from "../schemas/node";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

async function generateContent(
  heading: string,
  context: Payload,
  data: Omit<Section, "subsections">,
  level: 2 | 3,
): Promise<NodePayload[]> {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini-2024-07-18",
    temperature: 0,
  })
    .withStructuredOutput(RootSchema)
    .withRetry({
      stopAfterAttempt: 6,
      onFailedAttempt: () => console.debug("Rate Limit hit, retrying."),
    });

  const { nodes } = await llm.invoke([
    new SystemMessage(
      [
        "You are an AI copywriter specialized in SEO-friendly blog content.",
        "Task: generate the body for a single section given its outline and the overall article context.",
        "Requirements:",
        "- Use a LIST block when a list is appropriate; otherwise use one or more TEXT blocks.",
        "- Do not include heading markup; the heading is injected elsewhere.",
        "- Embed the keywords naturally; refrain from keyword stuffing.",
        "- Don’t format the text using Markdown (e.g., **HELLO**).",
        "- Make the blog’s content easy to understand.",
        "- If this is the INTRODUCTION section, briefly answer the broader question.",
        "- If you believe that this section would benefit from including the bloggin keyword then do so, but if you don't think so then there is no need to forcefully integrate the blogging keyword. It should integrate flawlessly.",
      ].join(" "),
    ),
    new HumanMessage(`SECTION:${JSON.stringify(data)}`),
    new HumanMessage(`CONTEXT:${JSON.stringify(context)}`),
  ]);

  return [
    {
      type: "HEADING",
      level,
      children: [{ type: "TEXT", text: heading, styles: null }],
    },
    ...nodes,
  ];
}

export async function sectionNode(state: {
  _section: Section;
  _payload: Payload;
  _index: number;
}): Promise<{ _sections: { nodes: NodePayload[]; index: number }[] }> {
  console.debug(
    `Initializing Section: type=${state._section.type}, heading=${state._section.headingText}`,
  );

  const { subsections, ...rest } = state._section;

  const sectionNodes = await generateContent(
    state._section.headingText,
    state._payload,
    rest,
    2,
  );
  const results = [{ index: state._index, nodes: sectionNodes }];

  if (subsections?.length) {
    const subsectionResults = await Promise.all(
      subsections.map((sub, subIndex) =>
        generateContent(
          sub.headingText,
          state._payload,
          { ...sub, type: "SECTION" },
          3,
        ).then((nodes) => ({
          index: state._index + subIndex + 0.01,
          nodes,
        })),
      ),
    );
    results.push(...subsectionResults);
  }

  console.debug(
    `Completed Section: type=${state._section.type}, heading=${state._section.headingText}`,
  );
  return { _sections: results };
}
