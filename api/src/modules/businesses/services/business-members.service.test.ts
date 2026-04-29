import assert from "node:assert/strict";
import test from "node:test";

import { BusinessMembershipRole } from "@prisma/client";

import { BusinessMembersService } from "./business-members.service";

test("createInvite always persists member role", async () => {
  let upsertArgs: Record<string, unknown> | undefined;

  const prisma = {
    business: {
      findUniqueOrThrow: async () => ({
        owner: {
          email: "owner@cloviana.com",
        },
      }),
    },
    businessMember: {
      findFirst: async () => null,
    },
    businessInvite: {
      upsert: async (args: Record<string, unknown>) => {
        upsertArgs = args;
        return args;
      },
    },
  };

  const service = new BusinessMembersService(prisma as never);

  await service.createInvite({ sub: "owner-id" } as never, "business-1", {
    email: "member@brand.com",
  });

  assert.equal(
    (upsertArgs?.update as { role: BusinessMembershipRole }).role,
    BusinessMembershipRole.MEMBER,
  );
  assert.equal(
    (upsertArgs?.create as { role: BusinessMembershipRole }).role,
    BusinessMembershipRole.MEMBER,
  );
});
