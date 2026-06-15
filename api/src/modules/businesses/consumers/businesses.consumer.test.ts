import assert from "node:assert/strict";
import test from "node:test";
import { BusinessesConsumer } from "./businesses.consumer";

test("BusinessesConsumer runs business initialization when it receives a message", async () => {
  const receivedBusinessIds: string[] = [];
  const consumer = new BusinessesConsumer(
    {} as any,
    {
      run: async (businessId: string) => {
        receivedBusinessIds.push(businessId);
      },
    } as any,
    {} as any,
    {
      clearStaleInProgressBusinesses: async () => 0,
    } as any,
  );

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
  const consumer = new BusinessesConsumer(
    {} as any,
    {
      run: async () => {
        called = true;
      },
    } as any,
    {} as any,
    {
      clearStaleInProgressBusinesses: async () => 0,
    } as any,
  );

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

test("BusinessesConsumer cleans up stale in-progress businesses when it receives a cleanup event", async () => {
  const cutoffs: Date[] = [];
  const logs: string[] = [];
  const consumer = new BusinessesConsumer(
    {} as any,
    {
      run: async () => undefined,
    } as any,
    {} as any,
    {
      clearStaleInProgressBusinesses: async (cutoff: Date) => {
        cutoffs.push(cutoff);
        return 3;
      },
    } as any,
  );

  (consumer as any).logger = {
    log: (message: string) => {
      logs.push(message);
    },
    error: () => undefined,
  };

  await consumer.handleCleanupStaleBusinesses({
    cutoffIso: "2026-04-11T00:00:00.000Z",
  });

  assert.equal(cutoffs.length, 1);
  assert.equal(cutoffs[0]?.toISOString(), "2026-04-11T00:00:00.000Z");
  assert.equal(logs.length, 1);
});
