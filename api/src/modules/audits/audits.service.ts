import { randomInt } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { AppConfiguration } from "@/common/config/app.configuration";
import { isWorkEmail } from "@/common/email/work-email";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { InngestService } from "@/infrastructure/inngest/inngest.service";
import { auditRunRequested } from "@/modules/audits/background/workflows/audit/audit.events";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import pLimit from "p-limit";
import { chromium } from "playwright";

// ponytail: GET /audits/:id/pdf is @Public() and every call launches a
// ~250MB Chromium. Two at a time matches the box's 2 vCPUs and fits the api
// container's mem_limit; past a short queue we shed load instead of letting
// anonymous traffic OOM the box. The queue is kept short deliberately — a
// fast 503 beats a request that waits minutes behind a CPU-bound render.
// Raise PDF_CONCURRENCY with the vCPU count and api mem_limit, never alone.
const PDF_CONCURRENCY = 2;
const PDF_MAX_QUEUE = 6;
const pdfLimit = pLimit(PDF_CONCURRENCY);

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
  | "promptCoverage"
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
    private readonly inngestService: InngestService,
    private readonly appConfiguration: AppConfiguration,
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

    await this.inngestService.send({
      id: `audit:${audit.id}`,
      name: auditRunRequested.name,
      data: { auditId: audit.id },
    });

    return { auditSlug: audit.slug };
  }

  async getAudit(auditSlug: string) {
    const where: Prisma.AuditWhereInput = this.isUuid(auditSlug)
      ? { OR: [{ slug: auditSlug }, { id: auditSlug }] }
      : { slug: auditSlug };

    const audit = await this.prisma.audit.findFirst({ where });

    if (!audit) {
      throw new NotFoundException("Audit not found");
    }

    return audit;
  }

  async generateAuditPdf(auditSlug: string) {
    if (pdfLimit.pendingCount >= PDF_MAX_QUEUE) {
      throw new ServiceUnavailableException(
        "PDF generation is busy, please retry shortly",
      );
    }
    return pdfLimit(() => this.renderAuditPdf(auditSlug));
  }

  private async renderAuditPdf(auditSlug: string) {
    const audit = await this.getAudit(auditSlug);
    const url = `${this.appConfiguration.webInternalUrl}/audits/${audit.slug}`;

    // ponytail: one browser launch per render, like crawlability's
    // rendered-dom check; pooled by pdfLimit above
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      });
      // "load" can hang on third-party scripts; DOM + capped network-idle is enough
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page
        .waitForLoadState("networkidle", { timeout: 10000 })
        .catch(() => undefined);
      // the visibility chart renders client-side; without it the PDF is missing
      // elements. Degrade gracefully rather than fail the download.
      await page
        .waitForSelector(".recharts-surface", { timeout: 15000 })
        .catch(() => undefined);
      // print media applies the site's print styles (chrome hidden, tight padding)
      await page.emulateMedia({ media: "print" });
      await page.waitForTimeout(1000);

      const height = (await page.evaluate(
        "document.documentElement.scrollHeight",
      )) as number;
      const pdf = await page.pdf({
        width: "1280px",
        height: `${height}px`,
        printBackground: true,
      });

      return {
        pdf,
        filename: `${audit.domain}-ai-visibility-audit.pdf`,
      };
    } finally {
      await browser.close();
    }
  }

  private async createAuditWithSlug(
    data: {
      email: string;
      domain: string;
      country: string;
    } & Partial<AuditReportFields>,
  ) {
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
    promptCoverage: unknown | null;
  }) {
    return (
      audit.brandName !== null &&
      audit.visibilityLeaderboard !== null &&
      audit.citationLeaderboard !== null &&
      audit.sentiment !== null &&
      audit.topPages !== null &&
      audit.brandVisibility !== null &&
      audit.promptCoverage !== null
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
    promptCoverage: unknown | null;
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
      promptCoverage: audit.promptCoverage as Prisma.InputJsonValue,
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
