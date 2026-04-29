import assert from "node:assert/strict";
import test from "node:test";
import { AuditsConsumer } from "./audits.consumer";

test("AuditsConsumer runs the audit runner when it receives a message", async () => {
  const receivedAuditIds: string[] = [];
  const consumer = new AuditsConsumer({
    run: async (auditId: string) => {
      receivedAuditIds.push(auditId);
    },
  } as any);

  (consumer as any).logger = {
    log: () => undefined,
    error: () => undefined,
  };

  await consumer.handleRunAudit({ auditId: "audit_123" });

  assert.deepEqual(receivedAuditIds, ["audit_123"]);
});

test("AuditsConsumer logs failures and does not rethrow runner errors", async () => {
  const errors: Array<{ message: string; stack?: string }> = [];
  const consumer = new AuditsConsumer({
    run: async () => {
      throw new Error("runner failed");
    },
  } as any);

  (consumer as any).logger = {
    log: () => undefined,
    error: (message: string, stack?: string) => {
      errors.push({ message, stack });
    },
  };

  await consumer.handleRunAudit({ auditId: "audit_456" });

  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Audit runner failed/);
});
