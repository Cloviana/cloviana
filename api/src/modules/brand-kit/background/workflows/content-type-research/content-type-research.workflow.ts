import { inngest } from "@/infrastructure/inngest/inngest.client";
import { WorkflowRunsService } from "@/modules/workflow-runs/workflow-runs.service";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { contentTypeResearchRequested } from "./content-type-research.events";
import { ContentTypeResearchService } from "./content-type-research.service";

@Injectable()
export class ContentTypeResearchWorkflow {
  readonly inngestFunction;

  constructor(
    private readonly contentTypeResearch: ContentTypeResearchService,
    private readonly workflowRuns: WorkflowRunsService,
  ) {
    this.inngestFunction = inngest.createFunction(
      {
        id: "brand-kit-content-type-research",
        name: "Brand kit content type research",
        triggers: [contentTypeResearchRequested],
        retries: 3,
        concurrency: [{ limit: 4 }, { limit: 1, key: "event.data.businessId" }],
        onFailure: async ({ event, error }) => {
          const failedEvent = event.data.event as {
            data?: { workflowRunId?: string };
          };
          const workflowRunId = failedEvent.data?.workflowRunId;
          if (workflowRunId) {
            await this.workflowRuns.failWorkflowRun(workflowRunId, error);
          }
        },
      },
      async ({ event, step }) => {
        const { workflowRunId, contentTypeId, name, sampleUrl } = event.data;

        try {
          const start = await step.run("start-workflow-run", () =>
            this.workflowRuns.startWorkflowRun(workflowRunId),
          );
          if (!start.shouldExecute) {
            return { workflowRunId, skipped: true };
          }

          await step.run("mark-researching", () =>
            this.workflowRuns.updateWorkflowRunProgress(workflowRunId, {
              stage: "RESEARCHING",
              contentType: { id: contentTypeId, name, sampleUrl },
            }),
          );

          const result = await step.run("research-content-type", () =>
            this.contentTypeResearch.research({
              id: contentTypeId,
              name,
              sampleUrl,
            }),
          );

          await step.run("complete-workflow-run", () =>
            this.workflowRuns.completeWorkflowRun(
              workflowRunId,
              result as unknown as Prisma.InputJsonValue,
            ),
          );

          return result;
        } catch (error) {
          await this.workflowRuns.markWorkflowRunRetrying(workflowRunId);
          throw error;
        }
      },
    );
  }
}
