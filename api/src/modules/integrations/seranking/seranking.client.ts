import {
  SimilarRelatedParams,
  SimilarRelatedResponse,
  QuestionsParams,
  QuestionsResponse,
  LongtailParams,
  LongtailResponse,
  CommonFilters,
} from "./seranking.types";

type Range = { from?: number; to?: number };

const SORTS = ["keyword", "volume", "cpc", "difficulty", "competition"] as const;
type SortKey = (typeof SORTS)[number];

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    readonly endpoint: string
  ) {
    super(`SERanking ${endpoint} ${status}`);
  }
}

function isRange(v: unknown): v is Range {
  return typeof v === "object" && v !== null && ("from" in (v as any) || "to" in (v as any));
}

function buildQuery(params: {
  source: string;
  keyword: string;
  limit?: number;
  offset?: number;
  sort?: SortKey;
  sort_order?: "asc" | "desc";
  history_trend?: boolean;
  filter?: CommonFilters;
}) {
  const q = new URLSearchParams();
  q.append("source", params.source);
  q.append("keyword", params.keyword);
  if (params.limit != null) q.append("limit", String(params.limit));
  if (params.offset != null) q.append("offset", String(params.offset));
  if (params.sort) q.append("sort", params.sort);
  if (params.sort_order) q.append("sort_order", params.sort_order);
  if (params.history_trend === true) q.append("history_trend", "true");

  const f = params.filter;
  if (f) {
    if (Array.isArray(f.serp_features) && f.serp_features.length) {
      q.append("filter[serp_features]", f.serp_features.join(","));
    }
    const keys: (keyof Omit<CommonFilters, "serp_features">)[] = [
      "volume",
      "difficulty",
      "cpc",
      "competition",
      "keyword_count",
      "characters_count",
    ];
    for (const k of keys) {
      const v = f[k];
      if (v && isRange(v)) {
        if (v.from != null) q.append(`filter[${String(k)}][from]`, String(v.from));
        if (v.to != null) q.append(`filter[${String(k)}][to]`, String(v.to));
      }
    }
  }
  return q.toString();
}

export class SerankingClient {
  constructor(
    private readonly token = process.env.SERANKING_API_KEY ?? "",
    private readonly base = "https://api.seranking.com/v1",
    private readonly defaultTimeoutMs = 15000
  ) {}

  private headers() {
    return { Authorization: `Token ${this.token}` };
  }

  private async handle<T>(endpoint: string, url: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs ?? this.defaultTimeoutMs);
    try {
      const r = await fetch(url, { ...init, signal: controller.signal });
      const text = await r.text().catch(() => "");
      const body = text ? safeJson(text) : null;
      if (!r.ok) throw new HttpError(r.status, body ?? text, endpoint);
      return (body as T) ?? ({} as T);
    } finally {
      clearTimeout(id);
    }
  }

  async similar(p: SimilarRelatedParams) {
    const qs = buildQuery({
      source: p.source,
      keyword: p.keyword,
      limit: p.limit,
      offset: p.offset,
      sort: p.sort as SortKey | undefined,
      sort_order: p.sort_order,
      history_trend: p.history_trend,
      filter: p.filter,
    });
    return this.handle<SimilarRelatedResponse>("similar", `${this.base}/keywords/similar?${qs}`, {
      headers: this.headers(),
    });
  }

  async related(p: SimilarRelatedParams) {
    const qs = buildQuery({
      source: p.source,
      keyword: p.keyword,
      limit: p.limit,
      offset: p.offset,
      sort: p.sort as SortKey | undefined,
      sort_order: p.sort_order,
      history_trend: p.history_trend,
      filter: p.filter,
    });
    return this.handle<SimilarRelatedResponse>("related", `${this.base}/keywords/related?${qs}`, {
      headers: this.headers(),
    });
  }

  async questions(p: QuestionsParams) {
    const qs = buildQuery({
      source: p.source,
      keyword: p.keyword,
      limit: p.limit,
      offset: p.offset,
      sort: p.sort as SortKey | undefined,
      sort_order: p.sort_order,
      history_trend: p.history_trend,
      filter: p.filter,
    });
    return this.handle<QuestionsResponse>("questions", `${this.base}/keywords/questions?${qs}`, {
      headers: this.headers(),
    });
  }

  async longtail(p: LongtailParams) {
    const qs = buildQuery({
      source: p.source,
      keyword: p.keyword,
      limit: p.limit,
      offset: p.offset,
      sort: p.sort as SortKey | undefined,
      sort_order: p.sort_order,
      filter: p.filter,
    });
    return this.handle<LongtailResponse>("longtail", `${this.base}/keywords/longtail?${qs}`, {
      headers: this.headers(),
    });
  }

  async exportKeywords<T = any[]>(args: {
    source: string;
    keywords: string[];
    sort?: string;
    sort_order?: "asc" | "desc";
    cols?: string;
  }) {
    const form = new FormData();
    for (const k of args.keywords) form.append("keywords[]", k);
    if (args.sort) form.append("sort", args.sort);
    if (args.sort_order) form.append("sort_order", args.sort_order);
    if (args.cols) form.append("cols", args.cols);
    return this.handle<T>(
      "export",
      `${this.base}/keywords/export?source=${args.source}`,
      { method: "POST", headers: this.headers(), body: form }
    );
  }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
