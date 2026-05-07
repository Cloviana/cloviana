import { getTitle } from "@/common/utils/get-title.util";
import { extractMentions } from "@/common/visibility/extract-mentions";
import pLimit from "p-limit";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.config";
import {
  MONITORING_CONCURRENCY,
  RESPONSES_PER_PROMPT_PER_ENGINE,
} from "../monitoring.constants";
import { EngineResponse, StateType } from "../monitoring.state";
import type { EngineFailure } from "../monitoring.types";

function buildCustomId(promptId: string, index: number): string {
  return `${promptId}-run-${index + 1}`;
}

function getPromptId(customId: string): string {
  return customId.replace(/-run-\d+$/, "");
}

export async function executeChatgpt(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  engineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { openai, groq, logger } = requireMonitoringDependencies(config);

  const promptLookup = new Map(
    state.prompts.map((prompt) => [prompt.id, prompt]),
  );
  const brands = [
    { name: state.profile.name, domain: state.profile.domain },
    ...state.competitors,
  ];
  const requests = state.prompts.flatMap((prompt) =>
    Array.from({ length: RESPONSES_PER_PROMPT_PER_ENGINE }, (_, index) => ({
      custom_id: buildCustomId(prompt.id, index),
      body: {
        model: "gpt-5.4-nano-2026-03-17",
        max_output_tokens: 1200,
        temperature: 0,
        input: [{ role: "user" as const, content: prompt.text }],
        reasoning: { effort: "none" as const },
        tools: [
          {
            type: "web_search" as const,
            search_context_size: "low" as const,
            user_location: {
              type: "approximate" as const,
              country: "US",
            },
          },
        ],
        tool_choice: "required" as const,
        include: ["web_search_call.action.sources" as const],
      },
    })),
  );
  logger?.debug(
    `[${state.businessId}] Monitoring ChatGPT batch starting promptCount=${state.prompts.length} requested=${requests.length}`,
  );

  let batchResults: Awaited<ReturnType<typeof openai.batch>>;
  try {
    batchResults = await openai.batch(requests);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.error(
      `[${state.businessId}] Monitoring ChatGPT batch failed: ${message}`,
    );

    return {
      engineResponses: [],
      engineFailures: requests.map((request) => ({
        engine: "chatgpt",
        promptId: getPromptId(request.custom_id),
        error: message,
      })),
    };
  }

  const requestedCount = requests.length;
  const limit = pLimit(MONITORING_CONCURRENCY);

  const results = await Promise.all(
    batchResults.map((batchResult) =>
      limit(async (): Promise<EngineResponse | EngineFailure> => {
        const promptId = getPromptId(batchResult.custom_id);

        if (batchResult.error || !batchResult.content) {
          logger?.warn(
            `[${state.businessId}] Monitoring ChatGPT response missing content customId=${batchResult.custom_id} error=${batchResult.error ?? "none"}`,
          );
          return {
            engine: "chatgpt",
            promptId,
            error: batchResult.error ?? "ChatGPT response missing content",
            raw: batchResult.raw,
          };
        }

        const prompt = promptLookup.get(promptId);
        if (!prompt) {
          logger?.warn(
            `[${state.businessId}] Monitoring ChatGPT response could not resolve prompt customId=${batchResult.custom_id}`,
          );
          return {
            engine: "chatgpt",
            promptId,
            error: "ChatGPT response could not resolve prompt",
            raw: batchResult.raw,
          };
        }

        const citations = await Promise.all(
          batchResult.citations.map(async (url) => ({
            url,
            title: await getTitle(url),
          })),
        );
        const mentionDomains = await extractMentions(
          groq,
          batchResult.content,
          brands,
        );
        const mentions = mentionDomains.map((domain) => ({ domain }));
        const fanOutQueries = (batchResult.raw?.output ?? [])
          .filter((item) => item.type === "web_search_call")
          .flatMap((item) => (item as any).action?.queries ?? []);

        return {
          engine: "chatgpt",
          promptId: prompt.id,
          content: batchResult.content,
          citations,
          mentions,
          fanOutQueries,
          raw: batchResult.raw,
        };
      }),
    ),
  );

  const engineResponses = results.filter(
    (result): result is EngineResponse => "content" in result,
  );
  const engineFailures = results.filter(
    (result): result is EngineFailure => "error" in result,
  );
  const emptyCount = batchResults.filter((result) => !result.content).length;

  logger?.log(
    `[${state.businessId}] Monitoring ChatGPT batch completed requested=${requestedCount} succeeded=${engineResponses.length} failed=${engineFailures.length} empty=${emptyCount}`,
  );

  return { engineResponses, engineFailures };
}
