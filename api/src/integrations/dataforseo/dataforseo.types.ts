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

// --- Google SERP AI Overview ---

export interface GoogleSerpAiOverviewTask {
  keyword: string;
  location_code?: number;
  language_code?: string;
  load_async_ai_overview?: boolean;
  expand_ai_overview?: boolean;
}

export interface AiOverviewReference {
  type: string;
  position: number;
  source: string;
  domain: string;
  url: string;
  title: string;
  text: string;
}

export interface AiOverviewElement {
  type: string;
  title?: string;
  text?: string;
  markdown?: string;
  links?: string[];
  references?: AiOverviewReference[];
}

export interface AiOverviewItem {
  type: "ai_overview";
  rank_group: number;
  rank_absolute: number;
  position: string;
  asynchronous_ai_overview: boolean;
  markdown?: string;
  items?: AiOverviewElement[];
  references?: AiOverviewReference[];
}

export interface GoogleSerpResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  item_types: string[];
  items_count: number;
  items: Array<AiOverviewItem | Record<string, unknown>>;
}

// --- ChatGPT LLM Responses ---

export interface ChatGptLlmTask {
  user_prompt: string;
  model_name: string;
  max_output_tokens?: number;
  web_search?: boolean;
  force_web_search?: boolean;
  web_search_country_iso_code?: string;
  system_message?: string;
  tag?: string;
}

export interface ChatGptLlmAnnotation {
  title: string;
  url: string;
}

export interface ChatGptLlmSection {
  type: string;
  text?: string;
  annotations?: ChatGptLlmAnnotation[];
}

export interface ChatGptLlmItem {
  type: string;
  sections?: ChatGptLlmSection[];
}

export interface ChatGptLlmResult {
  model_name?: string;
  input_tokens?: number;
  output_tokens?: number;
  web_search?: boolean;
  datetime?: string;
  items?: ChatGptLlmItem[];
  fan_out_queries?: string[];
}

// --- Perplexity LLM Responses ---

export interface PerplexityTask {
  user_prompt: string;
  model_name?: string;
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  web_search_country_iso_code?: string;
  system_message?: string;
  tag?: string;
}

export interface PerplexityAnnotation {
  title: string;
  url: string;
}

export interface PerplexitySection {
  text: string;
  annotations?: PerplexityAnnotation[];
}

export interface PerplexityResponseItem {
  type: string;
  sections: PerplexitySection[];
}

export interface PerplexityResult {
  model_name: string;
  web_search: boolean;
  input_tokens: number;
  output_tokens: number;
  money_spent: number;
  items: PerplexityResponseItem[];
}

// --- Competitors Domain ---

export interface CompetitorsDomainTask {
  target: string;
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  item_types?: Array<"organic" | "paid" | "featured_snippet" | "local_pack">;
  include_clickstream_data?: boolean;
  filters?: unknown[];
  order_by?: string[];
  limit?: number;
  offset?: number;
  max_rank_group?: number;
  exclude_top_domains?: boolean;
  exclude_domains?: string[];
  intersecting_domains?: string[];
  ignore_synonyms?: boolean;
  tag?: string;
}

export interface CompetitorDomainMetrics {
  pos_1: number;
  pos_2_3: number;
  pos_4_10: number;
  pos_11_20: number;
  pos_21_30: number;
  pos_31_40: number;
  pos_41_50: number;
  pos_51_60: number;
  pos_61_70: number;
  pos_71_80: number;
  pos_81_90: number;
  pos_91_100: number;
  etv: number;
  count: number;
  estimated_paid_traffic_cost: number;
  is_new: number;
  is_up: number;
  is_down: number;
  is_lost: number;
  clickstream_etv?: number;
  clickstream_gender_distribution?: { female: number; male: number };
  clickstream_age_distribution?: {
    "18-24": number;
    "25-34": number;
    "35-44": number;
    "45-54": number;
    "55-64": number;
  };
}

export interface CompetitorDomainFullMetrics {
  organic?: CompetitorDomainMetrics;
  paid?: CompetitorDomainMetrics;
  local_pack?: CompetitorDomainMetrics;
  featured_snippet?: CompetitorDomainMetrics;
}

export interface CompetitorDomainItem {
  se_type: string;
  domain: string;
  avg_position: number;
  sum_position: number;
  intersections: number;
  full_domain_metrics: CompetitorDomainFullMetrics;
  metrics: CompetitorDomainFullMetrics;
  competitor_metrics: CompetitorDomainFullMetrics;
}

export interface CompetitorsDomainResult {
  se_type: string;
  target: string;
  location_code: number;
  language_code: string;
  total_count: number;
  items_count: number;
  items: CompetitorDomainItem[];
}
