import assert from "node:assert/strict";
import test from "node:test";
import { BusinessesConsumer } from "./businesses.consumer";

test("BusinessesConsumer runs business initialization when it receives a message", async () => {
  const receivedBusinessIds: string[] = [];
  const consumer = new BusinessesConsumer({
    run: async (businessId: string) => {
      receivedBusinessIds.push(businessId);
    },
  } as any);

  (consumer as any).logger = {
    log: () => undefined,
    error: () => undefined,
  };

  await consumer.handleRunBusinessInitialization({
    businessId: "business_123",
  });

  assert.deepEqual(receivedBusinessIds, ["business_123"]);
});

test("BusinessesConsumer ignores invalid business initialization payloads", async () => {
  let called = false;
  const errors: string[] = [];
  const consumer = new BusinessesConsumer({
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

  await consumer.handleRunBusinessInitialization({ businessId: "" });

  assert.equal(called, false);
  assert.equal(errors.length, 1);
});
