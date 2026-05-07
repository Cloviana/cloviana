import pLimit from "p-limit";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import type {
  BusinessProfile,
  Competitor,
  Doc,
} from "../../prompt-generation.types";
import { searchDocuments } from "./search-documents";

const CONCURRENT_REQUESTS = 4;
const RESULTS_PER_QUERY = 2;
const REVIEW_DOMAINS = ["g2.com", "capterra.com", "trustpilot.com"];

export async function collectReviewDocuments(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Doc[]> {
  const { exa, logger } = requirePromptGenerationDependencies(config);
  const limit = pLimit(CONCURRENT_REQUESTS);
  const queries = buildReviewQueries(state.profile, state.competitors);

  logger?.debug(
    `[${state.businessId}] Review document queries (${queries.length}): ${queries.join(" | ")}`,
  );

  const results = await Promise.all(
    queries.map((query) =>
      limit(() =>
        searchDocuments(exa, {
          query,
          sourceType: "REVIEW",
          includeDomains: REVIEW_DOMAINS,
          numResults: RESULTS_PER_QUERY,
        }),
      ),
    ),
  );

  const docs = results.flat();

  logger?.debug(`[${state.businessId}] Collected ${docs.length} review docs`);

  return docs;
}

function buildReviewQueries(
  profile: BusinessProfile,
  competitors: Competitor[],
): string[] {
  const vendors = [
    profile.name,
    ...competitors.map((competitor) => competitor.name),
  ]
    .map((name) => name.trim())
    .filter(Boolean);

  return vendors.map((vendor) => `${vendor} reviews`);
}
