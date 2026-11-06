import type { Run } from "../../domain/agent.types";
export abstract class AgentEngine {
  abstract assertConfigured(coding: boolean): void;
  abstract execute(
    run: Run,
    workerToken: string,
    signal: AbortSignal,
  ): Promise<string>;
}
