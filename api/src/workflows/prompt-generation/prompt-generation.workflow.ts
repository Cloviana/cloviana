import { createHash } from "node:crypto";
import { GroqService } from "@/clients/groq/groq.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { JobType } from "@prisma/client";
import { graph } from "./prompt-generation.graph";
import type { PromptGenerationInput } from "./prompt-generation.types";

const DEDUPE_PREFIX = "prompt-generation";

@Injectable()
export class PromptGenerationWorkflow {
  private readonly logger = new Logger(PromptGenerationWorkflow.name);

  constructor(
    private readonly managedJobs: ManagedJobsService,
    private readonly exa: ExaService,
    private readonly groq: GroqService,
  ) {}

  async run(input: PromptGenerationInput) {
    const { businessId, competitors, extraContext = [], profile } = input;
    const dedupeKey = this.buildDedupeKey({
      competitors,
      extraContext,
      profile,
    });

    return this.managedJobs.runJobInline({
      type: JobType.PROMPT_RESEARCH,
      businessId,
      dedupeKey,
      execute: async ({ jobId }) => {
        this.logger.log(
          `Starting prompt generation for businessId=${businessId}`,
        );

        await this.managedJobs.updateProgress(jobId, {
          step: "start",
          percent: 0,
          title: "Starting brand research",
        });

        const result = await graph.invoke(
          {
            businessId,
            competitors,
            extraContext,
            profile,
          },
          {
            configurable: {
              exa: this.exa,
              groq: this.groq,
              logger: this.logger,
              progress: (patch) =>
                this.managedJobs.updateProgress(jobId, patch).then(() => {}),
            },
          },
        );

        await this.managedJobs.updateProgress(jobId, {
          step: "complete",
          percent: 100,
          title: "Research ready for review",
        });

        this.logger.log(
          `Completed prompt generation for businessId=${businessId} promptCount=${result.prompts.length}`,
        );

        return {
          businessId,
          promptUniverse: result.promptUniverse,
        };
      },
      serializeResult: (result) => result,
    });
  }

  private buildDedupeKey(
    input: Omit<PromptGenerationInput, "businessId">,
  ): string {
    const digest = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex")
      .slice(0, 16);

    return `${DEDUPE_PREFIX}:${digest}`;
  }
}
