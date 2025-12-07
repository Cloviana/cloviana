import { StateAnnotation } from "../blog-generation.state";
import { Outline, OutlineSchema } from "../schemas/outline.schemas";
import { loadPrompt } from "../utils/load-prompt.util";
import { GroqClient } from "@/clients/groq/groq.client";

export async function outline(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const groq = new GroqClient();

  const payload = {
    context: state._context,
  };

  const _outline = await groq.chatJson<Outline>({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: loadPrompt("outline.md") },
      { role: "user", content: JSON.stringify(payload) },
    ],
    reasoningEffort: "medium",
    schema: OutlineSchema,
    name: "outline",
  });

  return {
    _outline,
  };
}
