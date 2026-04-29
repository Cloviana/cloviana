import assert from "node:assert/strict";
import test from "node:test";
import { PromptResearchRunner } from "./prompt-research.runner";

test("PromptResearchRunner resolves competitor names and saves prompts", async () => {
  const promptDeletes: Array<any> = [];
  const promptCreates: Array<any> = [];

  const prisma = {
    business: {
      findUniqueOrThrow: async () => ({
        id: "business-1",
        name: "Cloviana",
        domain: "cloviana.com",
        category: "AI search visibility software",
        description: "Helps brands measure AI search visibility.",
        icp: "B2B SaaS marketing teams",
        competitors: [
          { domain: "competitor-one.com" },
          { domain: "competitor-two.com" },
        ],
      }),
      update: async () => undefined,
    },
    prompt: {
      deleteMany: async (args: any) => {
        promptDeletes.push(args);
        return args;
      },
      createMany: async (args: any) => {
        promptCreates.push(args);
        return args;
      },
    },
    $transaction: async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
  };

  const managedJobs = {
    runManagedBusinessJob: async ({
      execute,
      onSuccess,
      serializeResult,
    }: any) => {
      const result = await execute({ jobId: "job-1" });
      await onSuccess({
        jobId: "job-1",
        businessId: "business-1",
        result,
        finishedAt: new Date(),
      });

      return serializeResult(result);
    },
  };

  const promptResearchWorkflow = {
    run: async (input: any) => {
      assert.deepEqual(input, {
        brand: "Cloviana",
        category: "AI search visibility software",
        description: "Helps brands measure AI search visibility.",
        icp: "B2B SaaS marketing teams",
        competitors: ["Competitor One", "competitor-two.com"],
      });

      return {
        selectedPrompts: [
          {
            promptId: 0,
            prompt: "best ai search visibility tools",
            awarenessStage: "EVALUATE",
          },
          {
            promptId: 1,
            prompt: "alternatives to competitor one",
            awarenessStage: "DECIDE",
          },
        ],
      };
    },
  };

  const businessResearch = {
    enrichProfile: async (domain: string) => {
      if (domain === "competitor-one.com") {
        return {
          name: "Competitor One",
          category: "AI search visibility software",
          description: "desc",
          icp: "icp",
        };
      }

      throw new Error("lookup failed");
    },
  };

  const workflow = new PromptResearchRunner(
    prisma as never,
    managedJobs as never,
    promptResearchWorkflow as never,
    businessResearch as never,
  );

  const result = await workflow.run("business-1");

  assert.deepEqual(result, {
    selectedPrompts: 2,
    activePrompts: 2,
    inactivePrompts: 0,
  });
  assert.deepEqual(promptDeletes, [{ where: { businessId: "business-1" } }]);
  assert.equal(promptCreates.length, 1);
  assert.deepEqual(promptCreates[0].data, [
    {
      businessId: "business-1",
      text: "best ai search visibility tools",
      stage: "EVALUATE",
      status: "ACTIVE",
    },
    {
      businessId: "business-1",
      text: "alternatives to competitor one",
      stage: "DECIDE",
      status: "ACTIVE",
    },
  ]);
});
