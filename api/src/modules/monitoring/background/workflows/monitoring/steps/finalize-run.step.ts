import { PrismaService } from "@/clients/prisma/prisma.service";
import { computePromptMetrics } from "../monitoring.metrics";
import { persistMonitoringRun } from "../monitoring.persistence";
import type {
  MonitoringEngineResponse,
  MonitoringRunInput,
  MonitoringRunResult,
  MonitoringRunSummary,
  SerializedMonitoringRunInput,
} from "../monitoring.types";

export async function finalizeRunStep(
  prisma: PrismaService,
  serializedInput: SerializedMonitoringRunInput,
  engineResponses: MonitoringEngineResponse[],
): Promise<MonitoringRunSummary> {
  const input: MonitoringRunInput = {
    businessId: serializedInput.businessId,
    date: new Date(serializedInput.dateIso),
    prompts: serializedInput.prompts,
    brands: serializedInput.brands,
  };
  const runResult: MonitoringRunResult = {
    ...input,
    engineResponses,
    promptMetrics: computePromptMetrics(input, engineResponses),
  };
  const { businessMetricCount } = await persistMonitoringRun(prisma, runResult);

  return {
    date: input.date.toISOString().slice(0, 10),
    promptCount: input.prompts.length,
    responseCount: engineResponses.length,
    promptMetricCount: runResult.promptMetrics.length,
    businessMetricCount,
  };
}
