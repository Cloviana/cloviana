// Opt-in HTTP check against an already-running development API; no model calls.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaService } from "../src/platform/database/prisma/prisma.service";

if (process.env.ENVIRONMENT === "production") {
  throw new Error("Use a development API for this check");
}
const base =
  process.env.STUDIO_VERIFY_API_URL ||
  `http://127.0.0.1:${process.env.API_PORT || 5001}/api`;
const db = new PrismaService();
const nonce = randomUUID();
let ownerId: string | undefined;
let marketplaceId: string | undefined;
try {
  const email = `studio-stream-${nonce}@example.invalid`;
  const password = randomBytes(24).toString("hex");
  const owner = await db.platformUser.create({
    data: { email, emailVerified: true },
  });
  ownerId = owner.id;
  await db.platformAccount.create({
    data: {
      userId: owner.id,
      accountId: owner.id,
      providerId: "credential",
      password: await hashPassword(password),
    },
  });
  const login = await fetch(`${base}/platform-auth/sign-in/email`, {
    method: "POST",
    headers: {
      Origin: process.env.APP_URL || "http://admin.localhost",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10000),
  });
  assert.ok(login.ok, "Test sign-in failed");
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const marketplace = await db.marketplace.create({
    data: {
      ownerId: owner.id,
      slug: `studio-stream-${nonce}`,
      name: "Studio stream verification",
    },
  });
  marketplaceId = marketplace.id;
  const conversation = await db.agentConversation.create({
    data: { marketplaceId, createdBy: owner.id },
  });
  const message = await db.agentMessage.create({
    data: {
      marketplaceId,
      conversationId: conversation.id,
      sequence: 1n,
      role: "USER",
      content: { text: "Stream verification" },
    },
  });
  const run = await db.agentRun.create({
    data: {
      marketplaceId,
      conversationId: conversation.id,
      triggerMessageId: message.id,
      requestedBy: owner.id,
      idempotencyKey: nonce,
      status: "SUCCEEDED",
      finishedAt: new Date(),
    },
  });
  await db.agentRunEvent.createMany({
    data: [
      {
        marketplaceId,
        runId: run.id,
        sequence: 1n,
        type: "assistant.delta",
        payload: { text: "Stream verification" },
      },
      {
        marketplaceId,
        runId: run.id,
        sequence: 2n,
        type: "run.succeeded",
        payload: {},
      },
    ],
  });
  const path = `/marketplaces/${marketplace.slug}/assistant/runs/${run.id}/stream`;
  const anonymous = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(anonymous.status, 401);
  const wrongMarketplace = await db.marketplace.create({
    data: { ownerId: owner.id, slug: `studio-stream-other-${nonce}` },
  });
  try {
    const denied = await fetch(
      `${base}${path.replace(marketplace.slug, wrongMarketplace.slug)}`,
      { headers: { Cookie: cookie }, signal: AbortSignal.timeout(10000) },
    );
    assert.equal(denied.status, 404);
  } finally {
    await db.marketplace.delete({ where: { id: wrongMarketplace.id } });
  }
  const stream = await fetch(`${base}${path}`, {
    headers: { Cookie: cookie, Accept: "text/event-stream" },
    signal: AbortSignal.timeout(10000),
  });
  assert.ok(stream.headers.get("Content-Type")?.includes("text/event-stream"));
  const all = await stream.text();
  assert.match(all, /event:\s*assistant\.delta/);
  assert.match(all, /event:\s*run\.succeeded/);
  const replay = await fetch(`${base}${path}`, {
    headers: {
      Cookie: cookie,
      Accept: "text/event-stream",
      "Last-Event-ID": "1",
    },
    signal: AbortSignal.timeout(10000),
  });
  const remaining = await replay.text();
  assert.doesNotMatch(remaining, /event:\s*assistant\.delta/);
  assert.match(remaining, /event:\s*run\.succeeded/);
  await db.agentRun.update({
    where: { id: run.id },
    data: { status: "RUNNING", heartbeatAt: new Date() },
  });
  const abort = new AbortController();
  const open = await fetch(`${base}${path}`, {
    headers: { Cookie: cookie, Accept: "text/event-stream" },
    signal: abort.signal,
  });
  assert.ok(open.body, "Stream response has no body");
  const reader = open.body.getReader();
  await reader.read();
  abort.abort();
  await reader.cancel().catch(() => undefined);
  assert.equal(
    (await db.agentRun.findUniqueOrThrow({ where: { id: run.id } })).status,
    "RUNNING",
  );
  console.log(
    "SSE auth, tenant scoping, terminal replay, Last-Event-ID and disconnect behavior passed",
  );
} finally {
  if (marketplaceId) {
    await db.$transaction(async (tx) => {
      await tx.agentRunEvent.deleteMany({ where: { marketplaceId } });
      await tx.agentRun.deleteMany({ where: { marketplaceId } });
      await tx.agentMessage.deleteMany({ where: { marketplaceId } });
      await tx.agentConversation.deleteMany({ where: { marketplaceId } });
      await tx.marketplace.delete({ where: { id: marketplaceId } });
    });
  }
  if (ownerId) {
    await db.platformUser.delete({ where: { id: ownerId } });
  }
  await db.$disconnect();
}
