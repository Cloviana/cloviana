import assert from "node:assert/strict";
import { test } from "node:test";
import { BlogDraftStatus } from "@prisma/client";
import { BlogWorkflow } from "./blog.workflow";

test("blog workflow records progress and persists the completed draft", async () => {
  const runtimeUpdates: Record<string, unknown>[] = [];
  let createdDraft: Record<string, unknown> | undefined;
  let completed: Record<string, unknown> | undefined;
  const prisma = {
    blogDraft: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdDraft = data;
        return { id: "draft-1", ...data };
      },
    },
  };
  const managedJobs = {
    runJob: async ({
      execute,
    }: {
      execute: () => Promise<Record<string, unknown>>;
    }) => {
      completed = await execute();
      return { id: "job-1", status: "SUCCESS", finishedAt: new Date() };
    },
  };
  const jobs = {
    setRuntime: async (_jobId: string, patch: Record<string, unknown>) => {
      runtimeUpdates.push(patch);
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      [
        'event: stage\ndata: {"index":7,"key":"generation","status":"start","detail":"writing"}',
        'event: done\ndata: {"title":"Draft title","markdown":"# Draft title\\nBody","sources":[],"violations":[],"revisions":1}',
        "",
      ].join("\n\n"),
      { status: 200 },
    );

  try {
    const workflow = new BlogWorkflow(
      prisma as never,
      managedJobs as never,
      jobs as never,
      { agentUrl: "http://agent:8000" } as never,
    );
    await workflow.run("job-1", "business-1", "topic");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(runtimeUpdates[0]?.percent, 78);
  assert.equal(createdDraft?.status, BlogDraftStatus.READY);
  assert.equal(completed?.draftId, "draft-1");
});
