import assert from "node:assert/strict";
import { test } from "node:test";
import { EditThemeUseCase } from "../src/modules/themes/application/edit-theme/edit-theme.use-case";

const theme = {
  id: "theme",
  marketplaceId: "mp",
  commitSha: "a".repeat(40),
  headRevisionId: "rev-1",
};

/** Builds the use case over fakes, and records what it did. */
function setup(options: {
  changes?: string[];
  buildPasses?: boolean;
  leaseLost?: boolean;
}) {
  const calls: string[] = [];
  const commits: string[] = [];
  const leaseController = new AbortController();
  if (options.leaseLost) {
    leaseController.abort();
  }
  const useCase = new EditThemeUseCase(
    { execute: async () => theme } as never,
    {
      get: async () => theme,
      commit: async (_t: unknown, _l: unknown, input: { message: string }) => {
        commits.push(input.message);
        return "rev-2";
      },
      workspace: async () => ({ id: "sandbox-record" }),
      updateWorkspace: async () => undefined,
    } as never,
    { prepare: () => undefined, capturePicture: () => undefined } as never,
    {
      changes: async () => options.changes ?? [],
      validateBuild: async () => options.buildPasses ?? true,
      checkpoint: async () => ({ commitSha: "b".repeat(40) }),
      startPreview: async () => undefined,
      discard: async () => undefined,
    } as never,
    {
      withLease: async (
        _m: string,
        _t: string,
        run: (lease: unknown) => Promise<unknown>,
      ) =>
        run({
          token: "t",
          signal: leaseController.signal,
          assert: async () => undefined,
        }),
    } as never,
    {
      prepare: async () => "sandbox",
      stop: async () => {
        calls.push("stop");
      },
    } as never,
  );
  return { useCase, calls, commits };
}

const input = (signal: AbortSignal) => ({
  ownerId: "owner",
  slug: "shop",
  themeId: "theme",
  runId: "run",
  expectedRevisionId: "rev-1",
  message: "Make the header bigger",
  signal,
});

async function stoppedRun(options: Parameters<typeof setup>[0]) {
  const { useCase, calls, commits } = setup(options);
  const user = new AbortController();
  await assert.rejects(
    useCase.execute(input(user.signal), async ({ signal }) => {
      user.abort();
      signal.throwIfAborted();
    }),
  );
  return { calls, commits };
}

test("a finished run saves its revision with the user's message", async () => {
  const { useCase, commits } = setup({});
  const result = await useCase.execute(
    input(new AbortController().signal),
    async () => "done",
  );
  assert.equal(result.revisionId, "rev-2");
  assert.deepEqual(commits, ["Make the header bigger"]);
});

test("a stopped run keeps its work when something changed and the build passes", async () => {
  const { commits, calls } = await stoppedRun({ changes: ["app/page.tsx"] });
  assert.deepEqual(commits, ["Interrupted: Make the header bigger"]);
  assert.deepEqual(calls, ["stop"], "the workspace is still replaced");
});

test("a stopped run saves nothing when nothing changed", async () => {
  const { commits } = await stoppedRun({ changes: [] });
  assert.deepEqual(commits, []);
});

test("a stopped run saves nothing when the project doesn't build", async () => {
  const { commits } = await stoppedRun({
    changes: ["app/page.tsx"],
    buildPasses: false,
  });
  assert.deepEqual(commits, []);
});

test("a run that lost its lease saves nothing", async () => {
  const { commits } = await stoppedRun({
    changes: ["app/page.tsx"],
    leaseLost: true,
  });
  assert.deepEqual(commits, []);
});

test("a run that failed on its own, not stopped, saves nothing", async () => {
  const { useCase, commits } = setup({ changes: ["app/page.tsx"] });
  await assert.rejects(
    useCase.execute(input(new AbortController().signal), async () => {
      throw new Error("model failed");
    }),
    /model failed/,
  );
  assert.deepEqual(commits, []);
});
