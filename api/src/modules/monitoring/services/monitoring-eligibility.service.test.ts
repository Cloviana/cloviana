import assert from "node:assert/strict";
import test from "node:test";
import { MonitoringEligibilityService } from "./monitoring-eligibility.service";

test("MonitoringEligibilityService groups due prompts by business", async () => {
  const service = new MonitoringEligibilityService({
    prompt: {
      findMany: async () => [
        { id: "prompt_1", businessId: "business_a" },
        { id: "prompt_2", businessId: "business_a" },
        { id: "prompt_3", businessId: "business_b" },
      ],
    },
  } as any);

  const groups = await service.findDuePromptGroups(
    new Date("2026-04-17T00:00:00.000Z"),
  );

  assert.deepEqual(groups, [
    { businessId: "business_a", promptIds: ["prompt_1", "prompt_2"] },
    { businessId: "business_b", promptIds: ["prompt_3"] },
  ]);
});
