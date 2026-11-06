import { Injectable } from "@nestjs/common";
import {
  RUN_HEARTBEAT_INTERVAL_MS,
  RUN_TIMEOUT_MS,
} from "../../domain/agent.policy";
import type { Run } from "../../domain/agent.types";
import { AgentEngine } from "../ports/agent-engine.port";
import { AgentExecutionStore } from "../ports/agent-execution.store.port";
import { AgentRunRepository } from "../ports/agent-run.repository.port";
import { TranscriptPublisher } from "../transcript/transcript-publisher";

@Injectable()
export class ExecuteAgentRunUseCase {
  constructor(
    private readonly execution: AgentExecutionStore,
    private readonly runs: AgentRunRepository,
    private readonly engine: AgentEngine,
  ) {}

  async execute(run: Run, workerToken: string, controller: AbortController) {
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(RUN_TIMEOUT_MS),
    ]);
    const transcript = new TranscriptPublisher((type, payload) =>
      this.execution.emit(run, workerToken, type, payload),
    );
    let checking = false;
    const heartbeat = setInterval(async () => {
      if (checking) {
        return;
      }
      checking = true;
      try {
        if (
          !(await this.execution.heartbeat(
            run.id,
            run.marketplaceId,
            workerToken,
          ))
        ) {
          controller.abort();
        }
        await this.execution.executionContext(run);
      } catch {
        controller.abort();
      } finally {
        checking = false;
      }
    }, RUN_HEARTBEAT_INTERVAL_MS);
    heartbeat.unref();
    try {
      if (run.cancelRequestedAt) {
        controller.abort();
      }
      signal.throwIfAborted();
      await this.engine.execute(run, workerToken, signal, transcript);
      await transcript.flush();
      signal.throwIfAborted();
      await this.execution.complete(run, workerToken, {
        text: transcript.text() || "Done.",
        parts: transcript.parts(),
      });
    } catch {
      // Whatever the run had shown so far stays on record, even though it didn't finish.
      await transcript.flush().catch(() => undefined);
      const current = await this.runs.run(run.marketplaceId, run.id);
      await this.execution.fail(
        run,
        workerToken,
        current.cancelRequestedAt
          ? "CANCELLED"
          : controller.signal.aborted
            ? "WORKER_STOPPED"
            : signal.aborted
              ? "RUN_TIMEOUT"
              : "EXECUTION_FAILED",
        !!current.cancelRequestedAt,
        { text: transcript.text(), parts: transcript.parts() },
      );
    } finally {
      clearInterval(heartbeat);
    }
  }
}
