import assert from "node:assert/strict";
import { test } from "node:test";
import { TranscriptPublisher } from "../src/modules/agents/application/transcript/transcript-publisher";
import type { Json } from "../src/modules/agents/domain/agent.types";
import type { TranscriptPart } from "../src/modules/agents/domain/transcript";

function setup(windowMs = 5) {
  const events: Array<{ type: string; payload: Json }> = [];
  const publisher = new TranscriptPublisher(async (type, payload) => {
    events.push({ type, payload });
  }, windowMs);
  return { events, publisher };
}

const text = (value: string): TranscriptPart => ({
  id: "a",
  type: "text",
  text: value,
});

test("a new part goes out as one upsert", async () => {
  const { events, publisher } = setup();
  publisher.snapshot(text("Hi"));
  await publisher.flush();
  assert.deepEqual(events, [
    { type: "part.upsert", payload: { part: text("Hi") } },
  ]);
});

test("a snapshot that only extends the text goes out as a delta", async () => {
  const { events, publisher } = setup();
  publisher.snapshot(text("Hel"));
  publisher.snapshot(text("Hello"));
  await publisher.flush();
  assert.deepEqual(
    events.map((e) => e.type),
    ["part.upsert", "part.delta"],
  );
  assert.deepEqual(events[1].payload, { id: "a", text: "lo" });
  assert.equal(publisher.text(), "Hello");
});

test("unchanged snapshots publish nothing", async () => {
  const { events, publisher } = setup();
  publisher.snapshot(text("Hi"));
  publisher.snapshot(text("Hi"));
  await publisher.flush();
  assert.equal(events.length, 1);
});

test("a snapshot that rewrites the text goes out as a full upsert", async () => {
  const { events, publisher } = setup();
  publisher.snapshot(text("Hello"));
  publisher.snapshot(text("Goodbye"));
  await publisher.flush();
  assert.deepEqual(
    events.map((e) => e.type),
    ["part.upsert", "part.upsert"],
  );
});

test("batches rapid appends into one delta", async () => {
  const { events, publisher } = setup(20);
  publisher.snapshot(text(""));
  for (const piece of ["a", "b", "c", "d"]) {
    publisher.append("a", piece);
  }
  await publisher.flush();
  assert.deepEqual(
    events.map((e) => e.type),
    ["part.upsert", "part.delta"],
  );
  assert.deepEqual(events[1].payload, { id: "a", text: "abcd" });
});

test("sends buffered text by itself after the window passes", async () => {
  const { events, publisher } = setup(5);
  publisher.snapshot(text(""));
  publisher.append("a", "x");
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(events.at(-1)?.type, "part.delta");
  await publisher.flush();
});

test("pending text goes out before a later snapshot of the same part", async () => {
  const { events, publisher } = setup(1000);
  publisher.snapshot({ id: "r", type: "reasoning", text: "a", startedAt: 1 });
  publisher.append("r", "b");
  publisher.snapshot({
    id: "r",
    type: "reasoning",
    text: "ab",
    startedAt: 1,
    endedAt: 9,
  });
  await publisher.flush();
  assert.deepEqual(
    events.map((e) => e.type),
    ["part.upsert", "part.delta", "part.upsert"],
  );
});

test("keeps events in order even when storing them is slow", async () => {
  const seen: string[] = [];
  const publisher = new TranscriptPublisher(async (type, payload) => {
    await new Promise((resolve) =>
      setTimeout(resolve, type === "part.upsert" ? 15 : 1),
    );
    seen.push(`${type}:${JSON.stringify(payload).length}`);
  }, 1);
  publisher.snapshot(text(""));
  publisher.snapshot({ id: "b", type: "text", text: "second" });
  await publisher.flush();
  assert.deepEqual(
    seen.map((entry) => entry.split(":")[0]),
    ["part.upsert", "part.upsert"],
  );
});

test("flush reports a failed store and later events are dropped", async () => {
  let calls = 0;
  const publisher = new TranscriptPublisher(async () => {
    calls += 1;
    throw new Error("run is no longer active");
  }, 1);
  publisher.snapshot(text("Hi"));
  publisher.snapshot({ id: "b", type: "text", text: "more" });
  await assert.rejects(publisher.flush(), /no longer active/);
  assert.equal(calls, 1);
});

test("exposes the finished transcript", async () => {
  const { publisher } = setup();
  publisher.snapshot(text("Answer"));
  publisher.snapshot({
    id: "t",
    type: "tool",
    tool: "read",
    status: "completed",
  });
  await publisher.flush();
  assert.deepEqual(
    publisher.parts().map((part) => part.id),
    ["a", "t"],
  );
});

test("remembers the saved revision and announces it in order", async () => {
  const { events, publisher } = setup();
  publisher.snapshot(text("Done"));
  publisher.revisionSaved("rev-9");
  await publisher.flush();
  assert.deepEqual(events.at(-1), {
    type: "revision.saved",
    payload: { revisionId: "rev-9" },
  });
  assert.deepEqual(publisher.saved().revisionId, "rev-9");
  assert.equal(publisher.saved().text, "Done");
});

test("a run that saved no revision carries none", async () => {
  const { publisher } = setup();
  publisher.snapshot(text("Hi"));
  assert.equal("revisionId" in publisher.saved(), false);
});
