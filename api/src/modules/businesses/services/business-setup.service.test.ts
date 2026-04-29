import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BusinessSetupService } from "./business-setup.service";

describe("BusinessSetupService", () => {
  it("prefers a completed owned business when last accessed member business is incomplete", async () => {
    const prisma = {
      profile: {
        findUniqueOrThrow: async () => ({
          lastAccessedBusinessId: "business-incomplete-member",
        }),
      },
      business: {
        findFirst: async ({
          where,
        }: {
          where: Record<string, unknown>;
        }) => {
          if (where.id === "business-incomplete-member") {
            return null;
          }

          if (where.ownerId === "user-1" && where.setupStatus === "COMPLETED") {
            return { id: "business-owned-completed" };
          }

          return null;
        },
      },
    };

    const service = new BusinessSetupService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const result = await service.getEntry({ sub: "user-1" } as never);

    assert.deepEqual(result, {
      destination: "business",
      businessId: "business-owned-completed",
    });
  });

  it("routes to setup when no completed business is available but an owned draft exists", async () => {
    const prisma = {
      profile: {
        findUniqueOrThrow: async () => ({
          lastAccessedBusinessId: null,
        }),
      },
      business: {
        findFirst: async ({
          where,
        }: {
          where: Record<string, unknown>;
        }) => {
          if (
            where.ownerId === "user-1" &&
            typeof where.setupStatus === "object" &&
            where.setupStatus !== null &&
            "not" in where.setupStatus
          ) {
            return { id: "business-owned-draft" };
          }

          return null;
        },
      },
    };

    const service = new BusinessSetupService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const result = await service.getEntry({ sub: "user-1" } as never);

    assert.deepEqual(result, {
      destination: "setup",
      businessId: "business-owned-draft",
    });
  });

  it("completes setup, marks the business processing, and enqueues prompt research", async () => {
    const updates: Array<{ where: any; data: any }> = [];
    const publishedPayloads: Array<{ businessId: string }> = [];
    const prisma = {
      business: {
        findFirstOrThrow: async () => ({
          id: "business-1",
          name: "Cloviana",
          icp: "B2B marketing teams",
          competitors: [{ id: "comp-1" }, { id: "comp-2" }, { id: "comp-3" }],
        }),
        update: async ({ where, data }: { where: any; data: any }) => {
          updates.push({ where, data });
          return {
            id: where.id,
            ...data,
          };
        },
      },
    };

    const businessesProducer = {
      runBusinessInitialization: async (payload: { businessId: string }) => {
        publishedPayloads.push(payload);
      },
    };

    const service = new BusinessSetupService(
      prisma as never,
      {} as never,
      businessesProducer as never,
    );

    const result = await service.completeSetup(
      { sub: "user-1" } as never,
      "business-1",
    );

    assert.equal(result.status, "PROCESSING");
    assert.equal(result.setupStatus, "COMPLETED");
    assert.equal(updates.length, 1);
    assert.deepEqual(publishedPayloads, [{ businessId: "business-1" }]);
  });

  it("updates setup competitors with extracted brand names", async () => {
    const updates: Array<{ where: any; data: any }> = [];
    const extractedDomains: string[] = [];
    const prisma = {
      business: {
        findFirstOrThrow: async () => ({ id: "business-1" }),
        update: async ({ where, data }: { where: any; data: any }) => {
          updates.push({ where, data });
          return { id: where.id, ...data };
        },
      },
    };

    const businessResearch = {
      extractBrandName: async (domain: string) => {
        extractedDomains.push(domain);
        return domain.split(".")[0].toUpperCase();
      },
    };

    const service = new BusinessSetupService(
      prisma as never,
      businessResearch as never,
      {} as never,
    );

    await service.updateSetupCompetitors(
      { sub: "user-1" } as never,
      "business-1",
      {
        competitors: ["https://peec.ai", "athenahq.ai", "peec.ai", "rival.com"],
      },
    );

    assert.deepEqual(extractedDomains, ["peec.ai", "athenahq.ai", "rival.com"]);
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0], {
      where: { id: "business-1" },
      data: {
        competitors: {
          deleteMany: {},
          create: [
            { domain: "peec.ai", name: "PEEC" },
            { domain: "athenahq.ai", name: "ATHENAHQ" },
            { domain: "rival.com", name: "RIVAL" },
          ],
        },
        setupStatus: "IN_PROGRESS",
        setupStep: "COMPETITORS",
      },
    });
  });
});
