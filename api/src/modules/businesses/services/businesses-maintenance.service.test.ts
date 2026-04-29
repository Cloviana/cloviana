import assert from "node:assert/strict";
import test from "node:test";
import { BusinessSetupStatus } from "@prisma/client";
import { BusinessesMaintenanceService } from "./businesses-maintenance.service";

test("clearStaleInProgressBusinesses deletes in-progress businesses whose last update is older than the cutoff", async () => {
  const cutoff = new Date("2026-04-08T12:00:00.000Z");
  let capturedWhere: unknown;

  const service = new BusinessesMaintenanceService({
    business: {
      deleteMany: async ({ where }: { where: unknown }) => {
        capturedWhere = where;
        return { count: 2 };
      },
    },
  } as never);

  const deletedCount = await service.clearStaleInProgressBusinesses(cutoff);

  assert.equal(deletedCount, 2);
  assert.deepEqual(capturedWhere, {
    setupStatus: BusinessSetupStatus.IN_PROGRESS,
    updatedAt: { lte: cutoff },
  });
});
