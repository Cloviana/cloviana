import assert from "node:assert/strict";
import test from "node:test";
import { AuditsService } from "./audits.service";

test("verifyAudit creates an audit and publishes audit.run once", async () => {
  const cache = {
    get: async () =>
      JSON.stringify({
        code: 123456,
        domain: "example.com",
        country: "US",
      }),
    del: async () => undefined,
  };

  const createdAudit = {
    id: "audit_123",
    slug: "example",
    email: "person@company.com",
    domain: "example.com",
    country: "US",
  };

  const prisma = {
    audit: {
      create: async () => createdAudit,
    },
  };

  const publishedPayloads: Array<{ auditId: string }> = [];
  const auditsProducer = {
    runAudit: async (payload: { auditId: string }) => {
      publishedPayloads.push(payload);
    },
  };

  const service = new AuditsService(
    prisma as any,
    {} as any,
    auditsProducer as any,
    cache as any,
  );

  const result = await service.verifyAudit("person@company.com", 123456);

  assert.deepEqual(result, { auditSlug: createdAudit.slug });
  assert.deepEqual(publishedPayloads, [{ auditId: createdAudit.id }]);
});
