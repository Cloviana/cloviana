import assert from "node:assert/strict";
import test from "node:test";
import { MonitoringScheduler } from "./monitoring.scheduler";

test("MonitoringScheduler enqueues all due business prompt groups", async () => {
  const emitted: Array<{ businessId: string; promptIds: string[] }> = [];
  const scheduler = new MonitoringScheduler(
    {
      findDuePromptGroups: async () => [
        { businessId: "business_a", promptIds: ["prompt_1"] },
        { businessId: "business_b", promptIds: ["prompt_2", "prompt_3"] },
      ],
    } as any,
    {
      runMonitoring: async (payload: {
        businessId: string;
        promptIds: string[];
      }) => {
        emitted.push(payload);
      },
    } as any,
  );

  (scheduler as any).logger = {
    log: () => undefined,
  };

  await scheduler.enqueueDueMonitoringRuns();

  assert.deepEqual(emitted, [
    { businessId: "business_a", promptIds: ["prompt_1"] },
    { businessId: "business_b", promptIds: ["prompt_2", "prompt_3"] },
  ]);
});
