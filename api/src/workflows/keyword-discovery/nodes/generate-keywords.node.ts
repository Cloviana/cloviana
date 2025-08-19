import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateAnnotation } from "../keyword-discovery.state";
import { SeedKeywordsSchema } from "../schemas/seed-keyword.schema";
import { SelectionByIdSchema } from "../schemas/selected-keyword.schema";
import { SerankingMetricsService } from "@/modules/integrations/seranking/services/seranking.metrics.service";
import { RunnableConfig } from "@langchain/core/runnables";
import pRetry from "p-retry";
import { SerpIntent, SimilarRelatedItem } from "@/modules/integrations/seranking/seranking.types";

type Candidate = {
    id: string;
    keyword: string;
    volume?: number;
    cpc?: number;
    competition?: number | string;
    difficulty?: number;
    history_trend?: any;
    intents?: SerpIntent[]
    source: string;
  };

function normalize(str: string) {
  return str.toLowerCase().replace(/[^\p{L}\p{N}\s\-]/gu, "").replace(/\s+/g, " ").trim();
}

export async function generateKeywords(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig
): Promise<Partial<typeof StateAnnotation.State>> {
  const metrics = configurable?.metrics as SerankingMetricsService;
  if (!metrics) throw new Error("SEranking metrics service not provided");

  const products = state._products ?? [];
  const collections = state._collections ?? [];
  if (products.length === 0 && collections.length === 0) return { _keywords: [] };

  const productSummaries = products.slice(0, 1000).map(p => ({
    title: p.title,
    handle: p.handle,
    tags: p.tags ?? [],
    description: p.description ?? "",
  }));
  const collectionSummaries = collections.slice(0, 500).map(c => ({
    title: c.title,
    handle: c.handle,
    description: c.description ?? "",
  }));

  const llm = new ChatOpenAI({ model: "gpt-4o-mini-2024-07-18", temperature: 0 });

  const seeds: string[] = await pRetry(
    () =>
      llm.withStructuredOutput(SeedKeywordsSchema).invoke([
        new SystemMessage(
          "You generate seed keywords for an e-commerce store. Return exactly the requested total as foundational, deduplicated seed phrases to expand later with a keyword tool. Seeds must be short, generic-but-commercial, represent categories, product families, and high-value products. No questions, how-tos, comparisons, or ultra-specific variants unless core to buyer search. Prefer 4–6 words max. Use only information present in the inputs."
        ),
        new HumanMessage(
          JSON.stringify({ products: productSummaries, collections: collectionSummaries, constraints: { min: 4, max: 6 } })
        ),
      ]),
    { retries: 5, factor: 2, minTimeout: 1200, maxTimeout: 4000 }
  ).then(res => res.items.map(i => i.phrase));

  const baseFilter = { volume: { from: 50, to: 5000 }, difficulty: { to: 40 }, competition: { to: 0.7 } };
  const region = "us";

  const related: SimilarRelatedItem[] = [];
  const questions: SimilarRelatedItem[] = [];
  const longtail: string[] = [];
  const seen = new Set<string>();

  await Promise.all(
    seeds.map(async seed => {
      const [rel, qs, lt] = await Promise.allSettled([
        metrics.getRelated({ source: region, keyword: seed, limit: 25, sort: "keyword", filter: baseFilter }),
        metrics.getQuestions({
          source: region,
          keyword: seed,
          limit: 25,
          sort: "keyword",
          filter: { ...baseFilter, serp_features: ["featured_snippets", "people_also_ask", "sge"] },
        }),
        metrics.getLongtail({ source: region, keyword: seed, limit: 25, sort: "keyword", filter: baseFilter }),
      ]);

      if (rel.status === "fulfilled") {
        for (const k of rel.value.items ?? []) {
          const key = normalize(k.keyword);
          if (key && !seen.has(key)) {
            seen.add(key);
            related.push(k);
          }
        }
      }

      if (qs.status === "fulfilled") {
        for (const k of qs.value.items ?? []) {
          const key = normalize(k.keyword);
          if (key && !seen.has(key)) {
            seen.add(key);
            questions.push(k);
          }
        }
      }

      if (lt.status === "fulfilled") {
        for (const kw of lt.value.items ?? []) {
          const key = normalize(kw);
          if (key && !seen.has(key)) {
            seen.add(key);
            longtail.push(kw);
          }
        }
      }
    })
  );

  const longtailMetrics = await metrics.exportKeywordsMetrics({
    source: region,
    keywords: longtail,
    sort: "cpc",
    sort_order: "desc",
    cols: "keyword,volume,cpc,competition,difficulty,history_trend",
  });

  const candidates: Candidate[] = [
    ...related.map((k, i) => ({
      id: `related-${i}`,
      keyword: k.keyword,
      volume: k.volume,
      cpc: k.cpc,
      intents: k.intents,
      competition: k.competition,
      difficulty: k.difficulty,
      history_trend: k.history_trend,
      source: "related",
    })),
    ...questions.map((k, i) => ({
      id: `questions-${i}`,
      keyword: k.keyword,
      volume: k.volume,
      cpc: k.cpc,
      intents: k.intents,
      competition: k.competition,
      difficulty: k.difficulty,
      history_trend: k.history_trend,
      source: "questions",
    })),
    ...longtailMetrics.map((m, i) => ({
      id: `longtail-${i}`,
      keyword: m.keyword,
      volume: m.volume,
      cpc: m.cpc,
      intents: ["I"] as SerpIntent[],
      competition: m.competition,
      difficulty: m.difficulty,
      history_trend: m.history_trend,
      source: "longtail",
    })),
  ];

  const payload = {
    products: productSummaries,
    collections: collectionSummaries,
    candidates: candidates.map(c => ({
      id: c.id,
      phrase: c.keyword,
      volume: c.volume,
      difficulty: c.difficulty,
      source: c.source,
    })),
    constraints: { total: 50 },
  };

  const selection = await pRetry(
    () =>
      llm.withStructuredOutput(SelectionByIdSchema).invoke([
        new SystemMessage(
          [
            "You are selecting exactly 50 keywords for a Shopify brand.",
            "Choose only from the provided candidates by their id.",
            "Avoid duplicates and near-duplicates; if multiple candidates normalize to the same phrase, pick the strongest.",
            "Prioritize brand relevance, commercial intent, healthy search volume, and reasonable difficulty.",
            "Favour long tail keywords more, but still provide a balanced set.",
            "Return exactly 50 items as IDs only; do not invent or modify phrases.",
          ].join(" ")
        ),
        new HumanMessage(JSON.stringify(payload)),
      ]),
    { retries: 3, factor: 2, minTimeout: 800, maxTimeout: 2500 }
  );

  const selected = selection.items
    .map(i => candidates.find(c => c.id === i.id))
    .filter((c): c is Candidate => Boolean(c));

  return {
    _keywords: selected.map(c => ({
      keyword: c.keyword,
      volume: c.volume,
      cpc: c.cpc,
      competition: c.competition,
      difficulty: c.difficulty,
      intents: (c.intents ?? []) as SerpIntent[],
      history_trend: c.history_trend ?? null,
    })),
  };
}
