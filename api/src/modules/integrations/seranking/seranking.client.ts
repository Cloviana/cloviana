import { AppConfiguration } from "@/config/app.configuration";
import {
  SimilarRelatedParams,
  SimilarRelatedResponse,
  QuestionsParams,
  QuestionsResponse,
  LongtailParams,
  LongtailResponse,
  CommonFilters,
} from "./seranking.types";

const BASE = "https://api.seranking.com/v1";

class HttpError extends Error {
  constructor(readonly status: number, readonly body: string, readonly endpoint: string) {
    super(`SERanking ${endpoint} ${status}: ${body}`);
  }
}

function isRange(v: unknown): v is { from?: number; to?: number } {
  return typeof v === "object" && v !== null && ("from" in (v as any) || "to" in (v as any));
}

function buildQuery(params: {
  source: string;
  keyword: string;
  limit?: number;
  offset?: number;
  sort?: "keyword" | "volume" | "cpc" | "difficulty" | "competition";
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
  if (params.history_trend != null) q.append("history_trend", params.history_trend ? "true" : "false");

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
        if (v.from != null) q.append(`filter[${k}][from]`, String(v.from));
        if (v.to != null) q.append(`filter[${k}][to]`, String(v.to));
      }
    }
  }
  return q.toString();
}

export class SerankingClient {
  constructor() {}
  private headers() {
    return { Authorization: `Token ${process.env.SERANKING_API_KEY}` };
  }
  private async handle(endpoint: string, url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new HttpError(r.status, body, endpoint);
    }
    return r.json();
  }

  async similar(p: SimilarRelatedParams): Promise<SimilarRelatedResponse> {
    const qs = buildQuery({ source: p.source, keyword: p.keyword, limit: p.limit, offset: p.offset, sort: p.sort, sort_order: p.sort_order, history_trend: p.history_trend, filter: p.filter });
    return this.handle("similar", `${BASE}/keywords/similar?${qs}`, { headers: this.headers() });
  }

  async related(p: SimilarRelatedParams): Promise<SimilarRelatedResponse> {
    const qs = buildQuery({ source: p.source, keyword: p.keyword, limit: p.limit, offset: p.offset, sort: p.sort, sort_order: p.sort_order, history_trend: p.history_trend, filter: p.filter });
    return this.handle("related", `${BASE}/keywords/related?${qs}`, { headers: this.headers() });
  }

  async questions(p: QuestionsParams): Promise<QuestionsResponse> {
    const qs = buildQuery({ source: p.source, keyword: p.keyword, limit: p.limit, offset: p.offset, sort: p.sort, sort_order: p.sort_order, history_trend: p.history_trend, filter: p.filter });
    return this.handle("questions", `${BASE}/keywords/questions?${qs}`, { headers: this.headers() });
  }

  async longtail(p: LongtailParams): Promise<LongtailResponse> {
    const qs = buildQuery({ source: p.source, keyword: p.keyword, limit: p.limit, offset: p.offset, sort: p.sort, sort_order: p.sort_order, filter: p.filter });
    return this.handle("longtail", `${BASE}/keywords/longtail?${qs}`, { headers: this.headers() });
  }

  async exportKeywords<T = any[]>(args: { source: string; keywords: string[]; sort?: string; sort_order?: "asc" | "desc"; cols?: string; }): Promise<T> {
    const form = new FormData();
    for (const k of args.keywords) form.append("keywords[]", k);
    if (args.sort) form.append("sort", args.sort);
    if (args.sort_order) form.append("sort_order", args.sort_order);
    if (args.cols) form.append("cols", args.cols);
    return this.handle("export", `${BASE}/keywords/export?source=${args.source}`, { method: "POST", headers: this.headers(), body: form });
  }
}
