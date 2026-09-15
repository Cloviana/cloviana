import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { buildAuditReport } from "../audit.metrics";
import { persistAudit } from "../audit.persistence";
import type { AuditRunResult } from "../audit.types";

export async function finalizeAuditStep(
  prisma: PrismaService,
  resend: ResendService,
  result: AuditRunResult,
) {
  await persistAudit(prisma, resend, result, buildAuditReport(result));
  return { auditId: result.auditId, finishedAtIso: new Date().toISOString() };
}
