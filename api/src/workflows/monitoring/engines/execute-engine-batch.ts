// Shared request harness used by every execute-*.node.ts. Each engine node
// only supplies its own `execute(prompt)` call; this fires it once per
// prompt (concurrency-limited), and turns the results into the
// EngineResponse/EngineFailure shape the rest of the graph expects.
import type { Logger } from "@nestjs/common";
import pLimit from "p-limit";
import {
  MAX_CONCURRENT_REQUESTS_PER_ENGINE,
  RESPONSES_PER_PROMPT_PER_ENGINE,
} from "../monitoring.constants";
import type { MonitoringState } from "../monitoring.state";
import type {
  EngineExecutionResult,
  EngineFailure,
  EngineResponse,
  FanOutQuery,
  MonitoringEngine,
  MonitoringPrompt,
} from "../monitoring.types";

type EngineResponsePayload = Pick<
  EngineResponse,
  "content" | "citations" | "fanOutQueries" | "raw"
>;

type ExecuteEngineBatchOptions = {
  engine: MonitoringEngine;
  displayName: string;
  logger?: Logger;
  execute: (
    prompt: MonitoringPrompt,
    sampleNumber: number,
  ) => Promise<EngineResponsePayload>;
};

export function nativeFanOutQueries(
  queries: string[] | null = [],
): FanOutQuery[] {
  return (queries ?? []).map((query) => ({ query, inferred: false }));
}

type DataForSeoResult<T> = {
  tasks?: Array<{
    result?: T[] | null;
    status_message?: string;
  }>;
};

export function requireFirstResult<T>(
  response: DataForSeoResult<T>,
  fallbackMessage: string,
): T {
  const result = response.tasks?.[0]?.result?.[0];
  if (!result) {
    throw new Error(response.tasks?.[0]?.status_message ?? fallbackMessage);
  }
  return result;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function executeEngineBatch(
  state: MonitoringState,
  options: ExecuteEngineBatchOptions,
): Promise<EngineExecutionResult> {
  const { engine, displayName, execute, logger } = options;
  const requestedCount = state.prompts.length * RESPONSES_PER_PROMPT_PER_ENGINE;
  const requestLimit = pLimit(MAX_CONCURRENT_REQUESTS_PER_ENGINE);

  logger?.debug(
    `[${state.businessId}] ${displayName} monitoring started prompts=${state.prompts.length} requested=${requestedCount}`,
  );

  const outcomes = await Promise.all(
    state.prompts.flatMap((prompt) =>
      Array.from(
        { length: RESPONSES_PER_PROMPT_PER_ENGINE },
        (_, sampleIndex) =>
          requestLimit(async (): Promise<EngineResponse | EngineFailure> => {
            const sampleNumber = sampleIndex + 1;

            try {
              const payload = await execute(prompt, sampleNumber);

              if (!payload.content) {
                logger?.warn(
                  `[${state.businessId}] ${displayName} returned empty content promptId=${prompt.id} sample=${sampleNumber}`,
                );
              }

              return {
                responseKey: `${engine}:${prompt.id}:${sampleNumber}`,
                engine,
                promptId: prompt.id,
                sampleNumber,
                mentions: [],
                ...payload,
              };
            } catch (error) {
              const message = errorMessage(error);
              logger?.error(
                `[${state.businessId}] ${displayName} request failed promptId=${prompt.id} sample=${sampleNumber}: ${message}`,
              );

              return {
                engine,
                promptId: prompt.id,
                sampleNumber,
                error: message,
              };
            }
          }),
      ),
    ),
  );

  const rawEngineResponses = outcomes.filter(
    (outcome): outcome is EngineResponse => "content" in outcome,
  );
  const engineFailures = outcomes.filter(
    (outcome): outcome is EngineFailure => "error" in outcome,
  );
  const emptyCount = rawEngineResponses.filter(
    (response) => !response.content,
  ).length;

  logger?.log(
    `[${state.businessId}] ${displayName} monitoring completed requested=${requestedCount} succeeded=${rawEngineResponses.length} failed=${engineFailures.length} empty=${emptyCount}`,
  );

  return { rawEngineResponses, engineFailures };
}
