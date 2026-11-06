import type { Json, Run } from "../../domain/agent.types";

export abstract class AgentExecutionStore {
  abstract claim(workerToken: string): Promise<Run | null>;
  abstract heartbeat(
    runId: string,
    marketplaceId: string,
    workerToken: string,
  ): Promise<boolean>;
  abstract executionContext(
    run: Run,
  ): Promise<{ slug: string; ownerId: string; name: string }>;
  abstract emit(
    run: Run,
    workerToken: string,
    type: string,
    payload: Json,
  ): Promise<void>;
  abstract complete(run: Run, workerToken: string, text: string): Promise<void>;
  abstract fail(
    run: Run,
    workerToken: string,
    code: string,
    cancelled: boolean,
  ): Promise<void>;
  abstract recoverStale(): Promise<void>;
}
