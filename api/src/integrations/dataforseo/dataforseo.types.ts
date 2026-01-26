export interface RelatedKeywordsTask {
  keyword: string;
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  depth?: number;
  include_seed_keyword?: boolean;
  include_serp_info?: boolean;
  include_clickstream_data?: boolean;
  ignore_synonyms?: boolean;
  replace_with_core_keyword?: boolean;
  filters?: unknown[];
  order_by?: string[];
  limit?: number;
  offset?: number;
  tag?: string;
}

export interface DataForSeoResponse<TTaskResult> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSeoTask<TTaskResult>[];
}

export interface DataForSeoTask<TTaskResult> {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: unknown;
  result: TTaskResult[];
}

export interface RelatedKeywordsResult {
  se_type: string;
  seed_keyword: string;
  seed_keyword_data?: KeywordData[];
  location_code: number;
  language_code: string;
  total_count: number;
  items_count: number;
  items: RelatedKeywordItem[];
}

export interface RelatedKeywordItem {
  se_type: string;
  keyword_data: KeywordData;
  depth: number;
  related_keywords: string[];
}

export interface KeywordData {
  se_type: string;
  keyword: string;
  location_code: number;
  language_code: string;
  keyword_info?: KeywordInfo;
  clickstream_keyword_info?: ClickstreamKeywordInfo;
  keyword_properties?: KeywordProperties;
  serp_info?: SerpInfo | null;
  avg_backlinks_info?: AvgBacklinksInfo;
  search_intent_info?: SearchIntentInfo;
  keyword_info_normalized_with_bing?: NormalizedKeywordInfo;
  keyword_info_normalized_with_clickstream?: NormalizedKeywordInfo;
}

export interface KeywordInfo {
  se_type: string;
  last_updated_time: string;
  competition: number;
  competition_level: "LOW" | "MEDIUM" | "HIGH" | null;
  cpc: number;
  search_volume: number;
  low_top_of_page_bid: number;
  high_top_of_page_bid: number;
  categories: number[];
  monthly_searches: MonthlySearch[];
  search_volume_trend?: SearchVolumeTrend;
}

export interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

export interface SearchVolumeTrend {
  monthly?: number;
  quarterly?: number;
  yearly?: number;
}

export interface ClickstreamKeywordInfo {
  search_volume: number;
  last_updated_time: string;
  gender_distribution?: {
    female?: number;
    male?: number;
  };
  age_distribution?: {
    "18-24"?: number;
    "25-34"?: number;
    "35-44"?: number;
    "45-54"?: number;
    "55-64"?: number;
  };
  monthly_searches?: MonthlySearch[];
}

export interface KeywordProperties {
  se_type: string;
  core_keyword: string | null;
  synonym_clustering_algorithm: "keyword_metrics" | "text_processing" | null;
  keyword_difficulty?: number;
  detected_language?: string;
  is_another_language?: boolean;
}

export interface SerpInfo {
  se_type: string;
  check_url: string;
  serp_item_types: string[];
  se_results_count: number;
  last_updated_time: string;
  previous_updated_time?: string;
}

export interface AvgBacklinksInfo {
  se_type: string;
  backlinks: number;
  dofollow: number;
  referring_pages: number;
  referring_domains: number;
  referring_main_domains: number;
  rank: number;
  main_domain_rank: number;
  last_updated_time: string;
}

export interface SearchIntentInfo {
  se_type: "google";
  main_intent:
    | "informational"
    | "navigational"
    | "commercial"
    | "transactional";
  foreign_intent: (
    | "informational"
    | "navigational"
    | "commercial"
    | "transactional"
  )[];
  last_updated_time: string;
}

export interface NormalizedKeywordInfo {
  last_updated_time: string;
  search_volume: number;
  is_normalized: boolean;
  monthly_searches?: MonthlySearch[];
}

export interface KeywordIdeasTask {
  keywords: string[];
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  closely_variants?: boolean;
  ignore_synonyms?: boolean;
  include_serp_info?: boolean;
  include_clickstream_data?: boolean;
  limit?: number;
  offset?: number;
  offset_token?: string;
  filters?: unknown[];
  order_by?: string[];
  tag?: string;
}

export interface KeywordIdeasResult {
  se_type: string;
  seed_keywords: string[];
  location_code: number;
  language_code: string;
  total_count: number;
  items_count: number;
  offset: number;
  offset_token?: string;
  items: KeywordIdeaItem[];
}

export interface KeywordIdeaItem {
  se_type: string;
  keyword: string;
  location_code: number;
  language_code: string;
  keyword_info?: KeywordInfo;
  clickstream_keyword_info?: ClickstreamKeywordInfo;
  keyword_properties?: KeywordProperties;
  serp_info?: SerpInfo | null;
  avg_backlinks_info?: AvgBacklinksInfo;
  search_intent_info?: SearchIntentInfo;
  keyword_info_normalized_with_bing?: NormalizedKeywordInfo;
  keyword_info_normalized_with_clickstream?: NormalizedKeywordInfo;
}

export interface KeywordSuggestionsTask {
  keyword: string;
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  include_seed_keyword?: boolean;
  include_serp_info?: boolean;
  include_clickstream_data?: boolean;
  exact_match?: boolean;
  ignore_synonyms?: boolean;
  filters?: unknown[];
  order_by?: string[];
  limit?: number;
  offset?: number;
  offset_token?: string;
  tag?: string;
}

export interface KeywordSuggestionsResult {
  se_type: string;
  seed_keyword: string;
  seed_keyword_data?: KeywordSuggestionItem;
  location_code: number;
  language_code: string;
  total_count: number;
  items_count: number;
  offset: number;
  offset_token?: string;
  items: KeywordSuggestionItem[];
}

export interface KeywordSuggestionItem {
  se_type: string;
  keyword: string;
  location_code: number;
  language_code: string;
  keyword_info?: KeywordInfo;
  clickstream_keyword_info?: ClickstreamKeywordInfo;
  keyword_properties?: KeywordProperties;
  serp_info?: SerpInfo | null;
  avg_backlinks_info?: AvgBacklinksInfo;
  search_intent_info?: SearchIntentInfo;
  keyword_info_normalized_with_bing?: NormalizedKeywordInfo;
  keyword_info_normalized_with_clickstream?: NormalizedKeywordInfo;
}

export interface KeywordOverviewTask {
  keywords: string[];
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  include_serp_info?: boolean;
  include_clickstream_data?: boolean;
  tag?: string;
}

export interface KeywordOverviewResult {
  se_type: string;
  location_code: number;
  language_code: string;
  items_count: number;
  items: KeywordOverviewItem[];
}

export interface KeywordOverviewItem {
  se_type: string;
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners?: boolean;
  keyword_info?: KeywordInfo;
  clickstream_keyword_info?: ClickstreamKeywordInfo;
  keyword_properties?: KeywordProperties;
  serp_info?: SerpInfo | null;
  avg_backlinks_info?: AvgBacklinksInfo;
  search_intent_info?: SearchIntentInfo;
  keyword_info_normalized_with_bing?: NormalizedKeywordInfo;
  keyword_info_normalized_with_clickstream?: NormalizedKeywordInfo;
}
