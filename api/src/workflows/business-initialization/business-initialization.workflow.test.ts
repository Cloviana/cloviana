import assert from "node:assert/strict";
import test from "node:test";
import { BusinessInitializationWorkflow } from "./business-initialization.workflow";

test("BusinessInitializationWorkflow runs prompt research and activates the business", async () => {
  const businessUpdates: Array<any> = [];
  const receivedBusinessIds: string[] = [];

  const workflow = new BusinessInitializationWorkflow(
    {
      business: {
        update: async (args: any) => {
          businessUpdates.push(args);
          return args;
        },
      },
    } as never,
    {
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
    } as never,
    {
      run: async (businessId: string) => {
        receivedBusinessIds.push(businessId);
        return { id: "child-job", status: "SUCCESS" };
      },
    } as never,
  );

  const result = await workflow.run("business-1");

  assert.deepEqual(receivedBusinessIds, ["business-1"]);
  assert.deepEqual(result, {
    completedSteps: ["PROMPT_RESEARCH"],
  });
  assert.equal(
    businessUpdates.some((update) => update.data.status === "PROCESSING"),
    true,
  );
  assert.equal(
    businessUpdates.some((update) => update.data.status === "ACTIVE"),
    true,
  );
});

test("BusinessInitializationWorkflow marks the business failed when a child step fails", async () => {
  const businessUpdates: Array<any> = [];

  const workflow = new BusinessInitializationWorkflow(
    {
      business: {
        update: async (args: any) => {
          businessUpdates.push(args);
          return args;
        },
      },
    } as never,
    {
      runManagedBusinessJob: async ({ execute, onFailure }: any) => {
        try {
          await execute({ jobId: "job-1" });
          return null;
        } catch (error: any) {
          await onFailure({
            jobId: "job-1",
            businessId: "business-1",
            error: error.message,
            finishedAt: new Date(),
          });
          throw error;
        }
      },
    } as never,
    {
      run: async () => {
        throw new Error("child failed");
      },
    } as never,
  );

  await assert.rejects(() => workflow.run("business-1"));

  assert.equal(
    businessUpdates.some((update) => update.data.status === "FAILED"),
    true,
  );
});
