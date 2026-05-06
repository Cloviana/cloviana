import type { ExaService } from "@/integrations/exa/exa.service";
import type {
  ContentsOptions,
  SearchResult,
} from "@/integrations/exa/exa.types";
import type { Doc, SourceType } from "../../prompt-generation.types";

type ExternalDocumentSearchContents = ContentsOptions & {
  text: {
    maxCharacters: number;
  };
  highlights: {
    query: string;
    maxCharacters: number;
  };
  filterEmptyResults: true;
};

export async function searchDocuments(
  exa: ExaService,
  {
    includeDomains,
    numResults,
    query,
    sourceType,
  }: {
    query: string;
    sourceType: SourceType;
    includeDomains: string[];
    numResults: number;
  },
): Promise<Doc[]> {
  const response = await exa.search<ExternalDocumentSearchContents>(query, {
    type: "auto",
    numResults,
    includeDomains,
    contents: {
      text: { maxCharacters: 4000 },
      highlights: {
        query,
        maxCharacters: 1200,
      },
      filterEmptyResults: true,
    },
  });

  return response.results
    .map((result) => toDocument(result, sourceType))
    .filter((doc): doc is Doc => doc !== null);
}

export function dedupeDocuments(docs: Doc[]): Doc[] {
  const seenUrls = new Set<string>();
  const deduped: Doc[] = [];

  for (const doc of docs) {
    const key = doc.url ?? doc.id;
    if (seenUrls.has(key)) {
      continue;
    }

    seenUrls.add(key);
    deduped.push(doc);
  }

  return deduped;
}

function toDocument(
  result: SearchResult<ExternalDocumentSearchContents>,
  sourceType: SourceType,
): Doc | null {
  const url = result.url.trim();
  if (!url) {
    return null;
  }

  const text =
    result.text?.trim() ||
    (result.highlights ?? [])
      .map((highlight) => highlight.trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();

  if (!text) {
    return null;
  }

  return {
    id: `${sourceType.toLowerCase()}:${url}`,
    text,
    sourceType,
    url,
    title: result.title?.trim() || url,
  };
}
