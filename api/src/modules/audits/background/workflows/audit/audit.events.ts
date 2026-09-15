import { eventType, staticSchema } from "inngest";

export interface AuditRunEventData extends Record<string, unknown> {
  auditId: string;
}

export const auditRunRequested = eventType("audit/run.requested", {
  schema: staticSchema<AuditRunEventData>(),
});
