import { ChatOpenAI } from "@langchain/openai";
import { StateAnnotation } from "../state-annotation";
import { OutlineSchema } from "../schemas/outline";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function outlineNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  console.debug(`Generating outline blog article for "${state._payload.title}"`)

  const { title, businessKeyword, blogginKeyword } = state._payload;

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini-2024-07-18",
  }).withStructuredOutput(OutlineSchema).withRetry({ stopAfterAttempt: 6, onFailedAttempt: () => console.debug("Rate Limit has been hit, retrying.") });

  const outline = await llm.invoke([
    new SystemMessage(
      `You are an SEO specialist. Create a JSON outline (using the OutlineSchema) for the article titled “${title}” The outline must target the primary keyword “${blogginKeyword}” and reinforce the broader business keyword “${businessKeyword}.” Use the information provided by the user to guide your decisions. For the image prompt try not to generate humans if possible, because since it is AI it won't look realistic enough.` +
      `The blog has to be about 1000 words, it must start with INTRODUCTION and end with CONCLUSION. Make it have at least 5 sections all together. Keep it clearly structure with heading and subheadings depending on what blog type you chose.`
    ),
    new HumanMessage(JSON.stringify(state._payload)),
  ]);

  console.debug(`Completed outline blog article for "${state._payload.title}"`)

  return {
    _outline: outline
  };
}
