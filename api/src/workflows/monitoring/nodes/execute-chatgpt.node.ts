import { getTitle } from "@/common/utils/get-title.util";
import { extractMentions } from "@/common/visibility/extract-mentions";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.config";
import { RESPONSES_PER_PROMPT_PER_ENGINE } from "../monitoring.constants";
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
    state.prompts.map((prompt) => [prompt.promptId, prompt]),
  );
  const brands = [
    { name: state.profile.name, domain: state.profile.domain },
    ...state.competitors,
  ];
  const requests = state.prompts.flatMap((prompt) =>
    Array.from({ length: RESPONSES_PER_PROMPT_PER_ENGINE }, (_, index) => ({
      custom_id: buildCustomId(prompt.promptId, index),
      body: {
        model: "gpt-5.4-nano-2026-03-17",
        max_output_tokens: 4096,
        input: [{ role: "user" as const, content: prompt.text }],
        reasoning: { effort: "none" as const },
        tools: [
          {
            type: "web_search_preview" as const,
            search_context_size: "medium" as const,
            user_location: {
              type: "approximate" as const,
              country: "US",
            },
          },
        ],
        tool_choice: { type: "web_search_preview" as const },
        include: ["web_search_call.action.sources" as const],
      },
    })),
  );

  let batchResults: Awaited<ReturnType<typeof openai.batch>>;
  try {
    batchResults = await openai.batch(requests);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.error(`Monitoring ChatGPT batch failed: ${message}`);

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

  const engineResponses: EngineResponse[] = [];
  const engineFailures: EngineFailure[] = [];
  let emptyCount = 0;

  for (const batchResult of batchResults) {
    const promptId = getPromptId(batchResult.custom_id);

    if (batchResult.error || !batchResult.content) {
      if (!batchResult.content) {
        emptyCount += 1;
      }
      engineFailures.push({
        engine: "chatgpt",
        promptId,
        error: batchResult.error ?? "ChatGPT response missing content",
        raw: batchResult.raw,
      });
      logger?.warn(
        `Monitoring ChatGPT response missing content customId=${batchResult.custom_id} error=${batchResult.error ?? "none"}`,
      );
      continue;
    }

    const prompt = promptLookup.get(promptId);
    if (!prompt) {
      engineFailures.push({
        engine: "chatgpt",
        promptId,
        error: "ChatGPT response could not resolve prompt",
        raw: batchResult.raw,
      });
      logger?.warn(
        `Monitoring ChatGPT response could not resolve prompt customId=${batchResult.custom_id}`,
      );
      continue;
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

    engineResponses.push({
      engine: "chatgpt",
      promptId: prompt.promptId,
      content: batchResult.content,
      citations,
      mentions,
      fanOutQueries,
      raw: batchResult.raw,
    });
  }

  logger?.log(
    `Monitoring ChatGPT batch completed requested=${requestedCount} succeeded=${engineResponses.length} failed=${engineFailures.length} empty=${emptyCount}`,
  );

  return { engineResponses, engineFailures };
}
