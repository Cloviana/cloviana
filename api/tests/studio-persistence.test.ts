import "reflect-metadata";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { isSourcePath } from "../src/modules/themes/domain/source-path";
import type { PrismaService } from "../src/platform/database/prisma/prisma.service";

test("read-only source paths reject traversal, runtime files, and secrets", () => {
  for (const path of [
    "../api/.env",
    "/etc/passwd",
    ".git/config",
    "src/../../.env",
    "node_modules/a.js",
    "src/.env.local",
    "src\\file.ts",
    "src//file.ts",
    "a\0b",
  ]) {
    assert.equal(isSourcePath(path), false, path);
  }
  for (const path of [
    "app/page.tsx",
    "src/components/button.tsx",
    "package.json",
  ]) {
    assert.equal(isSourcePath(path), true, path);
  }
});

test(
  "studio persistence preserves tenant boundaries, version navigation, cancellation and fencing",
  { skip: process.env.RUN_STUDIO_DB_TESTS !== "1" },
  async () => {
    const [
      { PrismaAgentModelAccess },
      { PrismaAgentRunRepository },
      { PrismaConversationRepository },
      { PrismaThemeEditorStore },
      { PrismaWorkspaceLeases },
      { PrismaService },
    ] = await Promise.all([
      import(
        "../src/modules/agents/infrastructure/prisma/prisma-agent-model-access"
      ),
      import(
        "../src/modules/agents/infrastructure/prisma/prisma-agent-run.repository"
      ),
      import(
        "../src/modules/agents/infrastructure/prisma/prisma-conversation.repository"
      ),
      import(
        "../src/modules/themes/infrastructure/prisma/prisma-theme-editor.store"
      ),
      import(
        "../src/modules/themes/infrastructure/prisma/prisma-workspace-leases"
      ),
      import("../src/platform/database/prisma/prisma.service"),
    ]);
    const db = new PrismaService();
    const rollback = new Error("ROLLBACK_STUDIO_TEST");
    try {
      await db.$transaction(
        async (tx) => {
          // Every operation shares this transaction; throw at the end so no fixtures persist.
          const transactional = new Proxy(tx, {
            get(target, key) {
              return key === "$transaction"
                ? async (operation: (client: typeof tx) => unknown) =>
                    operation(tx)
                : Reflect.get(target, key);
            },
          }) as unknown as PrismaService;
          const conversations = new PrismaConversationRepository(transactional);
          const agents = new PrismaAgentRunRepository(transactional);
          const models = new PrismaAgentModelAccess(transactional);
          const editor = new PrismaThemeEditorStore(transactional);
          const leases = new PrismaWorkspaceLeases(transactional);
          const owner = await tx.platformUser.create({
            data: { email: `studio-${randomUUID()}@example.invalid` },
          });
          const marketplace = await tx.marketplace.create({
            data: { ownerId: owner.id, slug: `studio-${randomUUID()}` },
          });
          const other = await tx.marketplace.create({
            data: { ownerId: owner.id, slug: `studio-${randomUUID()}` },
          });
          const theme = await tx.theme.create({
            data: {
              marketplaceId: marketplace.id,
              name: "Studio test",
              provisioningStatus: "READY",
              storageKey: "test/3.tar.gz",
              snapshotVersion: 1,
            },
          });
          let parent: string | undefined;
          const revisions: string[] = [];
          for (let i = 1; i <= 3; i++) {
            const revision = await tx.themeRevision.create({
              data: {
                marketplaceId: marketplace.id,
                themeId: theme.id,
                commitSha: String(i).repeat(40),
                storageKey: `test/${i}.tar.gz`,
                parentRevisionId: parent,
                origin: "SYSTEM",
              },
            });
            revisions.push(revision.id);
            parent = revision.id;
          }
          await tx.theme.update({
            where: { id: theme.id },
            data: { headRevisionId: revisions[2] },
          });
          await assert.rejects(editor.get(other.id, theme.id), /not found/i);
          for (const operation of ["undo", "undo", "redo", "redo"] as const) {
            await leases.withLease(marketplace.id, theme.id, async (lease) => {
              await assert.rejects(
                leases.withLease(
                  marketplace.id,
                  theme.id,
                  async () => undefined,
                ),
                /busy/i,
              );
              await editor.navigate(
                await editor.get(marketplace.id, theme.id),
                lease,
                operation,
              );
            });
          }
          assert.equal(
            (await editor.get(marketplace.id, theme.id)).headRevisionId,
            revisions[2],
          );
          await leases.withLease(marketplace.id, theme.id, async (lease) => {
            await editor.navigate(
              await editor.get(marketplace.id, theme.id),
              lease,
              "undo",
            );
            assert.equal(
              (await editor.get(marketplace.id, theme.id)).storageKey,
              "test/2.tar.gz",
            );
          });
          const conversation = await conversations.create(
            marketplace.id,
            owner.id,
          );
          const input = {
            marketplaceId: marketplace.id,
            ownerId: owner.id,
            conversationId: conversation.id,
            prompt: "Build a storefront",
            idempotencyKey: randomUUID(),
            themeId: theme.id,
            baseRevisionId: revisions[1],
          };
          const run = await agents.enqueue(input);
          assert.equal((await agents.enqueue(input)).id, run.id);
          await assert.rejects(
            agents.enqueue({ ...input, prompt: "Different request" }),
            /different request/i,
          );
          await assert.rejects(agents.run(other.id, run.id), /not found/i);
          await assert.rejects(
            agents.events(other.id, run.id, 0n),
            /not found/i,
          );
          await leases.withLease(marketplace.id, theme.id, async (lease) => {
            await assert.rejects(
              editor.navigate(
                await editor.get(marketplace.id, theme.id),
                lease,
                "undo",
              ),
              /active agent run/i,
            );
          });
          await agents.cancel(marketplace.id, run.id);
          assert.equal(
            (await agents.run(marketplace.id, run.id)).status,
            "CANCELLED",
          );
          assert.equal(
            (await agents.events(marketplace.id, run.id, 0n)).at(-1)?.type,
            "run.cancelled",
          );
          const workerToken = randomUUID();
          const next = await agents.enqueue({
            ...input,
            idempotencyKey: randomUUID(),
          });
          await tx.agentRun.update({
            where: { id: next.id },
            data: {
              status: "RUNNING",
              workerToken,
              startedAt: new Date(),
              heartbeatAt: new Date(),
            },
          });
          await models.issueModelToken(next, workerToken, "test-token-hash");
          assert.equal(
            await models.authorizeModelRequest(next.id, "wrong-hash"),
            false,
          );
          assert.equal(
            await models.authorizeModelRequest(next.id, "test-token-hash"),
            true,
          );
          await agents.cancel(marketplace.id, next.id);
          assert.equal(
            await models.authorizeModelRequest(next.id, "test-token-hash"),
            false,
          );
          await leases.withLease(marketplace.id, theme.id, async (lease) => {
            await assert.rejects(
              editor.commit(await editor.get(marketplace.id, theme.id), lease, {
                storageKey: "test/4.tar.gz",
                commitSha: "4".repeat(40),
                runId: next.id,
                ownerId: owner.id,
                message: "Cancelled change",
              }),
              /no longer active/i,
            );
          });
          const replacement = randomUUID();
          await assert.rejects(
            leases.withLease(marketplace.id, theme.id, async (lease) => {
              await tx.theme.update({
                where: { id: theme.id },
                data: {
                  workspaceLeaseToken: replacement,
                  workspaceLeaseUntil: new Date(Date.now() + 90000),
                },
              });
              await lease.assert();
            }),
            /expired/i,
          );
          assert.equal(
            (await tx.theme.findUniqueOrThrow({ where: { id: theme.id } }))
              .workspaceLeaseToken,
            replacement,
          );
          throw rollback;
        },
        { timeout: 30000 },
      );
    } catch (error) {
      if (error !== rollback) {
        throw error;
      }
    } finally {
      await db.$disconnect();
    }
  },
);
