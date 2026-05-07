import { getTitle } from "@/common/utils/get-title.util";
import { extractMentions } from "@/common/visibility/extract-mentions";
import type {
  BetaContentBlock,
  BetaServerToolUseBlock,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
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

export async function executeClaude(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  engineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { anthropic, groq, logger } = requireMonitoringDependencies(config);

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
      params: {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        temperature: 0,
        messages: [{ role: "user" as const, content: prompt.text }],
        tools: [
          {
            type: "web_search_20250305" as const,
            name: "web_search" as const,
            max_uses: 3,
            user_location: {
              type: "approximate" as const,
              country: "US",
            },
          },
        ],
      },
    })),
  );
  logger?.debug(
    `[${state.businessId}] Monitoring Claude batch starting promptCount=${state.prompts.length} requested=${requests.length}`,
  );

  let batchResults: Awaited<ReturnType<typeof anthropic.batch>>;
  try {
    batchResults = await anthropic.batch(requests);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.error(
      `[${state.businessId}] Monitoring Claude batch failed: ${message}`,
    );

    return {
      engineResponses: [],
      engineFailures: requests.map((request) => ({
        engine: "claude",
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

        if (batchResult.result.type !== "succeeded") {
          logger?.warn(
            `[${state.businessId}] Monitoring Claude batch item failed customId=${batchResult.custom_id} status=${batchResult.result.type} error=${JSON.stringify(batchResult.result.error ?? null)}`,
          );
          return {
            engine: "claude",
            promptId,
            error: JSON.stringify(
              batchResult.result.error ?? batchResult.result,
            ),
          };
        }

        const prompt = promptLookup.get(promptId);
        if (!prompt) {
          logger?.warn(
            `[${state.businessId}] Monitoring Claude response could not resolve prompt customId=${batchResult.custom_id}`,
          );
          return {
            engine: "claude",
            promptId,
            error: "Claude response could not resolve prompt",
            raw: batchResult.result.content.raw,
          };
        }

        const citations = await Promise.all(
          batchResult.result.content.citations.map(async (url) => ({
            url,
            title: await getTitle(url),
          })),
        );
        const mentionDomains = await extractMentions(
          groq,
          batchResult.result.content.content,
          brands,
        );
        const mentions = mentionDomains.map((domain) => ({ domain }));
        const fanOutQueries = (
          batchResult.result.content.raw.content as BetaContentBlock[]
        )
          .filter(
            (b): b is BetaServerToolUseBlock =>
              b.type === "server_tool_use" && b.name === "web_search",
          )
          .map((b) => (b.input as { query: string }).query)
          .filter(Boolean);

        return {
          engine: "claude",
          promptId: prompt.id,
          content: batchResult.result.content.content,
          citations,
          mentions,
          fanOutQueries,
          raw: batchResult.result.content.raw,
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

  logger?.log(
    `[${state.businessId}] Monitoring Claude batch completed requested=${requestedCount} succeeded=${engineResponses.length} failed=${engineFailures.length}`,
  );

  return { engineResponses, engineFailures };
}
