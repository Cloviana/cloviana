import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TRANSCRIPT_LIMITS,
  type TodosPart,
  type ToolPart,
} from "../src/modules/agents/domain/transcript";
import { TranscriptBuilder } from "../src/modules/agents/domain/transcript-builder";

const tool = (patch: Partial<ToolPart> = {}): ToolPart => ({
  id: "t1",
  type: "tool",
  tool: "read",
  status: "running",
  ...patch,
});

test("keeps parts in the order they first appeared", () => {
  const builder = new TranscriptBuilder();
  builder.upsert({ id: "a", type: "text", text: "one" });
  builder.upsert(tool({ id: "b" }));
  builder.upsert({ id: "a", type: "text", text: "one, updated" });
  assert.deepEqual(
    builder.parts().map((part) => part.id),
    ["a", "b"],
  );
  assert.deepEqual(builder.get("a"), {
    id: "a",
    type: "text",
    text: "one, updated",
  });
});

test("a later upsert replaces the earlier snapshot", () => {
  const builder = new TranscriptBuilder();
  builder.upsert(tool({ status: "running" }));
  builder.upsert(tool({ status: "completed", output: "42 lines" }));
  const [part] = builder.parts();
  assert.equal(part.type === "tool" && part.status, "completed");
  assert.equal(part.type === "tool" && part.output, "42 lines");
});

test("append adds streamed text and ignores other part types", () => {
  const builder = new TranscriptBuilder();
  builder.upsert({ id: "a", type: "text", text: "Hel" });
  builder.upsert(tool());
  assert.equal(builder.append("a", "lo"), "lo");
  assert.equal(builder.append("t1", "x"), "");
  assert.equal(builder.append("missing", "x"), "");
  assert.equal(builder.text(), "Hello");
});

test("append stops at the text limit and reports what it kept", () => {
  const builder = new TranscriptBuilder();
  builder.upsert({ id: "a", type: "text", text: "" });
  const full = "x".repeat(TRANSCRIPT_LIMITS.text);
  assert.equal(builder.append("a", full + "overflow").length, full.length);
  assert.equal(builder.append("a", "more"), "");
});

test("bounds oversized tool fields and todos", () => {
  const builder = new TranscriptBuilder();
  const stored = builder.upsert(
    tool({
      output: "o".repeat(TRANSCRIPT_LIMITS.toolOutput * 3),
      diff: {
        path: "a.ts",
        additions: 1,
        deletions: 1,
        patch: "p".repeat(TRANSCRIPT_LIMITS.diffPatch * 3),
      },
    }),
  ) as ToolPart;
  assert.equal(stored.output?.length, TRANSCRIPT_LIMITS.toolOutput);
  assert.equal(stored.diff?.patch.length, TRANSCRIPT_LIMITS.diffPatch);

  const todos = builder.upsert({
    id: "todos",
    type: "todos",
    items: Array.from({ length: 100 }, (_, i) => ({
      content: `step ${i}`,
      status: "pending" as const,
    })),
  }) as TodosPart;
  assert.equal(todos.items.length, TRANSCRIPT_LIMITS.todos);
});

test("refuses new parts past the cap but still updates existing ones", () => {
  const builder = new TranscriptBuilder();
  for (let i = 0; i < TRANSCRIPT_LIMITS.parts + 10; i++) {
    builder.upsert(tool({ id: `t${i}` }));
  }
  assert.equal(builder.parts().length, TRANSCRIPT_LIMITS.parts);
  builder.upsert(tool({ id: "t0", status: "completed" }));
  assert.equal((builder.get("t0") as ToolPart).status, "completed");
});

test("text joins only the text parts", () => {
  const builder = new TranscriptBuilder();
  builder.upsert({ id: "a", type: "text", text: "First." });
  builder.upsert(tool());
  builder.upsert({ id: "b", type: "text", text: "Second." });
  assert.equal(builder.text(), "First.\n\nSecond.");
});
