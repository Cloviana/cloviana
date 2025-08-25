import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateAnnotation } from "../keyword-discovery.state";
import { SeedKeywordsSchema } from "../schemas/seed-keyword.schema";
import { SelectionByIdSchema } from "../schemas/selected-keyword.schema";
import { SerankingMetricsService } from "@/modules/integrations/seranking/services/seranking.metrics.service";
import { RunnableConfig } from "@langchain/core/runnables";
import pRetry from "p-retry";
import { SerpIntent, SimilarRelatedItem } from "@/modules/integrations/seranking/seranking.types";

type HistoryTrend = Record<string, number> | null;

type Candidate = {
  id: string;
  keyword: string;
  volume?: number;
  cpc?: number;
  competition?: number | string;
  difficulty?: number;
  history_trend?: HistoryTrend;
  intents?: SerpIntent[];
  source: "related" | "questions";
};

type TrendInfo = {
  slope12: number;
  slope6: number;
  avg3: number;
  avg6: number;
  avg12: number;
  last_observed: number;
  last_effective: number;
};

const REGION = "us" as const;

const BASE_FILTER = {
  volume: { from: 150, to: 100000 },
  difficulty: { to: 45 },
  competition: { to: 0.75 },
} as const;

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s\-]/gu, "").replace(/\s+/g, " ").trim();
}

function parseTrend(h: HistoryTrend): TrendInfo | null {
  if (!h) return null;
  const entries = Object.entries(h)
    .map(([m, v]) => ({ m, v: Number(v || 0), t: new Date(m).getTime() }))
    .filter((e) => Number.isFinite(e.t))
    .sort((a, b) => a.t - b.t);
  if (!entries.length) return null;
  const vals = entries.map((e) => e.v);
  const last_observed = vals.at(-1) ?? 0;
  const eff = vals.length >= 2 ? vals.slice(0, -1) : vals.slice();
  if (!eff.length) return null;
  const slice = (n: number) => eff.slice(-n);
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const slope = (a: number[]) => {
    const n = a.length;
    if (n < 2) return 0;
    const xm = (n - 1) / 2;
    const ym = avg(a);
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const dx = i - xm;
      num += dx * (a[i] - ym);
      den += dx * dx;
    }
    return den ? num / den : 0;
  };
  const last12 = slice(12);
  const last6 = slice(6);
  const last3 = slice(3);
  return {
    slope12: slope(last12),
    slope6: slope(last6),
    avg3: avg(last3),
    avg6: avg(last6),
    avg12: avg(last12),
    last_observed,
    last_effective: eff.at(-1) ?? 0,
  };
}

function rankScore(c: Candidate) {
  const t = parseTrend(c.history_trend ?? null);
  const v = c.volume ?? 0;
  const d = c.difficulty ?? 0;
  const comp = typeof c.competition === "number" ? c.competition : Number(c.competition ?? 0);
  const cpc = c.cpc ?? 0;
  const intentBoost = (c.intents ?? []).some((i) => ["commercial", "transactional"].includes(String(i))) ? 1.25 : 1;
  const trendBoost = t ? 1 + Math.min(2, (Math.max(0, t.slope6) * 2 + Math.max(0, t.slope12) + (t.avg3 >= t.avg12 ? 1 : 0)) / 10) : 1;
  const volumeScore = Math.log10(Math.max(1, v));
  const difficultyPenalty = 1 / (1 + Math.max(0, d - 10) / 45);
  const compPenalty = 1 / (1 + Math.max(0, comp - 0.3));
  const cpcBoost = 1 + Math.min(1, cpc / 3);
  return volumeScore * difficultyPenalty * compPenalty * cpcBoost * trendBoost * intentBoost;
}

function gate(
  c: Candidate,
  g: { minVol: number; lastMin: number; minSlope6: number; minSlope12: number; minAvg3Vs12: number }
) {
  const t = parseTrend(c.history_trend ?? null);
  if (!t) return false;
  if ((c.volume ?? 0) < g.minVol) return false;
  if (t.last_effective < g.lastMin) return false;
  if (t.slope6 < g.minSlope6 && t.slope12 < g.minSlope12) return false;
  if (t.avg3 < g.minAvg3Vs12 * t.avg12) return false;
  return true;
}

function dedupeKeepBest(list: Candidate[]) {
  const m = new Map<string, Candidate>();
  for (const c of list) {
    const key = normalize(c.keyword);
    const prev = m.get(key);
    if (!prev || rankScore(c) > rankScore(prev)) m.set(key, c);
  }
  return Array.from(m.values());
}

async function buildSeeds(
  llm: ChatOpenAI,
  products: Array<{ title: string; handle: string; tags: string[]; description: string }>,
  collections: Array<{ title: string; handle: string; description: string }>
) {
  const res = await pRetry(
    () =>
      llm.withStructuredOutput(SeedKeywordsSchema).invoke([
        new SystemMessage(
          "You generate seed keywords for an e-commerce store. Return exactly the requested total as foundational, deduplicated seed phrases to expand later with a keyword tool. Seeds must be short, generic-but-commercial, represent categories, product families, and high-value products. No questions, how-tos, comparisons, or ultra-specific variants unless core to buyer search. Prefer 4–6 words max. Use only information present in the inputs."
        ),
        new HumanMessage(JSON.stringify({ products, collections, constraints: { min: 4, max: 6 } })),
      ]),
    { retries: 5, factor: 2, minTimeout: 1200, maxTimeout: 4000 }
  );
  return res.items.map((i) => i.phrase);
}

async function fetchBuckets(metrics: SerankingMetricsService, seeds: string[]) {
  const related: SimilarRelatedItem[] = [];
  const questions: SimilarRelatedItem[] = [];
  const seen = new Set<string>();
  await Promise.all(
    seeds.map(async (seed) => {
      const [rel, qs] = await Promise.allSettled([
        metrics.getRelated({ source: REGION, keyword: seed, limit: 160, sort: "volume", sort_order: "desc", history_trend: true, filter: { ...BASE_FILTER, cpc: { from: 0.1 } } }),
        metrics.getQuestions({ source: REGION, keyword: seed, limit: 80, sort: "volume", sort_order: "desc", history_trend: true, filter: { ...BASE_FILTER, serp_features: ["featured_snippets", "people_also_ask", "sge"] } }),
      ]);
      if (rel.status === "fulfilled") {
        for (const k of rel.value.items ?? []) {
          const key = normalize(k.keyword);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          related.push(k);
        }
      }
      if (qs.status === "fulfilled") {
        for (const k of qs.value.items ?? []) {
          const key = normalize(k.keyword);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          questions.push(k);
        }
      }
    })
  );
  return { related, questions };
}

function buildCandidates(related: SimilarRelatedItem[], questions: SimilarRelatedItem[]): Candidate[] {
  return [
    ...related.map((k, i) => ({
      id: `related-${i}-${normalize(k.keyword)}`,
      keyword: k.keyword,
      volume: k.volume,
      cpc: k.cpc,
      intents: k.intents,
      competition: k.competition,
      difficulty: k.difficulty,
      history_trend: k.history_trend ?? null,
      source: "related" as const,
    })),
    ...questions.map((k, i) => ({
      id: `questions-${i}-${normalize(k.keyword)}`,
      keyword: k.keyword,
      volume: k.volume,
      cpc: k.cpc,
      intents: k.intents,
      competition: k.competition,
      difficulty: k.difficulty,
      history_trend: k.history_trend ?? null,
      source: "questions" as const,
    })),
  ];
}

function ensureAtLeastN(candidates: Candidate[], n = 50) {
  const stages = [
    { minVol: 300, lastMin: 300, minSlope6: 0.1, minSlope12: 0, minAvg3Vs12: 0.9 },
    { minVol: 200, lastMin: 200, minSlope6: 0, minSlope12: 0, minAvg3Vs12: 0.85 },
    { minVol: 150, lastMin: 150, minSlope6: -0.02, minSlope12: 0, minAvg3Vs12: 0.8 },
    { minVol: 120, lastMin: 120, minSlope6: -0.05, minSlope12: -0.02, minAvg3Vs12: 0.75 },
  ];
  for (const g of stages) {
    const kept = candidates.filter((c) => gate(c, g)).sort((a, b) => rankScore(b) - rankScore(a));
    if (kept.length >= n) return kept.slice(0, n);
  }
  return candidates.sort((a, b) => rankScore(b) - rankScore(a)).slice(0, n);
}

function stripLastMonth(ht: HistoryTrend): HistoryTrend {
  if (!ht) return null;
  const entries = Object.entries(ht)
    .map(([m, v]) => ({ m, v, t: new Date(m).getTime() }))
    .filter((e) => Number.isFinite(e.t))
    .sort((a, b) => a.t - b.t);
  if (entries.length <= 1) return null;
  const trimmed = entries.slice(0, -1);
  const out: Record<string, number> = {};
  for (const e of trimmed) out[e.m] = Number(e.v || 0);
  return out;
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function selectBatch(
  llm: ChatOpenAI,
  now: string,
  products: Array<{ title: string; handle: string; tags: string[]; description: string }>,
  collections: Array<{ title: string; handle: string; description: string }>,
  batch: { id: string; phrase: string; volume?: number; difficulty?: number; intents?: SerpIntent[]; t?: { s6: number; s12: number; r: number; last: number } }[],
  take: number
) {
  const res = await pRetry(
    () =>
      llm.withStructuredOutput(SelectionByIdSchema).invoke([
        new SystemMessage(
          [
            "Select keyword IDs for a Shopify brand from this batch only.",
            "Prefer neutral or upward 6–12 month trends computed excluding the most recent month, last-effective month volume ≥ 150, clear commercial/transactional intent, and reasonable difficulty.",
            "Avoid downtrends, very low volume, and near-duplicates within the batch.",
            `Return exactly ${take} IDs if feasible; if not feasible, return as many high-quality IDs as possible.`,
            `Optimize for current season ${now}.`,
          ].join(" ")
        ),
        new HumanMessage(JSON.stringify({ products, collections, candidates: batch, constraints: { total: take } })),
      ]),
    { retries: 3, factor: 2, minTimeout: 800, maxTimeout: 2500 }
  );
  return res.items.map((i) => i.id);
}

async function selectFinal(
  llm: ChatOpenAI,
  now: string,
  products: Array<{ title: string; handle: string; tags: string[]; description: string }>,
  collections: Array<{ title: string; handle: string; description: string }>,
  pool: { id: string; phrase: string; volume?: number; difficulty?: number; intents?: SerpIntent[]; t?: { s6: number; s12: number; r: number; last: number } }[],
  total: number
) {
  const res = await pRetry(
    () =>
      llm.withStructuredOutput(SelectionByIdSchema).invoke([
        new SystemMessage(
          [
            "From this shortlist, select the final keyword IDs.",
            "Ensure diversity and avoid near-duplicates. Keep clear commercial/transactional intent, stable-to-upward trends excluding the most recent month, and reasonable difficulty. Avoid keywords for local seo like 'shops near me'",
            `Return exactly ${total} IDs.`,
            `Optimize for current season ${now}.`,
          ].join(" ")
        ),
        new HumanMessage(JSON.stringify({ products, collections, candidates: pool, constraints: { total } })),
      ]),
    { retries: 3, factor: 2, minTimeout: 800, maxTimeout: 2500 }
  );
  return res.items.map((i) => i.id);
}

async function mapWithConcurrency<T, R>(arr: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const ret = new Array<R>(arr.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, arr.length) }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= arr.length) break;
        ret[idx] = await fn(arr[idx], idx);
      }
    })
  );
  return ret;
}

async function selectCandidatesBatched(
  llm: ChatOpenAI,
  payload: {
    products: Array<{ title: string; handle: string; tags: string[]; description: string }>;
    collections: Array<{ title: string; handle: string; description: string }>;
    candidates: {
      id: string;
      phrase: string;
      volume?: number;
      difficulty?: number;
      intents?: SerpIntent[];
      t?: { s6: number; s12: number; r: number; last: number };
    }[];
  },
  target = 50,
  concurrency = 3
) {
  const now = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const MAX_BATCH = 160;
  const MAX_SHORTLIST = 220;

  const ranked = payload.candidates.slice().sort((a, b) => {
    const va = Math.log10(Math.max(1, a.volume ?? 0));
    const vb = Math.log10(Math.max(1, b.volume ?? 0));
    const ra = a.t ? (Math.max(0, a.t.s6) * 2 + Math.max(0, a.t.s12) + (a.t.r >= 1 ? 1 : 0)) : 0;
    const rb = b.t ? (Math.max(0, b.t.s6) * 2 + Math.max(0, b.t.s12) + (b.t.r >= 1 ? 1 : 0)) : 0;
    const ia = (a.intents ?? []).some((i) => ["commercial", "transactional"].includes(String(i))) ? 1 : 0;
    const ib = (b.intents ?? []).some((i) => ["commercial", "transactional"].includes(String(i))) ? 1 : 0;
    const da = a.difficulty ?? 0;
    const db = b.difficulty ?? 0;
    const pa = va - Math.max(0, da - 10) / 40 + ia + ra / 10;
    const pb = vb - Math.max(0, db - 10) / 40 + ib + rb / 10;
    return pb - pa;
  });

  const trimmed = ranked.slice(0, Math.max(MAX_SHORTLIST, target));
  const batches = chunk(trimmed, MAX_BATCH);
  const quotasBase = batches.map((b) => Math.floor((b.length / trimmed.length) * target));
  let allocated = quotasBase.reduce((s, x) => s + x, 0);
  let i = 0;
  while (allocated < target) {
    quotasBase[i % quotasBase.length] += 1;
    allocated++;
    i++;
  }

  const batchInputs = batches
    .map((batch, idx) => ({ batch, take: quotasBase[idx] }))
    .filter((x) => x.take > 0);

  const results = await mapWithConcurrency(batchInputs, concurrency, async ({ batch, take }) =>
    selectBatch(llm, now, payload.products, payload.collections, batch, take)
  );

  const selectedIds = new Set<string>();
  for (const ids of results) for (const id of ids) selectedIds.add(id);

  if (selectedIds.size < target) {
    const missing = target - selectedIds.size;
    const remaining = trimmed.filter((c) => !selectedIds.has(c.id)).slice(0, missing).map((c) => c.id);
    for (const id of remaining) selectedIds.add(id);
  }

  if (selectedIds.size > target) {
    const pool = trimmed.filter((c) => selectedIds.has(c.id));
    const finalIds = await selectFinal(llm, now, payload.products, payload.collections, pool, target);
    return finalIds;
  }

  return Array.from(selectedIds);
}

export async function generateKeywords(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig
): Promise<Partial<typeof StateAnnotation.State>> {
  const metrics = configurable?.metrics as SerankingMetricsService;
  if (!metrics) throw new Error("SEranking metrics service not provided");

  const products = (state._products ?? []).slice(0, 1000).map((p) => ({
    title: p.title,
    handle: p.handle,
    tags: p.tags ?? [],
    description: p.description ?? "",
  }));
  const collections = (state._collections ?? []).slice(0, 500).map((c) => ({
    title: c.title,
    handle: c.handle,
    description: c.description ?? "",
  }));
  if (!products.length && !collections.length) return { _keywords: [] };

  const llm = new ChatOpenAI({ model: "gpt-4o-mini-2024-07-18", temperature: 0 });

  const seeds = await buildSeeds(llm, products, collections);
  const { related, questions } = await fetchBuckets(metrics, seeds);
  const base = buildCandidates(related, questions);
  const deduped = dedupeKeepBest(base);
  const gated = ensureAtLeastN(deduped, 50);

  const compactCandidates = gated.map((c) => {
    const t = parseTrend(c.history_trend ?? null);
    return {
      id: c.id,
      phrase: c.keyword,
      volume: c.volume,
      difficulty: c.difficulty,
      intents: c.intents,
      t: t ? { s6: t.slope6, s12: t.slope12, r: t.avg12 ? t.avg3 / t.avg12 : 0, last: t.last_effective } : undefined,
    };
  });

  const selectionIds = await selectCandidatesBatched(
    llm,
    { products, collections, candidates: compactCandidates },
    50
  );

  const selected = selectionIds
    .map((id) => gated.find((c) => c.id === id))
    .filter((c): c is Candidate => Boolean(c));

  return {
    _keywords: selected.map((c) => ({
      keyword: c.keyword,
      volume: c.volume,
      cpc: c.cpc,
      competition: c.competition,
      difficulty: c.difficulty,
      intents: (c.intents ?? []) as SerpIntent[],
      history_trend: stripLastMonth(c.history_trend ?? null),
    })),
  };
}
