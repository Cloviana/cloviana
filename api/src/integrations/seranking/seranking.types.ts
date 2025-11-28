export type SerankingSource = string;

export type SortField =
  | "keyword"
  | "volume"
  | "cpc"
  | "difficulty"
  | "competition"
  | "history_trend";
export type SortOrder = "asc" | "desc";

export interface ExportKeywordsMetricsInput {
  source: SerankingSource;
  keywords: string[];
  sort?: SortField;
  sort_order?: SortOrder;
  cols?: string;
}

export type KeywordHistoryTrend = Record<string, number>;

export interface KeywordMetrics {
  is_data_found: boolean;
  keyword: string;
  volume?: number;
  cpc?: number;
  competition?: number | string;
  difficulty?: number;
  history_trend?: KeywordHistoryTrend | null;
}

export type SerpIntent = "I" | "N" | "C" | "L";

export interface SimilarRelatedItem {
  keyword: string;
  volume?: number;
  cpc?: number;
  difficulty?: number;
  competition?: number;
  intents?: SerpIntent[];
  serp_features?: string[];
  history_trend?: KeywordHistoryTrend | null;
  relevance?: number;
}

export interface SimilarRelatedResponse {
  total: number;
  keywords: SimilarRelatedItem[];
}

export interface QuestionsResponse {
  total: number;
  keywords: SimilarRelatedItem[];
}

export interface LongtailResponse {
  total: number;
  keywords: string[];
}

export interface CommonFilters {
  volume?: { from?: number; to?: number };
  difficulty?: { from?: number; to?: number };
  cpc?: { from?: number; to?: number };
  competition?: { from?: number; to?: number };
  keyword_count?: { from?: number; to?: number };
  characters_count?: { from?: number; to?: number };
  serp_features?: string[];
}

export interface SimilarRelatedParams {
  source: SerankingSource;
  keyword: string;
  limit?: number;
  offset?: number;
  sort?: Exclude<SortField, "history_trend">;
  sort_order?: SortOrder;
  history_trend?: boolean;
  filter?: CommonFilters;
}

export type QuestionsParams = SimilarRelatedParams;

export type LongtailParams = Omit<SimilarRelatedParams, "history_trend">;

export interface PagedResult<T> {
  total: number;
  items: T[];
}
