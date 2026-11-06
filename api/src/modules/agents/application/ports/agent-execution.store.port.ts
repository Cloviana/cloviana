import type { Json, Run } from "../../domain/agent.types";
import type { RunContext } from "../../domain/run-context";
import type { SavedTranscript } from "../../domain/transcript";

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
  /** What the user sent that started the run: their words, and what they were looking at. */
  abstract input(run: Run): Promise<{ text: string; context?: RunContext }>;
  abstract complete(
    run: Run,
    workerToken: string,
    transcript: SavedTranscript,
  ): Promise<void>;
  abstract fail(
    run: Run,
    workerToken: string,
    code: string,
    cancelled: boolean,
    /** What the run had done before it stopped, kept so the user still sees it. */
    transcript: SavedTranscript,
  ): Promise<void>;
  abstract recoverStale(): Promise<void>;
}
