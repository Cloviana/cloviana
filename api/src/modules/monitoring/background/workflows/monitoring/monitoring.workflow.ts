import { GroqService } from "@/clients/groq/groq.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { inngest } from "@/infrastructure/inngest/inngest.client";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { WorkflowRunsService } from "@/modules/workflow-runs/workflow-runs.service";
import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { monitoringRunRequested } from "./monitoring.events";
import type {
  MonitoringEngineResponse,
  MonitoringMention,
  MonitoringRunSummary,
  MonitoringSentimentClaim,
  SerializedMonitoringRunInput,
} from "./monitoring.types";
import { analyzeSentimentStep } from "./steps/analyze-sentiment.step";
import { classifyCitationsStep } from "./steps/classify-citations.step";
import { executeAiOverviewStep } from "./steps/execute-ai-overview.step";
import { executeChatgptStep } from "./steps/execute-chatgpt.step";
import { executeClaudeStep } from "./steps/execute-claude.step";
import { executePerplexityStep } from "./steps/execute-perplexity.step";
import { extractMentionsStep } from "./steps/extract-mentions.step";
import { finalizeRunStep } from "./steps/finalize-run.step";
import { inferFanOutQueriesStep } from "./steps/infer-fan-out-queries.step";
import { loadContextStep } from "./steps/load-context.step";

@Injectable()
export class MonitoringWorkflow {
  private readonly logger = new Logger(MonitoringWorkflow.name);
  readonly inngestFunction;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowRuns: WorkflowRunsService,
    private readonly dataForSeo: DataForSeoService,
    private readonly groq: GroqService,
  ) {
    this.inngestFunction = inngest.createFunction(
      {
        id: "monitoring-run",
        name: "Monitoring run",
        triggers: [monitoringRunRequested],
        retries: 3,
        concurrency: [{ limit: 6 }, { limit: 1, key: "event.data.businessId" }],
      },
      async ({ event, step }) => {
        const { workflowRunId, businessId, promptIds, runDateIso } = event.data;

        try {
          const start = await step.run("start-workflow-run", () =>
            this.workflowRuns.startWorkflowRun(workflowRunId),
          );
          if (!start.shouldExecute) {
            return { workflowRunId, skipped: true };
          }

          const input = (await step.run("load-context", () =>
            loadContextStep(this.prisma, businessId, runDateIso, promptIds),
          )) as SerializedMonitoringRunInput;

          if (input.prompts.length === 0) {
            const summary: MonitoringRunSummary = {
              date: runDateIso.slice(0, 10),
              promptCount: 0,
              responseCount: 0,
              promptMetricCount: 0,
              businessMetricCount: 0,
            };
            await step.run("complete-empty-workflow-run", () =>
              this.workflowRuns.completeWorkflowRun(
                workflowRunId,
                summary as unknown as Prisma.InputJsonValue,
              ),
            );
            return summary;
          }

          this.logger.log(
            `[${businessId}] Starting monitoring date=${runDateIso.slice(0, 10)} promptCount=${input.prompts.length}`,
          );
          const executions = await Promise.all([
            step.run("execute-chatgpt", () =>
              executeChatgptStep(this.dataForSeo, input),
            ),
            step.run("execute-claude", () =>
              executeClaudeStep(this.dataForSeo, input),
            ),
            step.run("execute-perplexity", () =>
              executePerplexityStep(this.dataForSeo, input),
            ),
            step.run("execute-ai-overview", () =>
              executeAiOverviewStep(this.dataForSeo, input),
            ),
          ]);
          const engineResponses =
            executions.flat() as MonitoringEngineResponse[];

          const [
            mentionsByResponseKey,
            queriesByResponseKey,
            sentimentClaimsByResponseKey,
            citationClassificationsByCanonicalUrl,
          ] = await Promise.all([
            step.run("extract-mentions", () =>
              extractMentionsStep(input, engineResponses),
            ),
            step.run("infer-fan-out-queries", () =>
              inferFanOutQueriesStep(this.groq, input, engineResponses),
            ),
            step.run("analyze-sentiment", () =>
              analyzeSentimentStep(this.groq, input, engineResponses),
            ),
            step.run("classify-citations", () =>
              classifyCitationsStep(
                this.prisma,
                this.groq,
                input,
                engineResponses,
              ),
            ),
          ]);
          const analyzedResponses = engineResponses.map((response) => ({
            ...response,
            citations: response.citations.map((citation) => ({
              ...citation,
              ...(citationClassificationsByCanonicalUrl[
                citation.canonicalUrl
              ] ?? {
                urlType: null,
                domainType: null,
              }),
            })),
            mentions: Array.from(
              new Map(
                [
                  ...response.mentions,
                  ...(mentionsByResponseKey[response.responseKey] ?? []),
                ]
                  .filter(
                    (mention): mention is MonitoringMention =>
                      typeof mention.domain === "string" &&
                      typeof mention.position === "number",
                  )
                  .map((mention) => [mention.domain, mention] as const),
              ).values(),
            ),
            fanOutQueries: [
              ...response.fanOutQueries,
              ...(queriesByResponseKey[response.responseKey] ?? []).map(
                (query) => ({ query, inferred: true }),
              ),
            ],
            sentimentClaims: (
              sentimentClaimsByResponseKey[response.responseKey] ?? []
            ).filter(
              (claim): claim is MonitoringSentimentClaim =>
                typeof claim.brandDomain === "string" &&
                typeof claim.label === "string" &&
                (claim.sentiment === "POSITIVE" ||
                  claim.sentiment === "NEGATIVE") &&
                Array.isArray(claim.evidences) &&
                claim.evidences.every(
                  (evidence) =>
                    typeof evidence.startOffset === "number" &&
                    typeof evidence.endOffset === "number",
                ),
            ),
          }));
          const summary = (await step.run("finalize-run", () =>
            finalizeRunStep(this.prisma, input, analyzedResponses),
          )) as MonitoringRunSummary;
          await step.run("complete-workflow-run", async () => {
            const completedRun = await this.workflowRuns.completeWorkflowRun(
              workflowRunId,
              summary as unknown as Prisma.InputJsonValue,
            );
            this.logger.log(
              `[${businessId}] Completed monitoring ${JSON.stringify(summary)}`,
            );
            return completedRun;
          });
          return summary;
        } catch (error) {
          await step.run("fail-workflow-run", () =>
            this.workflowRuns.failWorkflowRun(workflowRunId, error),
          );
          throw error;
        }
      },
    );
  }
}
