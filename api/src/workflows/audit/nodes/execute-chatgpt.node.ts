import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import pLimit from "p-limit";
import { StateAnnotation } from "../audit.state";
import { EngineResult, EngineSource } from "../audit.types";
import { BrandRef, extractMentions } from "../utils/extract-mentions";

const CONCURRENCY = 30;

export async function executeChatgpt(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const dataForSeo = configurable?.dataForSeo as DataForSeoService;
  if (!dataForSeo) throw new Error("DataForSeoService not provided");

  const logger = configurable?.logger as Logger;
  logger?.debug(`[chatgpt] Running ${state._prompts.length} prompts`);

  const limit = pLimit(CONCURRENCY);

  const brands: BrandRef[] = [
    { name: state._brandName, domain: state._domain },
    ...state._competitors
      .filter((c): c is { domain: string; title: string } => !!c.title)
      .map((c) => ({ name: c.title, domain: c.domain })),
  ];

  const results = await Promise.all(
    state._prompts.map((prompt) =>
      limit(async (): Promise<EngineResult> => {
        try {
          const response = await dataForSeo.getChatGptResponse({
            user_prompt: prompt.slice(0, 500),
            model_name: "gpt-4o-mini",
            max_output_tokens: 2048,
            web_search: true,
            web_search_country_iso_code: state._country,
          });

          const taskResult = response.tasks?.[0]?.result?.[0];
          if (!taskResult) {
            return { prompt, engine: "chatgpt", text: "", sources: [], mentions: [] };
          }

          const messageItem = taskResult.items?.find((i) => i.type === "message");
          const textSection = messageItem?.sections?.find((s) => s.type === "text");

          const text = textSection?.text ?? "";
          const sources: EngineSource[] = (textSection?.annotations ?? [])
            .filter((a) => a.url)
            .map((a) => ({ title: a.title ?? "", url: a.url, description: "" }));

          const mentions = await extractMentions(text, brands);

          logger?.debug(`[chatgpt] "${prompt.slice(0, 60)}..." → ${text.length} chars, ${mentions.length} mentions`);
          return { prompt, engine: "chatgpt", text, sources, mentions };
        } catch (err) {
          logger?.debug(`[chatgpt] "${prompt.slice(0, 60)}..." → error: ${err}`);
          return { prompt, engine: "chatgpt", text: "", sources: [], mentions: [] };
        }
      }),
    ),
  );

  const withText = results.filter((r) => r.text.length > 0).length;
  logger?.debug(`[chatgpt] Done: ${withText}/${results.length} with text`);

  return { _engineResults: results };
}
