import assert from "node:assert/strict";
import test from "node:test";
import { shouldSendAuditCompletionEmail } from "./build-report.node";

test("shouldSendAuditCompletionEmail blocks Samuel's email", () => {
  assert.equal(shouldSendAuditCompletionEmail("samuel@cloviana.com"), false);
  assert.equal(shouldSendAuditCompletionEmail("  SAMUEL@CLOVIANA.COM  "), false);
});

test("shouldSendAuditCompletionEmail allows other recipients", () => {
  assert.equal(shouldSendAuditCompletionEmail("founder@example.com"), true);
});
