import type { AgentUsageInput } from "../../domain/agent.types";
import type { Run } from "../../domain/agent.types";

export abstract class AgentModelAccess {
  abstract revokeModelToken(run: Run, workerToken: string): Promise<void>;
  abstract recordModel(
    run: Run,
    workerToken: string,
    model: string,
  ): Promise<void>;
  abstract issueModelToken(
    run: Run,
    workerToken: string,
    hash: string,
  ): Promise<void>;
  abstract authorizeModelRequest(runId: string, hash: string): Promise<boolean>;
  abstract usage(
    run: Run,
    workerToken: string,
    input: AgentUsageInput,
  ): Promise<void>;
}
