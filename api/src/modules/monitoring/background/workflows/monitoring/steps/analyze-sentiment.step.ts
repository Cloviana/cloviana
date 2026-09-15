import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { extractMentions } from "@/common/visibility/extract-mentions";
import { Logger } from "@nestjs/common";
import pLimit from "p-limit";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { z } from "zod";
import type {
  MonitoringEngineResponse,
  MonitoringSentimentClaim,
  SerializedMonitoringRunInput,
} from "../monitoring.types";

const SENTIMENT_MODEL = "openai/gpt-oss-120b";
// Analysis fans out to one call per mentioned brand, so a busy run multiplies
// by the competitor count. Capped rather than firing the whole set at once.
const SENTIMENT_CONCURRENCY = 5;
const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts",
);
const logger = new Logger("AnalyzeSentimentStep");
const SentimentAnalysisSchema = z.object({
  claims: z
    .array(
      z.object({
        label: z.string().min(1).max(100),
        sentiment: z.enum(["POSITIVE", "NEGATIVE"]),
        evidenceSpanIds: z.array(z.string()).min(1),
      }),
    )
    .max(20),
});

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  position?: {
    start: { offset?: number };
    end: { offset?: number };
  };
};

type VisibleCharacter = {
  value: string;
  rawOffset: number;
};

type EvidenceSpan = {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
};

function collectVisibleCharacters(
  markdown: string,
  node: MarkdownNode,
): VisibleCharacter[] {
  // Links are skipped alongside images and code because every answer is
  // normalised so that a link is only ever a citation marker — never prose. A
  // `[1]` landing mid-sentence would otherwise split the evidence span.
  if (
    node.type === "image" ||
    node.type === "html" ||
    node.type === "code" ||
    node.type === "link"
  ) {
    return [];
  }
  if (node.type === "break") {
    const rawOffset = node.position?.start.offset;
    return rawOffset === undefined ? [] : [{ value: " ", rawOffset }];
  }
  if (node.children) {
    return node.children.flatMap((child) =>
      collectVisibleCharacters(markdown, child),
    );
  }
  if (!node.value || !node.position) {
    return [];
  }

  const rawStart = node.position.start.offset;
  const rawEnd = node.position.end.offset;
  if (rawStart === undefined || rawEnd === undefined) {
    return [];
  }

  const rawValue = markdown.slice(rawStart, rawEnd);
  const valueIndex = rawValue.indexOf(node.value);
  const valueStart = rawStart + Math.max(valueIndex, 0);

  const characters: VisibleCharacter[] = [];
  for (let index = 0; index < node.value.length; index += 1) {
    characters.push({
      value: node.value[index] ?? "",
      rawOffset: valueStart + index,
    });
  }
  return characters;
}

function segmentBlock(
  markdown: string,
  node: MarkdownNode,
): Omit<EvidenceSpan, "id">[] {
  const characters = collectVisibleCharacters(markdown, node);
  const visibleText = characters.map(({ value }) => value).join("");
  if (!visibleText.trim()) {
    return [];
  }

  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  const spans: Omit<EvidenceSpan, "id">[] = [];

  for (const segment of segmenter.segment(visibleText)) {
    const leadingWhitespace = segment.segment.search(/\S/u);
    if (leadingWhitespace < 0) {
      continue;
    }
    const trailingWhitespace =
      segment.segment.length - segment.segment.trimEnd().length;
    const visibleStart = segment.index + leadingWhitespace;
    const visibleEnd =
      segment.index + segment.segment.length - trailingWhitespace;
    const firstCharacter = characters[visibleStart];
    const lastCharacter = characters[visibleEnd - 1];
    if (!firstCharacter || !lastCharacter) {
      continue;
    }

    spans.push({
      text: visibleText.slice(visibleStart, visibleEnd),
      startOffset: firstCharacter.rawOffset,
      endOffset: lastCharacter.rawOffset + lastCharacter.value.length,
    });
  }

  return spans;
}

function createEvidenceSpans(markdown: string): EvidenceSpan[] {
  const tree = unified().use(remarkParse).parse(markdown) as MarkdownNode;
  const blocks: MarkdownNode[] = [];

  const visit = (node: MarkdownNode): void => {
    if (node.type === "paragraph" || node.type === "heading") {
      blocks.push(node);
      return;
    }
    node.children?.forEach(visit);
  };
  visit(tree);

  return blocks
    .flatMap((block) => segmentBlock(markdown, block))
    .sort((a, b) => a.startOffset - b.startOffset)
    .map((span, index) => ({ ...span, id: `span-${index + 1}` }));
}

function normalizeClaims(
  claims: z.infer<typeof SentimentAnalysisSchema>["claims"],
  spans: EvidenceSpan[],
  brandDomain: string,
): MonitoringSentimentClaim[] {
  const spanById = new Map(spans.map((span) => [span.id, span]));
  const usedSpanIds = new Set<string>();
  const claimsByKey = new Map<
    string,
    Omit<MonitoringSentimentClaim, "evidences"> & {
      evidenceSpanIds: string[];
    }
  >();

  for (const claim of claims) {
    const label = claim.label.trim().replace(/\s+/g, " ");
    if (!label) {
      continue;
    }

    const evidenceSpanIds = [
      ...new Set(
        claim.evidenceSpanIds.filter(
          (id) => spanById.has(id) && !usedSpanIds.has(id),
        ),
      ),
    ];
    if (evidenceSpanIds.length === 0) {
      continue;
    }

    for (const id of evidenceSpanIds) {
      usedSpanIds.add(id);
    }
    const key = `${claim.sentiment}:${label.toLocaleLowerCase()}`;
    const existing = claimsByKey.get(key);
    if (existing) {
      existing.evidenceSpanIds.push(...evidenceSpanIds);
    } else {
      claimsByKey.set(key, {
        brandDomain,
        label,
        sentiment: claim.sentiment,
        evidenceSpanIds,
      });
    }
  }

  return [...claimsByKey.values()]
    .map(({ evidenceSpanIds, ...claim }) => ({
      ...claim,
      evidences: evidenceSpanIds
        .map((id) => spanById.get(id))
        .filter((span): span is EvidenceSpan => span !== undefined)
        .sort((a, b) => a.startOffset - b.startOffset)
        .map(({ startOffset, endOffset }) => ({ startOffset, endOffset })),
    }))
    .sort(
      (a, b) =>
        (a.evidences[0]?.startOffset ?? 0) - (b.evidences[0]?.startOffset ?? 0),
    );
}

export async function analyzeSentimentStep(
  groq: GroqService,
  input: SerializedMonitoringRunInput,
  responses: MonitoringEngineResponse[],
): Promise<Record<string, MonitoringSentimentClaim[]>> {
  const mainBrand = input.brands.find((brand) => brand.kind === "BUSINESS");
  if (!mainBrand) {
    throw new Error(`Business ${input.businessId} has no main brand`);
  }

  const promptById = new Map(
    input.prompts.map((prompt) => [prompt.id, prompt.text]),
  );
  const brandByDomain = new Map(
    input.brands.map((brand) => [brand.domain, brand]),
  );

  // One call per brand actually named in the answer. Asking a single call to
  // attribute claims across brands is the unreliable version — a comparative
  // sentence evaluates several brands at once — so each call gets one subject.
  const candidates = responses.flatMap((response) => {
    if (!response.content) {
      return [];
    }

    const mentionedBrands = [
      ...new Set(
        extractMentions(response.content, input.brands).map(
          ({ domain }) => domain,
        ),
      ),
    ].flatMap((domain) => {
      const brand = brandByDomain.get(domain);
      return brand ? [brand] : [];
    });
    if (mentionedBrands.length === 0) {
      return [];
    }

    const spans = createEvidenceSpans(response.content);
    if (spans.length === 0) {
      return [];
    }

    return mentionedBrands.map((brand) => ({ response, spans, brand }));
  });
  if (candidates.length === 0) {
    return {};
  }

  const systemPrompt = await loadPromptHbs(
    "analyze-sentiment",
    {},
    { baseDir: PROMPT_DIRECTORY },
  );
  const limit = pLimit(SENTIMENT_CONCURRENCY);
  const entries = await Promise.all(
    candidates.map(({ response, spans, brand }) =>
      limit(async (): Promise<[string, MonitoringSentimentClaim[]]> => {
        try {
          const result = await groq.parse({
            name: "analyze-monitoring-sentiment",
            schema: SentimentAnalysisSchema,
            model: SENTIMENT_MODEL,
            temperature: 0,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: JSON.stringify({
                  prompt: promptById.get(response.promptId) ?? "",
                  brand: {
                    name: brand.name,
                    aliases: [brand.name, ...brand.aliases],
                  },
                  spans: spans.map(({ id, text }) => ({ id, text })),
                }),
              },
            ],
          });

          return [
            response.responseKey,
            normalizeClaims(result.claims, spans, brand.domain),
          ];
        } catch (error) {
          logger.warn(
            `[${input.businessId}] Sentiment analysis failed responseKey=${response.responseKey} brand=${brand.domain}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          return [response.responseKey, []];
        }
      }),
    ),
  );

  // A response now yields one entry per brand, so they are merged rather than
  // collected into a map directly.
  const claimsByResponseKey: Record<string, MonitoringSentimentClaim[]> = {};
  for (const [responseKey, claims] of entries) {
    const responseClaims = claimsByResponseKey[responseKey] ?? [];
    responseClaims.push(...claims);
    claimsByResponseKey[responseKey] = responseClaims;
  }

  return claimsByResponseKey;
}
