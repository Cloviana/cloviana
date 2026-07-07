// Graph node: for responses whose engine didn't return its own fan-out
// queries (search-driven engines only — see INFERENCE_ENGINES below), infer
// them from the cited sources instead. ChatGPT is a special case: its scrape
// task's `search_results` are a better source list than its `citations`.
import type { ChatGptScrapeSearchResultItem } from "@/integrations/dataforseo/dataforseo.types";
import {
  type MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.context";
import type { MonitoringState } from "../monitoring.state";
import type {
  Citation,
  EngineResponse,
  ResponseFanOutInference,
} from "../monitoring.types";
import {
  type FanOutInferenceCandidate,
  inferFanOutQueries,
} from "../fan-out/fan-out-query-inference";
import { extractResponseContent } from "../engines/extract-response-content";
import {
  canonicalSourceUrl,
  prepareInferenceSources,
} from "../fan-out/fan-out-inference-sources";

const INFERENCE_ENGINES = new Set<EngineResponse["engine"]>([
  "chatgpt",
  "perplexity",
  "google-aio",
]);

function isChatGptSearchResult(
  value: unknown,
): value is ChatGptScrapeSearchResultItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    typeof value.url === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "description" in value &&
    typeof value.description === "string"
  );
}

function chatGptSearchResults(response: EngineResponse) {
  if (
    typeof response.raw !== "object" ||
    response.raw === null ||
    !("search_results" in response.raw) ||
    !Array.isArray(response.raw.search_results)
  ) {
    return [];
  }

  return response.raw.search_results.filter(isChatGptSearchResult);
}

async function inferenceSources(response: EngineResponse): Promise<Citation[]> {
  if (response.engine !== "chatgpt") {
    return prepareInferenceSources(response.citations);
  }

  const searchResults = [
    ...new Map(
      chatGptSearchResults(response).map((result) => [
        canonicalSourceUrl(result.url),
        result,
      ]),
    ).values(),
  ];

  if (searchResults.length === 0) {
    return prepareInferenceSources(response.citations);
  }

  const { citations } = await extractResponseContent(
    "",
    searchResults.map((result) => ({
      url: result.url,
      title: result.title,
      fallbackText: result.description,
    })),
  );
  const preparedSearchResults = prepareInferenceSources(citations);

  return preparedSearchResults.length > 0
    ? preparedSearchResults
    : prepareInferenceSources(response.citations);
}

export async function inferFanOutQueriesNode(
  state: MonitoringState,
  config: MonitoringNodeConfig,
): Promise<{ fanOutInferences: ResponseFanOutInference[] }> {
  const { groq, logger } = requireMonitoringDependencies(config);
  const promptById = new Map(
    state.prompts.map((prompt) => [prompt.id, prompt.text]),
  );
  const eligibleResponses = state.rawEngineResponses.filter(
    (response) =>
      INFERENCE_ENGINES.has(response.engine) &&
      response.fanOutQueries.length === 0,
  );

  const candidates = (
    await Promise.all(
      eligibleResponses.map(
        async (response): Promise<FanOutInferenceCandidate | null> => {
          const sources = await inferenceSources(response);
          if (sources.length === 0) return null;

          return {
            responseKey: response.responseKey,
            prompt: promptById.get(response.promptId) ?? "",
            sources,
          };
        },
      ),
    )
  ).filter(
    (candidate): candidate is FanOutInferenceCandidate => candidate !== null,
  );

  if (candidates.length === 0) {
    logger?.debug(
      `[${state.businessId}] Fan-out inference skipped eligible=${eligibleResponses.length} candidates=0`,
    );
    return { fanOutInferences: [] };
  }

  logger?.debug(
    `[${state.businessId}] Fan-out inference started candidates=${candidates.length}`,
  );

  const queriesByResponseKey = await inferFanOutQueries(groq, candidates, {
    businessId: state.businessId,
    logger,
  });

  const fanOutInferences = candidates.flatMap(({ responseKey }) => {
    const queries = queriesByResponseKey.get(responseKey) ?? [];
    return queries.length > 0 ? [{ responseKey, queries }] : [];
  });

  logger?.log(
    `[${state.businessId}] Fan-out inference completed candidates=${candidates.length} inferred=${fanOutInferences.length}`,
  );

  return { fanOutInferences };
}
