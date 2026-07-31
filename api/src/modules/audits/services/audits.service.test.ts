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
      findMany: async () => [],
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

test("verifyAudit copies a recent completed domain audit without publishing audit.run", async () => {
  const cache = {
    get: async () =>
      JSON.stringify({
        code: 123456,
        domain: "example.com",
        country: "US",
      }),
    del: async () => undefined,
  };

  const recentAudit = {
    id: "audit_source",
    slug: "example",
    email: "founder@example.com",
    domain: "example.com",
    country: "US",
    brandName: "Example",
    visibilityLeaderboard: [{ domain: "example.com", share: 50 }],
    citationLeaderboard: [{ domain: "example.com", share: 25 }],
    sentiment: { positivePercent: 80, negativePercent: 20 },
    topPages: [{ url: "https://example.com", domain: "example.com" }],
    contentSuggestions: [{ title: "Comparison page" }],
    brandVisibility: { overall: 50 },
    createdAt: new Date(),
  };

  const createdAudit = {
    id: "audit_copy",
    slug: "example-2",
    email: "person@company.com",
    domain: "example.com",
    country: "US",
  };

  const createCalls: any[] = [];
  const prisma = {
    audit: {
      findMany: async () => [recentAudit],
      create: async (args: any) => {
        createCalls.push(args);
        return createdAudit;
      },
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
  assert.deepEqual(publishedPayloads, []);
  assert.equal(createCalls.length, 1);
  assert.deepEqual(createCalls[0].data, {
    email: "person@company.com",
    domain: "example.com",
    country: "US",
    slug: "example",
    brandName: recentAudit.brandName,
    visibilityLeaderboard: recentAudit.visibilityLeaderboard,
    citationLeaderboard: recentAudit.citationLeaderboard,
    sentiment: recentAudit.sentiment,
    topPages: recentAudit.topPages,
    contentSuggestions: recentAudit.contentSuggestions,
    brandVisibility: recentAudit.brandVisibility,
  });
});
