import { randomInt } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { isWorkEmail } from "@/common/email/work-email";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { AuditsProducer } from "@/modules/audits/background/queue/audits.producer";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

const VERIFY_PREFIX = "audit-verify";
const VERIFY_TTL_MS = 10 * 60 * 1000; // 10 minutes
const VERIFY_EXPIRY_MINUTES = 10;
const AUDIT_REUSE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const DEV_EMAIL = "samuel@cloviana.com";
const DEV_CODE = 123456;
const MAX_SLUG_ATTEMPTS = 20;

interface VerifyPayload {
  code: number;
  domain: string;
  country: string;
}

type AuditReportFields = Pick<
  Prisma.AuditUncheckedCreateInput,
  | "brandName"
  | "visibilityLeaderboard"
  | "citationLeaderboard"
  | "sentiment"
  | "topPages"
  | "contentSuggestions"
  | "brandVisibility"
>;

function toAuditSlugBase(domain: string): string {
  const normalizedDomain = normalizeDomain(domain) ?? domain;
  const firstLabel = normalizedDomain.split(".")[0] ?? "";
  const slug = firstLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "audit";
}

@Injectable()
export class AuditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resend: ResendService,
    private readonly auditsProducer: AuditsProducer,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async requestAudit(email: string, domain: string, country = "US") {
    this.validateWorkEmail(email);

    const isDev = email.toLowerCase() === DEV_EMAIL;

    // Dev bypass: keep the verification step without sending an email.
    if (isDev) {
      await this.cache.set(
        `${VERIFY_PREFIX}:${email}`,
        JSON.stringify({
          code: DEV_CODE,
          domain,
          country,
        } satisfies VerifyPayload),
        VERIFY_TTL_MS,
      );
      return;
    }

    const code = randomInt(100_000, 999_999);

    await this.cache.set(
      `${VERIFY_PREFIX}:${email}`,
      JSON.stringify({ code, domain, country } satisfies VerifyPayload),
      VERIFY_TTL_MS,
    );

    await this.resend.sendVerificationEmail(email, code, VERIFY_EXPIRY_MINUTES);
  }

  async verifyAudit(email: string, code: number) {
    const raw = await this.cache.get<string>(`${VERIFY_PREFIX}:${email}`);

    if (!raw) {
      throw new BadRequestException(
        "Verification code expired or not found. Please request a new one.",
      );
    }

    const payload: VerifyPayload = JSON.parse(raw);

    if (payload.code !== code) {
      throw new BadRequestException("Invalid verification code");
    }

    await this.cache.del(`${VERIFY_PREFIX}:${email}`);

    const recentAudit = await this.findRecentCompletedAudit(payload.domain);

    if (recentAudit) {
      const copiedAudit = await this.createAuditWithSlug({
        email,
        domain: payload.domain,
        country: payload.country,
        ...this.getReportFieldsForCopy(recentAudit),
      });

      return { auditSlug: copiedAudit.slug };
    }

    const audit = await this.createAuditWithSlug({
      email,
      domain: payload.domain,
      country: payload.country,
    });

    await this.auditsProducer.runAudit({ auditId: audit.id });

    return { auditSlug: audit.slug };
  }

  async getAudit(auditSlug: string) {
    const where: Prisma.AuditWhereInput = this.isUuid(auditSlug)
      ? { OR: [{ slug: auditSlug }, { id: auditSlug }] }
      : { slug: auditSlug };

    const audit = await this.prisma.audit.findFirst({
      where,
    });

    if (!audit) {
      throw new NotFoundException("Audit not found");
    }

    return audit;
  }

  private async createAuditWithSlug(data: {
    email: string;
    domain: string;
    country: string;
  } & Partial<AuditReportFields>) {
    const baseSlug = toAuditSlugBase(data.domain);

    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

      try {
        return await this.prisma.audit.create({
          data: { ...data, slug },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }

    return this.prisma.audit.create({
      data: {
        ...data,
        slug: `${baseSlug}-${Date.now().toString(36)}`,
      },
    });
  }

  private async findRecentCompletedAudit(domain: string) {
    const cutoff = new Date(Date.now() - AUDIT_REUSE_WINDOW_MS);
    const audits = await this.prisma.audit.findMany({
      where: {
        domain,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return audits.find((audit) => this.hasCompletedReport(audit)) ?? null;
  }

  private hasCompletedReport(audit: {
    brandName: string | null;
    visibilityLeaderboard: unknown | null;
    citationLeaderboard: unknown | null;
    sentiment: unknown | null;
    topPages: unknown | null;
    brandVisibility: unknown | null;
  }) {
    return (
      audit.brandName !== null &&
      audit.visibilityLeaderboard !== null &&
      audit.citationLeaderboard !== null &&
      audit.sentiment !== null &&
      audit.topPages !== null &&
      audit.brandVisibility !== null
    );
  }

  private getReportFieldsForCopy(audit: {
    brandName: string | null;
    visibilityLeaderboard: unknown | null;
    citationLeaderboard: unknown | null;
    sentiment: unknown | null;
    topPages: unknown | null;
    contentSuggestions: unknown | null;
    brandVisibility: unknown | null;
  }): AuditReportFields {
    return {
      brandName: audit.brandName,
      visibilityLeaderboard:
        audit.visibilityLeaderboard as Prisma.InputJsonValue,
      citationLeaderboard: audit.citationLeaderboard as Prisma.InputJsonValue,
      sentiment: audit.sentiment as Prisma.InputJsonValue,
      topPages: audit.topPages as Prisma.InputJsonValue,
      contentSuggestions: audit.contentSuggestions as Prisma.InputJsonValue,
      brandVisibility: audit.brandVisibility as Prisma.InputJsonValue,
    };
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private validateWorkEmail(email: string) {
    if (!isWorkEmail(email)) {
      throw new BadRequestException(
        "Please use a work email address. Free email providers are not accepted.",
      );
    }
  }
}
