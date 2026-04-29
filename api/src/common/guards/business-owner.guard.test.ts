import assert from "node:assert/strict";
import test from "node:test";

import { NotFoundException } from "@nestjs/common";

import { ownerAccessibleBusinessWhere } from "@/modules/businesses/queries/business-where";

import { BusinessOwnerGuard } from "./business-owner.guard";

test("BusinessOwnerGuard uses shared owner access predicate and attaches the business", async () => {
  let receivedWhere: unknown;

  const prisma = {
    business: {
      findFirst: async ({ where }: { where: unknown }) => {
        receivedWhere = where;
        return { id: "business-1" };
      },
    },
  };

  const guard = new BusinessOwnerGuard(prisma as never);
  const request = {
    params: { businessId: "business-1" },
    user: { sub: "user-1" },
  } as Record<string, unknown>;

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };

  const allowed = await guard.canActivate(context as never);

  assert.equal(allowed, true);
  assert.deepEqual(
    receivedWhere,
    ownerAccessibleBusinessWhere("user-1", "business-1"),
  );
  assert.deepEqual(request.business, { id: "business-1" });
});

test("BusinessOwnerGuard throws when the user does not own the business", async () => {
  const prisma = {
    business: {
      findFirst: async () => null,
    },
  };

  const guard = new BusinessOwnerGuard(prisma as never);
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        params: { businessId: "business-1" },
        user: { sub: "user-1" },
      }),
    }),
  };

  await assert.rejects(
    () => guard.canActivate(context as never),
    NotFoundException,
  );
});
