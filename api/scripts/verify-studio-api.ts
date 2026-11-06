// Opt-in live check against an already-running development API. Never starts a server.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { hashPassword } from "better-auth/crypto";
import { CloudflareR2Service } from "../src/integrations/cloudflare-r2/cloudflare-r2.service";
import { DaytonaService } from "../src/integrations/daytona/daytona.service";
import { DockerService } from "../src/integrations/docker/docker.service";
import { SandboxService } from "../src/integrations/sandbox/sandbox.service";
import type { AppConfiguration } from "../src/platform/config/app.configuration";
import { PrismaService } from "../src/platform/database/prisma/prisma.service";

if (process.env.ENVIRONMENT === "production") {
  throw new Error("Use a development API for this isolated integration check");
}
const base =
  process.env.STUDIO_VERIFY_API_URL ||
  `http://127.0.0.1:${process.env.API_PORT || 5001}/api`;
const origin = process.env.APP_URL || "http://admin.localhost";
const config = {
  environment: "development",
  sandboxProvider: process.env.SANDBOX_PROVIDER || "docker",
  daytonaApiKey: process.env.DAYTONA_API_KEY,
  daytonaApiUrl: process.env.DAYTONA_API_URL,
  daytonaTarget: process.env.DAYTONA_TARGET || "eu",
  r2Endpoint: process.env.R2_ENDPOINT,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2PrivateBucket: process.env.R2_PRIVATE_BUCKET,
} as AppConfiguration;
const db = new PrismaService();
const r2 = new CloudflareR2Service(config);
const runtime = new SandboxService(
  config,
  new DaytonaService(config),
  new DockerService(config),
);
let cookie = "";
let ownerId: string | undefined;
let marketplaceId: string | undefined;
let runId: string | undefined;
let themeId: string | undefined;
let editorPath: string;
let assistantPath: string;
const keys = new Set<string>();

async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(
      `${method} ${path} returned HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  }
  return response.json() as Promise<T>;
}
interface LiveRun {
  id: string;
  status: string;
  errorCode: string | null;
  resultRevisionId: string | null;
}
async function waitForRun(id: string) {
  let lastStatus = "";
  for (let attempt = 0; attempt < 450; attempt++) {
    const run = await request<LiveRun>(`${assistantPath}/runs/${id}`);
    if (run.status !== lastStatus) {
      console.log(`Agent run: ${run.status}`);
      lastStatus = run.status;
    }
    if (run.status === "SUCCEEDED") {
      return run;
    }
    if (["FAILED", "CANCELLED"].includes(run.status)) {
      throw new Error(`Agent stopped: ${run.errorCode}`);
    }
    await delay(2000);
  }
  throw new Error("Timed out waiting for the coding run");
}
async function waitForPreview() {
  for (let attempt = 0; attempt < 300; attempt++) {
    const state = await request<{ workspace?: { status: string } }>(editorPath);
    if (state.workspace?.status === "FAILED") {
      throw new Error("Workspace failed to start");
    }
    if (state.workspace?.status === "RUNNING") {
      const preview = await request<{ ready: boolean; url: string }>(
        `${editorPath}/preview`,
      );
      if (preview.ready) {
        return preview.url;
      }
    }
    await delay(2000);
  }
  throw new Error("Timed out waiting for the preview");
}

try {
  await request("/health");
  const nonce = randomUUID();
  const email = `studio-${nonce}@example.invalid`;
  const password = randomBytes(24).toString("hex");
  const user = await db.platformUser.create({
    data: { email, name: "Studio verification", emailVerified: true },
  });
  ownerId = user.id;
  await db.platformAccount.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(password),
    },
  });
  const login = await fetch(`${base}/platform-auth/sign-in/email`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(30000),
  });
  if (!login.ok) {
    throw new Error(`Test sign-in returned HTTP ${login.status}`);
  }
  cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  if (!cookie) {
    throw new Error("Test sign-in did not produce a session cookie");
  }
  const slug = `studio-${nonce}`;
  const marketplace = await db.marketplace.create({
    data: { ownerId: user.id, name: "Studio verification", slug },
  });
  marketplaceId = marketplace.id;
  const initialKey = `verification/${nonce}/initial.tar.gz`;
  keys.add(initialKey);
  await r2.copyPrivate(
    "templates/marketplace-default/1/snapshot.tar.gz",
    initialKey,
  );
  const manifest = JSON.parse(
    await r2.readPrivateText("templates/marketplace-default/1/manifest.json"),
  ) as { commitSha: string };
  const theme = await db.theme.create({
    data: {
      marketplaceId,
      name: "Studio verification",
      provisioningStatus: "READY",
      storageKey: initialKey,
      snapshotVersion: 1,
    },
  });
  themeId = theme.id;
  const initial = await db.themeRevision.create({
    data: {
      marketplaceId,
      themeId,
      commitSha: manifest.commitSha,
      storageKey: initialKey,
      origin: "SYSTEM",
    },
  });
  await db.theme.update({
    where: { id: themeId },
    data: { headRevisionId: initial.id },
  });
  editorPath = `/marketplaces/${slug}/themes/${themeId}/editor`;
  assistantPath = `/marketplaces/${slug}/assistant`;
  const conversation = await request<{ id: string }>(
    `${assistantPath}/conversations`,
    "POST",
    { title: "Studio integration check" },
  );
  const heading = `Studio verification ${nonce.slice(0, 8)}`;
  const reference = Buffer.from(
    `Set the home page's main heading to exactly: ${heading}\nKeep the cart and hosted checkout integration.\n`,
    "utf8",
  );
  const attachmentPath = `${assistantPath}/conversations/${conversation.id}/attachments`;
  const attachment = await request<{ attachmentId: string; uploadUrl: string }>(
    attachmentPath,
    "POST",
    { name: "reference.txt", mimeType: "text/plain", size: reference.length },
  );
  keys.add(`agent-upload-pending/${marketplaceId}/${attachment.attachmentId}`);
  const upload = await fetch(attachment.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: reference,
    signal: AbortSignal.timeout(30000),
  });
  if (!upload.ok) {
    throw new Error(`Reference upload returned HTTP ${upload.status}`);
  }
  await request(
    `${attachmentPath}/${attachment.attachmentId}/complete`,
    "POST",
    {},
  );
  const body = {
    prompt: `Read the attached reference. Change only the home page's primary heading to exactly "${heading}". Implement this source edit now using the coding tool, retain the rest of the page, and validate the project.`,
    idempotencyKey: nonce,
    themeId,
    attachmentIds: [attachment.attachmentId],
  };
  const run = await request<LiveRun>(
    `${assistantPath}/conversations/${conversation.id}/runs`,
    "POST",
    body,
  );
  runId = run.id;
  assert.equal(
    (
      await request<LiveRun>(
        `${assistantPath}/conversations/${conversation.id}/runs`,
        "POST",
        body,
      )
    ).id,
    run.id,
  );
  const finished = await waitForRun(run.id);
  assert.ok(finished.resultRevisionId);
  const source = await request<{ content: string }>(
    `${editorPath}/file?path=app/page.tsx`,
  );
  assert.ok(source.content.includes(heading));
  const previewUrl = await waitForPreview();
  assert.ok(
    (
      await (
        await fetch(previewUrl, { signal: AbortSignal.timeout(30000) })
      ).text()
    ).includes(heading),
  );
  console.log(
    "OpenCode edit, reference upload, model proxy, Git save and live preview passed",
  );
  const invalid = await fetch(`${base}${editorPath}/file?path=..%2F.env`, {
    headers: { Cookie: cookie },
  });
  assert.equal(invalid.status, 400);
  const publish = await fetch(`${base}${editorPath}/publish`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert.equal(publish.status, 501);
  const undone = await request<{ revisionId: string }>(
    `${editorPath}/undo`,
    "POST",
    { expectedRevisionId: finished.resultRevisionId },
  );
  assert.equal(undone.revisionId, initial.id);
  await waitForPreview();
  assert.ok(
    !(
      await request<{ content: string }>(`${editorPath}/file?path=app/page.tsx`)
    ).content.includes(heading),
  );
  const redone = await request<{ revisionId: string }>(
    `${editorPath}/redo`,
    "POST",
    { expectedRevisionId: initial.id },
  );
  assert.equal(redone.revisionId, finished.resultRevisionId);
  await waitForPreview();
  assert.ok(
    (
      await request<{ content: string }>(`${editorPath}/file?path=app/page.tsx`)
    ).content.includes(heading),
  );
  console.log("Undo/redo, source-path guards and disabled publishing passed");
} catch (error) {
  console.error("Live API check failed:", (error as Error).message);
  process.exitCode = 1;
} finally {
  if (marketplaceId) {
    if (runId) {
      await db.agentRun.updateMany({
        where: {
          id: runId,
          marketplaceId,
          status: { in: ["QUEUED", "RUNNING"] },
        },
        data: { cancelRequestedAt: new Date(), modelTokenHash: null },
      });
      for (let attempt = 0; attempt < 15; attempt++) {
        const current = await db.agentRun.findFirst({
          where: { id: runId, marketplaceId },
          select: { status: true },
        });
        if (!current || !["QUEUED", "RUNNING"].includes(current.status)) {
          break;
        }
        await delay(2000);
      }
    }
    for (const row of await db.themeSandbox.findMany({
      where: { marketplaceId },
      select: { providerSandboxId: true },
    })) {
      if (row.providerSandboxId) {
        await runtime.remove(row.providerSandboxId).catch(() => undefined);
      }
    }
    for (const row of await db.themeRevision.findMany({
      where: { marketplaceId },
      select: { storageKey: true },
    })) {
      if (row.storageKey) {
        keys.add(row.storageKey);
      }
    }
    for (const row of await db.agentAttachment.findMany({
      where: { marketplaceId },
      select: { objectStorageKey: true },
    })) {
      keys.add(row.objectStorageKey);
    }
    await db.$transaction(async (tx) => {
      await tx.agentUsage.deleteMany({ where: { marketplaceId } });
      await tx.agentRunEvent.deleteMany({ where: { marketplaceId } });
      await tx.agentAttachment.deleteMany({ where: { marketplaceId } });
      await tx.theme.updateMany({
        where: { marketplaceId },
        data: { headRevisionId: null, redoRevisionId: null, redoStack: [] },
      });
      await tx.agentRun.updateMany({
        where: { marketplaceId },
        data: { baseRevisionId: null, resultRevisionId: null },
      });
      await tx.themeSandbox.deleteMany({ where: { marketplaceId } });
      await tx.themeRevision.updateMany({
        where: { marketplaceId },
        data: {
          parentRevisionId: null,
          restoredFromRevisionId: null,
          agentRunId: null,
        },
      });
      await tx.themeRevision.deleteMany({ where: { marketplaceId } });
      await tx.agentRun.deleteMany({ where: { marketplaceId } });
      await tx.agentMessage.deleteMany({ where: { marketplaceId } });
      await tx.agentConversation.deleteMany({ where: { marketplaceId } });
      await tx.theme.deleteMany({ where: { marketplaceId } });
      await tx.marketplace.delete({ where: { id: marketplaceId } });
    });
  }
  if (ownerId) {
    await db.platformUser.delete({ where: { id: ownerId } });
  }
  for (const key of keys) {
    await r2.removePrivate(key);
  }
  await db.$disconnect();
  console.log("Only the integration check's isolated fixtures were removed");
}
