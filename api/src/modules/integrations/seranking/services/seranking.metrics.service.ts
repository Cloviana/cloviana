import { Injectable } from "@nestjs/common";
import pRetry, { AbortError } from "p-retry";
import { SerankingClient } from "../seranking.client";
import {
  ExportKeywordsMetricsInput,
  KeywordMetrics,
  SimilarRelatedParams,
  QuestionsParams,
  LongtailParams,
  SimilarRelatedItem,
  PagedResult,
} from "../seranking.types";

@Injectable()
export class SerankingMetricsService {
  constructor(private readonly client: SerankingClient) {}

  private async retry<T>(fn: () => Promise<T>) {
    return pRetry(fn, {
      retries: 4,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 3000,
      onFailedAttempt: err => {
        const e: any = err;
        const status = e?.cause?.status ?? e?.status;
        if (status && status !== 429 && status < 500) throw new AbortError(e.message);
      },
    });
  }

  async exportKeywordsMetrics(input: ExportKeywordsMetricsInput): Promise<KeywordMetrics[]> {
    if (!input.keywords?.length) return [];
    const maxPerCall = 5000;
    const chunks: string[][] = [];
    for (let i = 0; i < input.keywords.length; i += maxPerCall) chunks.push(input.keywords.slice(i, i + maxPerCall));
    const out: KeywordMetrics[] = [];
    for (const chunk of chunks) {
      const data = await this.retry(() =>
        this.client.exportKeywords<KeywordMetrics[]>({
          source: input.source,
          keywords: chunk,
          sort: input.sort ?? "cpc",
          sort_order: input.sort_order ?? "desc",
          cols: input.cols ?? "keyword,volume,cpc,competition,difficulty,history_trend",
        })
      );
      out.push(...data);
    }
    return out;
  }

  async getSimilar(input: SimilarRelatedParams): Promise<PagedResult<SimilarRelatedItem>> {
  const limit = input.limit ?? 25;
  const res = await this.retry(() => this.client.similar({ ...input, limit }));
  const items = (res.keywords ?? []).slice(0, limit);
  const total = res.total ?? items.length;
  return { total, items };
}

async getRelated(input: SimilarRelatedParams): Promise<PagedResult<SimilarRelatedItem>> {
  const limit = input.limit ?? 25;
  const res = await this.retry(() => this.client.related({ ...input, limit }));
  const items = (res.keywords ?? []).slice(0, limit);
  const total = res.total ?? items.length;
  return { total, items };
}

async getQuestions(input: QuestionsParams): Promise<PagedResult<SimilarRelatedItem>> {
  const limit = input.limit ?? 25;
  const res = await this.retry(() => this.client.questions({ ...input, limit }));
  const items = (res.keywords ?? []).slice(0, limit);
  const total = res.total ?? items.length;
  return { total, items };
}

async getLongtail(input: LongtailParams): Promise<PagedResult<string>> {
  const limit = input.limit ?? 25;
  const res = await this.retry(() => this.client.longtail({ ...input, limit }));
  const items = (res.keywords ?? []).slice(0, limit);
  const total = res.total ?? items.length;
  return { total, items };
}

}
