import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { AiEngine } from "@prisma/client";
import type {
  MonitoringEngineResponse,
  SerializedMonitoringRunInput,
} from "../monitoring.types";
import { toCitation } from "../utils/citation.util";

export async function executePerplexityStep(
  dataForSeo: DataForSeoService,
  input: SerializedMonitoringRunInput,
): Promise<MonitoringEngineResponse[]> {
  const results = await Promise.allSettled(
    input.prompts.map(async (prompt): Promise<MonitoringEngineResponse> => {
      const answer = await dataForSeo.getAiAnswer({
        engine: "perplexity",
        prompt: prompt.text,
        forceWebSearch: false,
      });
      const citations = await Promise.all(answer.citations.map(toCitation));

      return {
        responseKey: `${AiEngine.PERPLEXITY}:${prompt.id}`,
        engine: AiEngine.PERPLEXITY,
        promptId: prompt.id,
        content: answer.content,
        webSearch: answer.webSearch,
        citations,
        mentions: [],
        sentimentClaims: [],
        fanOutQueries: answer.fanOutQueries.map((query) => ({
          query,
          inferred: false,
        })),
      };
    }),
  );
  const responses = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (responses.length === 0) {
    throw new Error("Perplexity returned no successful responses");
  }

  return responses;
}
