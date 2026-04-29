import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { ExaService } from "@/integrations/exa/exa.service";
import type {
  ContentsOptions,
  SearchResult,
} from "@/integrations/exa/exa.types";
import type {
  PromptResearchInput,
  ResearchDocument,
} from "./prompt-research.schemas";
import { SearchQueriesSchema } from "./prompt-research.schemas";

type ResearchSearchContents = ContentsOptions & {
  text: {
    maxCharacters: number;
  };
  highlights: {
    query: string;
    maxCharacters: number;
  };
  filterEmptyResults: true;
};

export async function collectResearchDocuments({
  groq,
  exa,
  promptsBaseDir,
  businessContext,
}: {
  groq: GroqService;
  exa: ExaService;
  promptsBaseDir: string;
  businessContext: PromptResearchInput;
}): Promise<ResearchDocument[]> {
  const queryGenerationPrompt = await loadPromptHbs(
    "generate-queries",
    {},
    { baseDir: promptsBaseDir },
  );

  const { queries } = await groq.parse({
    name: "generate-queries",
    schema: SearchQueriesSchema,
    model: "openai/gpt-oss-20b",
    reasoning_effort: "low",
    temperature: 0,
    messages: [
      { role: "system", content: queryGenerationPrompt },
      { role: "user", content: JSON.stringify(businessContext) },
    ],
  });

  const searchGuidancePrompt = await loadPromptHbs(
    "search-guidance",
    { icp: businessContext.icp, category: businessContext.category },
    { baseDir: promptsBaseDir },
  );

  const searchResults = await Promise.all(
    queries.map((query) =>
      exa.search<ResearchSearchContents>(query, {
        type: "auto",
        numResults: 3,
        systemPrompt: searchGuidancePrompt,
        includeDomains: [
          "reddit.com",
          "g2.com",
          "trustpilot.com",
          "capterra.com",
        ],
        contents: {
          text: { maxCharacters: 4000 },
          highlights: {
            query,
            maxCharacters: 1200,
          },
          filterEmptyResults: true,
        },
      }),
    ),
  );

  const seenUrls = new Set<string>();
  const documents: ResearchDocument[] = [];

  for (const response of searchResults) {
    for (const result of response.results) {
      const doc = toResearchDocument(result);
      if (doc && !seenUrls.has(doc.url)) {
        seenUrls.add(doc.url);
        documents.push(doc);
      }
    }
  }

  return documents;
}

function toResearchDocument(
  result: SearchResult<ResearchSearchContents>,
): ResearchDocument | null {
  const url = result.url.trim();
  if (!url) {
    return null;
  }

  const content =
    result.text?.trim() ||
    (result.highlights ?? [])
      .map((highlight) => highlight.trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();

  if (!content) {
    return null;
  }

  return {
    url,
    title: result.title?.trim() || url,
    content,
  };
}
