import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import type { Doc } from "../../prompt-generation.types";
import { searchDocuments } from "./search-documents";

const RESULTS_PER_QUERY = 2;
const FORUM_DOMAINS = ["quora.com", "news.ycombinator.com"];

const ForumSearchQueriesSchema = z.object({
  queries: z.array(z.string().min(1)).min(6).max(8),
});

export async function collectForumDocuments(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Doc[]> {
  const { exa, groq, logger } = requirePromptGenerationDependencies(config);
  const queries = await generateForumQueries(state, groq);

  logger?.debug(
    `[${state.businessId}] Forum document queries (${queries.length}): ${queries.join(" | ")}`,
  );

  const results = await Promise.all(
    queries.map((query) =>
      searchDocuments(exa, {
        query,
        sourceType: "FORUM",
        includeDomains: FORUM_DOMAINS,
        numResults: RESULTS_PER_QUERY,
      }),
    ),
  );

  const docs = results.flat();

  logger?.debug(`[${state.businessId}] Collected ${docs.length} forum docs`);

  return docs;
}

async function generateForumQueries(
  state: typeof StateAnnotation.State,
  groq: ReturnType<typeof requirePromptGenerationDependencies>["groq"],
): Promise<string[]> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const prompt = await loadPromptHbs(
    "generate-forum-search-queries",
    {},
    { baseDir },
  );

  const result = await groq.parse({
    name: "generate-forum-search-queries",
    schema: ForumSearchQueriesSchema,
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          profile: state.profile,
          competitors: state.competitors,
          extraContext: state.extraContext,
        }),
      },
    ],
  });

  return result.queries;
}
