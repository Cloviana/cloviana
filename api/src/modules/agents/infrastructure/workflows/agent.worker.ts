import { randomUUID } from "node:crypto";
import { ThemeEditor } from "@/modules/themes/application/editor/theme-editor";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { StateConflictError } from "@/shared/errors/application-error";
import {
  type BeforeApplicationShutdown,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from "@nestjs/common";
import { ExecuteAgentRunUseCase } from "../../application/execute-agent-run/execute-agent-run.use-case";
import { AgentExecutionStore } from "../../application/ports/agent-execution.store.port";

// DB rows are the durable queue. SKIP LOCKED + run tokens support multiple API replicas.
// No event send occurs between the HTTP transaction and durable job acceptance.
@Injectable()
export class AgentWorker
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(AgentWorker.name);
  private timer?: NodeJS.Timeout;
  private stopping = false;
  private ticking?: Promise<void>;
  private lastRecovery = 0;
  private readonly tasks = new Map<
    string,
    { controller: AbortController; promise: Promise<void> }
  >();
  constructor(
    private readonly config: AppConfiguration,
    private readonly store: AgentExecutionStore,
    private readonly executeRun: ExecuteAgentRunUseCase,
    private readonly themes: ThemeEditor,
  ) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => this.scheduleTick(), 2000);
    this.timer.unref();
    this.scheduleTick();
  }

  private scheduleTick() {
    if (this.ticking || this.stopping) {
      return;
    }
    this.ticking = this.tick().finally(() => {
      this.ticking = undefined;
    });
  }

  private async tick() {
    try {
      if (Date.now() - this.lastRecovery > 30_000) {
        await this.store.recoverStale();
        this.lastRecovery = Date.now();
      }
      const concurrency = Math.max(
        1,
        Math.min(8, this.config.agentWorkerConcurrency || 2),
      );
      while (!this.stopping && this.tasks.size < concurrency) {
        const workerToken = randomUUID();
        const run = await this.store.claim(workerToken);
        if (!run) {
          break;
        }
        if (this.stopping) {
          const controller = new AbortController();
          controller.abort();
          await this.executeRun.execute(run, workerToken, controller);
          break;
        }
        this.launch(run.id, (controller) =>
          this.executeRun.execute(run, workerToken, controller),
        );
      }
      if (!this.stopping && this.tasks.size < concurrency) {
        for (const job of await this.themes.pendingWorkspaces(
          concurrency - this.tasks.size,
        )) {
          if (this.stopping) {
            break;
          }
          const key = `workspace:${job.themeId}`;
          if (!this.tasks.has(key)) {
            this.launch(key, async (controller) => {
              await this.themes.prepare(
                job.marketplaceId,
                job.themeId,
                controller.signal,
              );
            });
          }
        }
      }
    } catch {
      this.logger.error(
        "Assistant job dispatcher could not access its durable queue",
      );
    }
  }

  private launch(
    key: string,
    work: (controller: AbortController) => Promise<void>,
  ) {
    const controller = new AbortController();
    const promise = work(controller)
      .catch((error) => {
        // Provider error bodies can contain prompts or credentials. Log only the operation ID.
        if (!(error instanceof StateConflictError)) {
          this.logger.warn(`Background operation stopped: ${key}`);
        }
      })
      .finally(() => this.tasks.delete(key));
    this.tasks.set(key, { controller, promise });
  }

  async beforeApplicationShutdown() {
    this.stopping = true;
    clearInterval(this.timer);
    for (const task of this.tasks.values()) {
      task.controller.abort();
    }
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([
      (async () => {
        await this.ticking;
        await Promise.allSettled(
          [...this.tasks.values()].map((task) => task.promise),
        );
      })(),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, 30_000);
      }),
    ]);
    clearTimeout(timer);
  }
}
