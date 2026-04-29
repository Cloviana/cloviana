import assert from "node:assert/strict";
import test from "node:test";
import { MonitoringConsumer } from "./monitoring.consumer";

test("MonitoringConsumer runs monitoring for the provided prompt subset", async () => {
  const calls: Array<{ businessId: string; promptIds: string[] }> = [];
  const consumer = new MonitoringConsumer({
    run: async (businessId: string, promptIds: string[]) => {
      calls.push({ businessId, promptIds });
    },
  } as any);

  (consumer as any).logger = {
    log: () => undefined,
    error: () => undefined,
  };

  await consumer.handleRunMonitoring({
    businessId: "business_123",
    promptIds: ["prompt_1", "prompt_2"],
  });

  assert.deepEqual(calls, [
    { businessId: "business_123", promptIds: ["prompt_1", "prompt_2"] },
  ]);
});

test("MonitoringConsumer ignores invalid payloads", async () => {
  let called = false;
  const errors: string[] = [];
  const consumer = new MonitoringConsumer({
    run: async () => {
      called = true;
    },
  } as any);

  (consumer as any).logger = {
    log: () => undefined,
    error: (message: string) => {
      errors.push(message);
    },
  };

  await consumer.handleRunMonitoring({
    businessId: "business_123",
    promptIds: [],
  });

  assert.equal(called, false);
  assert.equal(errors.length, 1);
});
