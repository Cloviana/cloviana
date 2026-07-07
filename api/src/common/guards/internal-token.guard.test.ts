import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { InternalTokenGuard } from "./internal-token.guard";

test("internal token guard validates the configured secret", () => {
  const context = (token: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { "x-internal-token": token } }),
      }),
    }) as ExecutionContext;

  const guard = new InternalTokenGuard({
    agentInternalToken: "test-token",
  } as never);
  assert.equal(guard.canActivate(context("test-token")), true);
  assert.throws(
    () => guard.canActivate(context("wrong-token")),
    UnauthorizedException,
  );
});
