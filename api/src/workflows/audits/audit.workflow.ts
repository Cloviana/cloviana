import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PerplexityService } from "@/clients/perplexity/perplexity.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { BusinessResearchService } from "@/modules/businesses/services/business-research.service";
import { Injectable, Logger } from "@nestjs/common";
import { graph } from "./audit.graph";
import type { StateType } from "./audit.state";

@Injectable()
export class AuditWorkflow {
  private readonly logger = new Logger(AuditWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicService,
    private readonly groq: GroqService,
    private readonly openai: OpenAIService,
    private readonly perplexity: PerplexityService,
    private readonly resend: ResendService,
    private readonly businessResearch: BusinessResearchService,
    private readonly dataForSeo: DataForSeoService,
  ) {}

  async run(auditId: string) {
    const initialState = await this.buildInitialState(auditId);

    this.logger.log(
      `Starting audit ${auditId} for ${initialState.profile.domain}`,
    );

    try {
      const stream = graph.streamEvents(initialState, {
        version: "v2",
        configurable: {
          anthropic: this.anthropic,
          dataForSeo: this.dataForSeo,
          groq: this.groq,
          logger: this.logger,
          openai: this.openai,
          perplexity: this.perplexity,
          prisma: this.prisma,
          resend: this.resend,
        },
      });

      for await (const _event of stream) {
        // Drain the stream so LangGraph executes all nodes.
      }

      const finished = new Date();
      this.logger.log(`Audit ${auditId} completed successfully`);
      return { auditId, finishedAt: finished };
    } catch (err: any) {
      this.logger.error(`Audit ${auditId} failed: ${err?.message}`, err?.stack);
      throw err;
    }
  }

  private async buildInitialState(auditId: string): Promise<StateType> {
    const audit = await this.prisma.audit.findUniqueOrThrow({
      where: { id: auditId },
    });
    const domain = normalizeDomain(audit.domain);

    if (!domain) {
      throw new Error(`Could not normalize domain: ${audit.domain}`);
    }

    const profile = await this.businessResearch.enrichProfile(domain);
    const competitors = await this.businessResearch.findCompetitors(domain, 30);

    return {
      auditId,
      email: audit.email,
      country: audit.country,
      profile: {
        ...profile,
        domain,
      },
      competitors: competitors.map((competitor) => ({
        id: competitor.domain,
        domain: competitor.domain,
        name: competitor.name,
      })),
      prompts: [],
      engineResponses: [],
      contentIdeas: [],
      sentimentResult: {
        positivePercent: 0,
        negativePercent: 0,
        claims: [],
        responses: [],
      },
    };
  }
}
