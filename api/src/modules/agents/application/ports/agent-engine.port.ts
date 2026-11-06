import type { Run } from "../../domain/agent.types";
import type { TranscriptPublisher } from "../transcript/transcript-publisher";

export abstract class AgentEngine {
  abstract assertConfigured(coding: boolean): void;
  /** Does the run's work, reporting everything it does through `transcript`. */
  abstract execute(
    run: Run,
    workerToken: string,
    signal: AbortSignal,
    transcript: TranscriptPublisher,
  ): Promise<void>;
}
