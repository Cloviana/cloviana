import { inngest } from "@/infrastructure/inngest/inngest.client";
import { WorkflowRunsService } from "@/modules/workflow-runs/workflow-runs.service";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { productResearchRequested } from "./product-research.events";
import { ProductResearchService } from "./product-research.service";

@Injectable()
export class ProductResearchWorkflow {
  readonly inngestFunction;

  constructor(
    private readonly productResearch: ProductResearchService,
    private readonly workflowRuns: WorkflowRunsService,
  ) {
    this.inngestFunction = inngest.createFunction(
      {
        id: "brand-kit-product-research",
        name: "Brand kit product research",
        triggers: [productResearchRequested],
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
        const { workflowRunId, businessId, productId, name, contextUrl } =
          event.data;

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
              product: { id: productId, name, contextUrl },
            }),
          );

          const result = await step.run("research-product", () =>
            this.productResearch.research(businessId, {
              id: productId,
              name,
              contextUrl,
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
