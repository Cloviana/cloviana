import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AuditReport, AuditRunResult, CitedPage } from "./audit.types";

const MISSING_DESCRIPTION = "Click this preview to learn more";
const AUDIT_COMPLETION_EMAIL_BLOCKLIST = new Set(["samuel@cloviana.com"]);
const logger = new Logger("PersistAudit");

async function fetchMetaDescription(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    if (!response.ok) {
      return "";
    }

    const html = await response.text();
    const match =
      html.match(
        /<meta\s+(?:[^>]*?\s+)?name=["']description["']\s+content=["']([^"']+)["']/i,
      ) ??
      html.match(
        /<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["']\s+name=["']description["']/i,
      );

    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

async function enrichMissingDescriptions(
  pages: CitedPage[],
): Promise<CitedPage[]> {
  return Promise.all(
    pages.map(async (page) => {
      if (page.description !== MISSING_DESCRIPTION) {
        return page;
      }

      const description = await fetchMetaDescription(page.url);
      return {
        ...page,
        description: description || MISSING_DESCRIPTION,
      };
    }),
  );
}

export async function persistAudit(
  prisma: PrismaService,
  resend: ResendService,
  result: AuditRunResult,
  report: AuditReport,
): Promise<void> {
  const topPages = await enrichMissingDescriptions(report.topPages);
  const audit = await prisma.audit.update({
    where: { id: result.auditId },
    data: {
      brandName: result.profile.name,
      visibilityLeaderboard:
        report.visibilityLeaderboard as unknown as Prisma.InputJsonValue,
      citationLeaderboard:
        report.citationLeaderboard as unknown as Prisma.InputJsonValue,
      sentiment: report.sentiment as unknown as Prisma.InputJsonValue,
      topPages: topPages as unknown as Prisma.InputJsonValue,
      contentSuggestions:
        report.contentSuggestions as unknown as Prisma.InputJsonValue,
      brandVisibility:
        report.brandVisibility as unknown as Prisma.InputJsonValue,
      promptCoverage: report.promptCoverage as unknown as Prisma.InputJsonValue,
    },
  });

  if (AUDIT_COMPLETION_EMAIL_BLOCKLIST.has(result.email.toLowerCase())) {
    return;
  }

  try {
    await resend.sendAuditComplete(
      result.email,
      audit.slug,
      result.profile.name,
    );
  } catch (error) {
    logger.error(
      `Failed to send audit completion email auditId=${result.auditId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
