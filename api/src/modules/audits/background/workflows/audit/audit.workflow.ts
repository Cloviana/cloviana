// Researches a business, runs the audit engines, analyzes their responses,
// builds the report metrics, and persists the completed audit.
import { PrismaService } from "@/clients/prisma/prisma.service";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { BusinessResearchService } from "@/modules/businesses/research/business-research.service";
import { Injectable, Logger } from "@nestjs/common";
import { AuditAnalysis } from "./audit.analysis";
import { AuditEngines } from "./audit.engines";
import { buildAuditReport } from "./audit.metrics";
import { AuditPersistence } from "./audit.persistence";
import type { AuditInput, AuditRunResult } from "./audit.types";

@Injectable()
export class AuditWorkflow {
  private readonly logger = new Logger(AuditWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessResearch: BusinessResearchService,
    private readonly engines: AuditEngines,
    private readonly analysis: AuditAnalysis,
    private readonly persistence: AuditPersistence,
  ) {}

  async run(auditId: string) {
    try {
      const input = await this.buildInput(auditId);
      this.logger.log(`Starting audit ${auditId} for ${input.profile.domain}`);

      const [prompts, sentimentPrompts] = await Promise.all([
        this.analysis.generatePrompts(input.profile),
        this.analysis.generateSentimentPrompts(input.profile),
      ]);
      const [rawEngineResponses, sentimentResponses] = await Promise.all([
        this.engines.execute(prompts, input.country),
        this.engines.executeSentiment(sentimentPrompts, input.country),
      ]);
      const [engineResponses, sentimentResult] = await Promise.all([
        this.analysis.addMentions(input, rawEngineResponses),
        this.analysis.analyzeSentiment(input.profile, sentimentResponses),
      ]);
      const contentIdeas = await this.analysis.generateContentIdeas(
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

      await this.persistence.persist(result, buildAuditReport(result));

      const finishedAt = new Date();
      this.logger.log(`Audit ${auditId} completed successfully`);
      return { auditId, finishedAt };
    } catch (error) {
      this.logger.error(
        `Audit ${auditId} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async buildInput(auditId: string): Promise<AuditInput> {
    const audit = await this.prisma.audit.findUniqueOrThrow({
      where: { id: auditId },
    });
    const domain = normalizeDomain(audit.domain);

    if (!domain) {
      throw new Error(`Could not normalize domain: ${audit.domain}`);
    }

    const [profile, competitors] = await Promise.all([
      this.businessResearch.enrichProfile(domain),
      this.businessResearch.findCompetitors(domain, 30),
    ]);

    return {
      auditId,
      email: audit.email,
      country: audit.country,
      profile: { ...profile, domain },
      competitors: competitors.map((competitor) => ({
        id: competitor.domain,
        domain: competitor.domain,
        name: competitor.name,
      })),
    };
  }
}
