import type { QueueAgentRunInput } from "../../domain/agent.types";
import type { Run, RunEvent } from "../../domain/agent.types";

export abstract class AgentRunRepository {
  abstract enqueue(input: QueueAgentRunInput): Promise<Run>;
  abstract run(marketplaceId: string, runId: string): Promise<Run>;
  abstract activeRun(
    marketplaceId: string,
    conversationId: string,
  ): Promise<Run | null>;
  abstract events(
    marketplaceId: string,
    runId: string,
    after: bigint,
  ): Promise<RunEvent[]>;
  abstract cancel(marketplaceId: string, runId: string): Promise<Run>;
  abstract usageForRun(
    marketplaceId: string,
    runId: string,
  ): Promise<
    Array<{
      provider: string;
      model: string;
      inputTokens: string;
      outputTokens: string;
      cachedInputTokens: string;
      costMicros: string | null;
    }>
  >;
}
