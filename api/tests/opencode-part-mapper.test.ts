import assert from "node:assert/strict";
import { test } from "node:test";
import type { Part } from "@opencode-ai/sdk/v2/client";
import { mapOpenCodePart } from "../src/modules/agents/infrastructure/engine/opencode-part-mapper";

const base = { sessionID: "s", messageID: "m" };
const ROOT = "/home/daytona/cloviana/project";

const tool = (id: string, name: string, state: object): Part =>
  ({ ...base, id, type: "tool", callID: id, tool: name, state }) as Part;

test("passes assistant text through and hides synthetic or ignored text", () => {
  assert.deepEqual(
    mapOpenCodePart({ ...base, id: "a", type: "text", text: "Hi" }),
    { id: "a", type: "text", text: "Hi" },
  );
  assert.equal(
    mapOpenCodePart({
      ...base,
      id: "a",
      type: "text",
      text: "x",
      synthetic: true,
    }),
    null,
  );
  assert.equal(
    mapOpenCodePart({
      ...base,
      id: "a",
      type: "text",
      text: "x",
      ignored: true,
    }),
    null,
  );
});

test("maps reasoning with its timing", () => {
  assert.deepEqual(
    mapOpenCodePart({
      ...base,
      id: "r",
      type: "reasoning",
      text: "thinking",
      time: { start: 10, end: 25 },
    }),
    {
      id: "r",
      type: "reasoning",
      text: "thinking",
      startedAt: 10,
      endedAt: 25,
    },
  );
});

test("a read never carries the file contents", () => {
  const part = mapOpenCodePart(
    tool("t", "read", {
      status: "completed",
      input: { filePath: `${ROOT}/app/page.tsx` },
      output: "line 1\nline 2\nline 3\nSECRET",
      title: "app/page.tsx",
      metadata: {},
      time: { start: 1, end: 3 },
    }),
  );
  assert.equal(part?.type, "tool");
  if (part?.type === "tool") {
    assert.equal(part.input, "app/page.tsx");
    assert.equal(part.output, "Read 4 lines");
    assert.equal(part.endedAt, 3);
    assert.ok(!JSON.stringify(part).includes("SECRET"));
  }
});

test("an edit carries a diff with counted changes and no sandbox paths", () => {
  const patch = [
    `--- ${ROOT}/app/page.tsx`,
    `+++ ${ROOT}/app/page.tsx`,
    "@@ -1,2 +1,3 @@",
    "-old",
    "+new",
    "+extra",
    " same",
  ].join("\n");
  const part = mapOpenCodePart(
    tool("t", "edit", {
      status: "completed",
      input: { filePath: `${ROOT}/app/page.tsx` },
      output: "Edit applied successfully.",
      title: `${ROOT}/app/page.tsx`,
      metadata: { diff: patch },
      time: { start: 1, end: 2 },
    }),
  );
  assert.equal(part?.type, "tool");
  if (part?.type === "tool") {
    assert.equal(part.title, "app/page.tsx");
    assert.equal(part.output, undefined);
    assert.equal(part.diff?.path, "app/page.tsx");
    assert.equal(part.diff?.additions, 2);
    assert.equal(part.diff?.deletions, 1);
    assert.ok(!part.diff?.patch.includes(ROOT));
  }
});

test("running and pending tools have no output or end time yet", () => {
  const running = mapOpenCodePart(
    tool("t", "grep", {
      status: "running",
      input: { pattern: "Welcome" },
      time: { start: 5 },
    }),
  );
  assert.deepEqual(running, {
    id: "t",
    type: "tool",
    tool: "grep",
    status: "running",
    title: undefined,
    input: "Welcome",
    output: undefined,
    diff: undefined,
    startedAt: 5,
    endedAt: undefined,
  });
  const pending = mapOpenCodePart(
    tool("t", "bash", { status: "pending", input: {}, raw: "" }),
  );
  assert.equal(pending?.type === "tool" && pending.status, "pending");
});

test("a failed tool reports its error", () => {
  const part = mapOpenCodePart(
    tool("t", "bash", {
      status: "error",
      input: { command: "npm run build" },
      error: `failed in ${ROOT}/app`,
      time: { start: 1, end: 4 },
    }),
  );
  assert.equal(part?.type === "tool" && part.status, "error");
  assert.equal(part?.type === "tool" && part.output, "failed in app");
});

test("the todo tool becomes the todo list, whatever the call", () => {
  const part = mapOpenCodePart(
    tool("t", "todowrite", {
      status: "completed",
      input: {
        todos: [
          {
            content: "Find the heading",
            status: "completed",
            priority: "high",
          },
          { content: "Edit it", status: "in_progress", priority: "high" },
          { content: "Odd one", status: "mystery", priority: "low" },
          { nope: true },
        ],
      },
      output: "",
      title: "",
      metadata: {},
      time: { start: 1, end: 2 },
    }),
  );
  assert.deepEqual(part, {
    id: "todos",
    type: "todos",
    items: [
      { content: "Find the heading", status: "completed" },
      { content: "Edit it", status: "in_progress" },
      { content: "Odd one", status: "pending" },
    ],
  });
});

test("a model retry becomes a notice, and bookkeeping parts disappear", () => {
  const retry = mapOpenCodePart({
    ...base,
    id: "x",
    type: "retry",
    attempt: 2,
    error: {} as never,
    time: { created: 1 },
  });
  assert.equal(retry?.type === "notice" && retry.level, "warning");
  for (const type of ["step-start", "snapshot", "patch", "agent"] as const) {
    assert.equal(
      mapOpenCodePart({ ...base, id: "p", type } as unknown as Part),
      null,
    );
  }
});
