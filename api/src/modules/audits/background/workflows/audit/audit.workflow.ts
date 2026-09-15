import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { inngest } from "@/infrastructure/inngest/inngest.client";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { BusinessResearchService } from "@/modules/businesses/research/business-research.service";
import { Injectable, Logger } from "@nestjs/common";
import { auditRunRequested } from "./audit.events";
import type {
  AuditInput,
  AuditPrompt,
  AuditRunResult,
  ContentIdea,
  EngineResult,
  SentimentResponse,
  SentimentResult,
} from "./audit.types";
import { analyzeSentimentStep } from "./steps/analyze-sentiment.step";
import { executeAiOverviewSentimentStep } from "./steps/execute-ai-overview-sentiment.step";
import { executeAiOverviewStep } from "./steps/execute-ai-overview.step";
import { executeChatgptSentimentStep } from "./steps/execute-chatgpt-sentiment.step";
import { executeChatgptStep } from "./steps/execute-chatgpt.step";
import { executePerplexityStep } from "./steps/execute-perplexity.step";
import { extractMentionsStep } from "./steps/extract-mentions.step";
import { finalizeAuditStep } from "./steps/finalize-audit.step";
import { generateContentIdeasStep } from "./steps/generate-content-ideas.step";
import { generatePromptsStep } from "./steps/generate-prompts.step";
import { generateSentimentPromptsStep } from "./steps/generate-sentiment-prompts.step";
import { loadContextStep } from "./steps/load-context.step";

@Injectable()
export class AuditWorkflow {
  private readonly logger = new Logger(AuditWorkflow.name);
  readonly inngestFunction;

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessResearch: BusinessResearchService,
    private readonly dataForSeo: DataForSeoService,
    private readonly anthropic: AnthropicService,
    private readonly groq: GroqService,
    private readonly resend: ResendService,
  ) {
    this.inngestFunction = inngest.createFunction(
      {
        id: "audit-run",
        name: "Audit run",
        triggers: [auditRunRequested],
        retries: 3,
        concurrency: 30,
      },
      async ({ event, step }) => {
        const { auditId } = event.data;

        try {
          const input = (await step.run("load-context", async () => {
            const context = await loadContextStep(
              this.prisma,
              this.businessResearch,
              auditId,
            );
            this.logger.log(
              `Starting audit ${auditId} for ${context.profile.domain}`,
            );
            return context;
          })) as AuditInput;

          const [serializedPrompts, serializedSentimentPrompts] =
            await Promise.all([
              step.run("generate-prompts", () =>
                generatePromptsStep(this.anthropic, input.profile),
              ),
              step.run("generate-sentiment-prompts", () =>
                generateSentimentPromptsStep(this.groq, input.profile),
              ),
            ]);
          const prompts = serializedPrompts as AuditPrompt[];
          const sentimentPrompts = serializedSentimentPrompts as string[];

          const [
            chatgpt,
            perplexity,
            aiOverview,
            chatgptSentiment,
            aiOverviewSentiment,
          ] = await Promise.all([
            step.run("execute-chatgpt", () =>
              executeChatgptStep(this.dataForSeo, prompts, input.country),
            ),
            step.run("execute-perplexity", () =>
              executePerplexityStep(this.dataForSeo, prompts, input.country),
            ),
            step.run("execute-ai-overview", () =>
              executeAiOverviewStep(this.dataForSeo, prompts, input.country),
            ),
            step.run("execute-chatgpt-sentiment", () =>
              executeChatgptSentimentStep(
                this.dataForSeo,
                sentimentPrompts,
                input.country,
              ),
            ),
            step.run("execute-ai-overview-sentiment", () =>
              executeAiOverviewSentimentStep(
                this.dataForSeo,
                sentimentPrompts,
                input.country,
              ),
            ),
          ]);
          const rawEngineResponses = [
            ...(chatgpt as EngineResult[]),
            ...(perplexity as EngineResult[]),
            ...(aiOverview as EngineResult[]),
          ];
          const sentimentResponses = [
            ...(chatgptSentiment as SentimentResponse[]),
            ...(aiOverviewSentiment as SentimentResponse[]),
          ];

          const [serializedResponses, serializedSentimentResult] =
            await Promise.all([
              step.run("extract-mentions", () =>
                extractMentionsStep(input, rawEngineResponses),
              ),
              step.run("analyze-sentiment", () =>
                analyzeSentimentStep(
                  this.groq,
                  input.profile,
                  sentimentResponses,
                ),
              ),
            ]);
          const engineResponses = serializedResponses as EngineResult[];
          const sentimentResult = serializedSentimentResult as SentimentResult;
          const contentIdeas = (await step.run("generate-content-ideas", () =>
            generateContentIdeasStep(this.groq, input, engineResponses),
          )) as ContentIdea[];
          const result: AuditRunResult = {
            ...input,
            prompts,
            engineResponses,
            contentIdeas,
            sentimentResult,
          };
          const summary = await step.run("finalize-audit", async () => {
            const finalizedAudit = await finalizeAuditStep(
              this.prisma,
              this.resend,
              result,
            );
            this.logger.log(`Audit ${auditId} completed successfully`);
            return finalizedAudit;
          });

          return summary;
        } catch (error) {
          await step.run("log-audit-failure", () => {
            this.logFailure(auditId, error);
            return null;
          });
          throw error;
        }
      },
    );
  }

  async run(auditId: string) {
    try {
      const input = await loadContextStep(
        this.prisma,
        this.businessResearch,
        auditId,
      );
      this.logger.log(`Starting audit ${auditId} for ${input.profile.domain}`);

      const [prompts, sentimentPrompts] = await Promise.all([
        generatePromptsStep(this.anthropic, input.profile),
        generateSentimentPromptsStep(this.groq, input.profile),
      ]);
      const [
        chatgpt,
        perplexity,
        aiOverview,
        chatgptSentiment,
        aiOverviewSentiment,
      ] = await Promise.all([
        executeChatgptStep(this.dataForSeo, prompts, input.country),
        executePerplexityStep(this.dataForSeo, prompts, input.country),
        executeAiOverviewStep(this.dataForSeo, prompts, input.country),
        executeChatgptSentimentStep(
          this.dataForSeo,
          sentimentPrompts,
          input.country,
        ),
        executeAiOverviewSentimentStep(
          this.dataForSeo,
          sentimentPrompts,
          input.country,
        ),
      ]);
      const rawEngineResponses = [...chatgpt, ...perplexity, ...aiOverview];
      const sentimentResponses = [...chatgptSentiment, ...aiOverviewSentiment];
      const [engineResponses, sentimentResult] = await Promise.all([
        extractMentionsStep(input, rawEngineResponses),
        analyzeSentimentStep(this.groq, input.profile, sentimentResponses),
      ]);
      const contentIdeas = await generateContentIdeasStep(
        this.groq,
        input,
        engineResponses,
      );
      const result: AuditRunResult = {
        ...input,
        prompts,
        engineResponses,
        contentIdeas,
        sentimentResult,
      };
      const summary = await finalizeAuditStep(this.prisma, this.resend, result);

      this.logger.log(`Audit ${auditId} completed successfully`);
      return { auditId, finishedAt: new Date(summary.finishedAtIso) };
    } catch (error) {
      this.logFailure(auditId, error);
      throw error;
    }
  }

  private logFailure(auditId: string, error: unknown): void {
    this.logger.error(
      `Audit ${auditId} failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}
