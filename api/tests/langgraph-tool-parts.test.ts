import assert from "node:assert/strict";
import { test } from "node:test";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { ToolCallTracker } from "../src/modules/agents/infrastructure/engine/langgraph-tool-parts";

const asked = (id: string, name: string, args: object) => ({
  model: {
    messages: [
      new AIMessage({
        content: "",
        tool_calls: [{ id, name, args, type: "tool_call" }],
      }),
    ],
  },
});
const answered = (id: string, content: string, status?: "error") => ({
  tools: { messages: [new ToolMessage({ content, tool_call_id: id, status })] },
});

test("announces a call, then finishes it with the tool's result", () => {
  const tracker = new ToolCallTracker();
  assert.deepEqual(tracker.observe(asked("c1", "list_products", { page: 1 })), [
    {
      id: "c1",
      type: "tool",
      tool: "list_products",
      status: "running",
      input: '{"page":1}',
    },
  ]);
  assert.deepEqual(tracker.observe(answered("c1", "[]")), [
    {
      id: "c1",
      type: "tool",
      tool: "list_products",
      status: "completed",
      input: '{"page":1}',
      output: "[]",
    },
  ]);
});

test("reports a failed tool", () => {
  const tracker = new ToolCallTracker();
  tracker.observe(asked("c1", "get_product", {}));
  const [part] = tracker.observe(answered("c1", "not found", "error"));
  assert.equal(part.status, "error");
});

test("copes with a result for a call it never saw, and with odd updates", () => {
  const tracker = new ToolCallTracker();
  const [part] = tracker.observe(answered("x", "late"));
  assert.equal(part.tool, "tool");
  assert.deepEqual(tracker.observe(undefined), []);
  assert.deepEqual(tracker.observe({ node: { other: true } }), []);
  assert.deepEqual(tracker.observe({ node: { messages: "nope" } }), []);
});

test("keeps several calls apart", () => {
  const tracker = new ToolCallTracker();
  const model = {
    model: {
      messages: [
        new AIMessage({
          content: "",
          tool_calls: [
            { id: "a", name: "one", args: {}, type: "tool_call" },
            { id: "b", name: "two", args: {}, type: "tool_call" },
          ],
        }),
      ],
    },
  };
  assert.deepEqual(
    tracker.observe(model).map((p) => p.tool),
    ["one", "two"],
  );
  assert.equal(tracker.observe(answered("b", "ok"))[0].tool, "two");
});
