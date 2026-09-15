export type DataForSeoAiEngine =
  | "chatgpt"
  | "claude"
  | "perplexity"
  | "google-ai-overview";

export interface DataForSeoAiAnswerRequest {
  engine: DataForSeoAiEngine;
  prompt: string;
  modelName?: string;
  maxOutputTokens?: number;
  locationCode?: number;
  languageCode?: string;
  forceWebSearch?: boolean;
}

export interface DataForSeoAiSource {
  url: string;
  title: string;
  excerpt: string | null;
}

export interface DataForSeoAiAnswer {
  content: string;
  webSearch: boolean;
  citations: DataForSeoAiSource[];
  fanOutQueries: string[];
}

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
  // Claude's llm_responses task_get puts fan_out_queries here (task level)
  // instead of inside result[0], unlike ChatGPT's scraper endpoint.
  fan_out_queries?: string[];
}

// --- AI Optimization keyword data ---

export interface AiKeywordSearchVolumeTask {
  keywords: string[];
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  tag?: string;
}

export interface AiKeywordMonthlySearch {
  year: number;
  month: number;
  ai_search_volume: number;
}

export interface AiKeywordSearchVolumeItem {
  keyword: string;
  ai_search_volume: number;
  ai_monthly_searches: AiKeywordMonthlySearch[];
}

export interface AiKeywordSearchVolumeResult {
  location_code: number;
  language_code: string;
  items_count: number;
  items: AiKeywordSearchVolumeItem[];
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

// --- Google SERP shared building blocks (organic & AI Mode) ---

export interface SerpRating {
  rating_type: "Max5" | "Percents" | "CustomMax";
  value: number;
  votes_count: number;
  rating_max: number;
}

export interface SerpPrice {
  current?: number;
  regular?: number;
  max_value?: number;
  currency?: string;
  is_price_range?: boolean;
  displayed_price?: string;
}

export interface SerpRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SerpImageElement {
  type: "images_element";
  alt?: string;
  url?: string;
  image_url?: string;
}

export interface SerpLinkElement {
  type: "link_element";
  title: string;
  description?: string;
  url: string;
  domain?: string;
  ad_aclk?: string;
}

export interface SerpAboutThisResult {
  type: "about_this_result_element";
  url?: string;
  source?: string;
  source_info?: string;
  source_url?: string;
  language?: string;
  location?: string;
  search_terms?: string[];
  related_terms?: string[];
}

export interface SerpSpell {
  keyword: string;
  type:
    | "did_you_mean"
    | "showing_results_for"
    | "no_results_found_for"
    | "including_results_for";
}

export interface SerpRefinementChipsOption {
  type: "refinement_chips_option";
  title: string;
  url: string;
  domain: string;
}

export interface SerpRefinementChipsElement {
  type: "refinement_chips_element";
  title: string;
  url?: string | null;
  domain?: string | null;
  options?: SerpRefinementChipsOption[] | null;
}

export interface SerpRefinementChips {
  type: "refinement_chips";
  xpath: string;
  items: SerpRefinementChipsElement[];
}

export interface SerpTasksReadyResult {
  id: string;
  se: string;
  se_type: string;
  date_posted: string;
  tag?: string;
  endpoint_regular: string | null;
  endpoint_advanced: string | null;
  endpoint_html: string | null;
}

interface SerpItemBase {
  rank_group: number;
  rank_absolute: number;
  page?: number;
  position?: "left" | "right";
  xpath?: string;
  rectangle?: SerpRectangle | null;
}

// --- Google Organic SERP ---

export interface GoogleOrganicStopCrawlMatch {
  match_type: "domain" | "with_subdomains" | "wildcard";
  match_value: string;
}

export interface GoogleOrganicTask {
  keyword: string;
  location_name?: string;
  location_code?: number;
  location_coordinate?: string;
  language_name?: string;
  language_code?: string;
  depth?: number;
  device?: "desktop" | "mobile";
  os?: "windows" | "macos" | "android" | "ios";
  tag?: string;
  load_async_ai_overview?: boolean;
  stop_crawl_on_match?: GoogleOrganicStopCrawlMatch[];
  max_crawl_pages?: number;
  search_param?: string;
  remove_from_url?: string[];
  people_also_ask_click_depth?: number;
  group_organic_results?: boolean;
  calculate_rectangles?: boolean;
  browser_screen_width?: number;
  browser_screen_height?: number;
  browser_screen_resolution_ratio?: number;
  url?: string;
  se_domain?: string;
  target?: string;
  target_search_mode?: "all" | "any";
  find_targets_in?: string[];
  ignore_targets_in?: string[];
}

export interface GoogleOrganicTaskPostTask extends GoogleOrganicTask {
  priority?: 1 | 2;
  expand_ai_overview?: boolean;
  postback_url?: string;
  postback_data?: "regular" | "advanced" | "html";
  pingback_url?: string;
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
  page?: number;
  position: string;
  xpath?: string;
  title?: string;
  description?: string;
  asynchronous_ai_overview: boolean;
  markdown?: string;
  items?: AiOverviewElement[];
  references?: AiOverviewReference[];
  rectangle?: SerpRectangle | null;
}

export interface GoogleOrganicResultItem extends SerpItemBase {
  type: "organic";
  domain: string;
  title: string;
  url: string;
  cache_url?: string;
  related_search_url?: string;
  breadcrumb?: string;
  website_name?: string;
  is_image?: boolean;
  is_video?: boolean;
  is_featured_snippet?: boolean;
  is_malicious?: boolean;
  is_web_story?: boolean;
  description?: string;
  pre_snippet?: string;
  extended_snippet?: string;
  images?: SerpImageElement[] | null;
  amp_version?: boolean;
  rating?: SerpRating | null;
  price?: SerpPrice | null;
  highlighted?: string[];
  links?: SerpLinkElement[] | null;
  extended_people_also_search?: string[] | null;
  about_this_result?: SerpAboutThisResult | null;
  related_result?: GoogleOrganicResultItem[] | null;
  timestamp?: string | null;
}

export interface GoogleOrganicFeaturedSnippetItem
  extends Omit<GoogleOrganicResultItem, "type"> {
  type: "featured_snippet";
}

export interface GoogleOrganicPaidItem extends SerpItemBase {
  type: "paid";
  title: string;
  domain: string;
  website_name?: string;
  description?: string;
  url: string;
  breadcrumb?: string;
  is_image?: boolean;
  is_video?: boolean;
  images?: SerpImageElement[] | null;
  highlighted?: string[];
  extra?: { ad_aclk?: string };
  description_rows?: string[];
  links?: SerpLinkElement[] | null;
  price?: SerpPrice | null;
  rating?: SerpRating | null;
}

export interface GoogleOrganicCarouselElement {
  type: "carousel_element";
  title?: string;
  subtitle?: string;
  image_url?: string;
}

export interface GoogleOrganicCarouselItem extends SerpItemBase {
  type: "carousel";
  title?: string;
  items?: GoogleOrganicCarouselElement[];
}

export interface GoogleOrganicMultiCarouselSnippet {
  type: "multi_carousel_snippet";
  title?: string;
  subtitle?: string;
  image_url?: string;
}

export interface GoogleOrganicMultiCarouselElement {
  type: "multi_carousel_element";
  title?: string;
  multi_carousel_snippets?: GoogleOrganicMultiCarouselSnippet[];
}

export interface GoogleOrganicMultiCarouselItem extends SerpItemBase {
  type: "multi_carousel";
  items?: GoogleOrganicMultiCarouselElement[];
}

export interface GoogleOrganicAnswerBoxItem extends SerpItemBase {
  type: "answer_box";
  text?: string[];
  links?: SerpLinkElement[] | null;
}

export interface GoogleOrganicRelatedSearchesItem extends SerpItemBase {
  type: "related_searches";
  items?: string[];
}

export interface GoogleOrganicPeopleAlsoSearchItem extends SerpItemBase {
  type: "people_also_search";
  title?: string;
  items?: string[];
}

export interface GoogleOrganicLocalPackItem extends SerpItemBase {
  type: "local_pack";
  title?: string;
  description?: string;
  domain?: string;
  phone?: string;
  booking_url?: string;
  url?: string;
  is_paid?: boolean;
  rating?: SerpRating | null;
  cid?: string;
}

export interface GoogleOrganicPeopleAlsoAskElement {
  type: "people_also_ask_element";
  title: string;
  description?: string;
  links?: SerpLinkElement[] | null;
}

export interface GoogleOrganicPeopleAlsoAskItem extends SerpItemBase {
  type: "people_also_ask";
  title?: string;
  items?: GoogleOrganicPeopleAlsoAskElement[];
}

export interface GoogleOrganicKnowledgeGraphItem extends SerpItemBase {
  type: "knowledge_graph";
  title?: string;
  description?: string;
  image_url?: string;
  // ponytail: nested KG element schema isn't documented per-field, keep it honest
  items?: Record<string, unknown>[];
}

export interface GoogleOrganicImagesItem extends SerpItemBase {
  type: "images";
  title?: string;
  items?: SerpImageElement[];
}

export interface GoogleOrganicVideoItem extends SerpItemBase {
  type: "video";
  title?: string;
  domain?: string;
  url?: string;
  image_url?: string;
  duration?: string;
}

export interface GoogleOrganicTopStoriesItem extends SerpItemBase {
  type: "top_stories";
  title?: string;
  items?: Record<string, unknown>[];
}

export interface GoogleOrganicJobElement {
  type: "job_element";
  title?: string;
  company_name?: string;
  location?: string;
  url?: string;
}

export interface GoogleOrganicJobsItem extends SerpItemBase {
  type: "jobs";
  items?: GoogleOrganicJobElement[];
}

export interface GoogleOrganicShoppingElement {
  type: "shopping_element";
  title?: string;
  price?: SerpPrice | null;
  image_url?: string;
  url?: string;
}

export interface GoogleOrganicShoppingItem extends SerpItemBase {
  type: "shopping";
  items?: GoogleOrganicShoppingElement[];
}

export interface GoogleOrganicEventElement {
  type: "event_element";
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  url?: string;
}

export interface GoogleOrganicEventsItem extends SerpItemBase {
  type: "events";
  items?: GoogleOrganicEventElement[];
}

export interface GoogleOrganicMapItem extends SerpItemBase {
  type: "map";
  title?: string;
  url?: string;
  image_url?: string;
}

export interface GoogleOrganicAppItem extends SerpItemBase {
  type: "app";
  title?: string;
  app_id?: string;
  url?: string;
  rating?: SerpRating | null;
  image_url?: string;
}

export interface GoogleOrganicRecipeElement {
  type: "recipe_element";
  title?: string;
  image_url?: string;
  rating?: SerpRating | null;
}

export interface GoogleOrganicRecipesItem extends SerpItemBase {
  type: "recipes";
  items?: GoogleOrganicRecipeElement[];
}

export interface GoogleOrganicScholarlyArticleElement {
  type: "scholarly_article_element";
  title?: string;
  url?: string;
  publication_date?: string;
}

export interface GoogleOrganicScholarlyArticlesItem extends SerpItemBase {
  type: "scholarly_articles";
  items?: GoogleOrganicScholarlyArticleElement[];
}

export interface GoogleOrganicQuestionsAndAnswersElement {
  type: "questions_and_answers_element";
  title?: string;
  answers?: Record<string, unknown>[];
}

export interface GoogleOrganicQuestionsAndAnswersItem extends SerpItemBase {
  type: "questions_and_answers";
  items?: GoogleOrganicQuestionsAndAnswersElement[];
}

export interface GoogleOrganicFindResultsOnElement {
  type: "find_results_on_element";
  title?: string;
  domain?: string;
  url?: string;
}

export interface GoogleOrganicFindResultsOnItem extends SerpItemBase {
  type: "find_results_on";
  items?: GoogleOrganicFindResultsOnElement[];
}

export interface GoogleOrganicLocalServicesElement {
  type: "local_services_element";
  title?: string;
  rating?: SerpRating | null;
}

export interface GoogleOrganicLocalServicesItem extends SerpItemBase {
  type: "local_services";
  items?: GoogleOrganicLocalServicesElement[];
}

export interface GoogleOrganicMathSolverItem extends SerpItemBase {
  type: "math_solver";
  expression?: string;
  answer?: string;
}

export interface GoogleOrganicCurrencyBoxItem extends SerpItemBase {
  type: "currency_box";
  from_currency?: string;
  to_currency?: string;
  exchange_rate?: number;
}

export interface GoogleOrganicShortVideoElement {
  type: "short_video_element";
  title?: string;
  url?: string;
  image_url?: string;
}

export interface GoogleOrganicShortVideosItem extends SerpItemBase {
  type: "short_videos";
  items?: GoogleOrganicShortVideoElement[];
}

export interface GoogleOrganicExploreBrandsElement {
  type: "explore_brands_element";
  title?: string;
  image_url?: string;
  url?: string;
}

export interface GoogleOrganicExploreBrandsItem extends SerpItemBase {
  type: "explore_brands";
  items?: GoogleOrganicExploreBrandsElement[];
}

export interface GoogleOrganicPerspectivesElement {
  type: "perspectives_element";
  title?: string;
  description?: string;
  url?: string;
}

export interface GoogleOrganicPerspectivesItem extends SerpItemBase {
  type: "perspectives";
  items?: GoogleOrganicPerspectivesElement[];
}

export interface GoogleOrganicCourseElement {
  type: "course_element";
  title?: string;
  provider?: string;
  url?: string;
}

export interface GoogleOrganicCoursesItem extends SerpItemBase {
  type: "courses";
  items?: GoogleOrganicCourseElement[];
}

export interface GoogleOrganicGoogleReviewsItem extends SerpItemBase {
  type: "google_reviews";
  title?: string;
  rating?: SerpRating | null;
  items?: Record<string, unknown>[];
}

export interface GoogleOrganicThirdPartyReviewElement {
  type: "third_party_review_element";
  url?: string;
  domain?: string;
}

export interface GoogleOrganicThirdPartyReviewsItem extends SerpItemBase {
  type: "third_party_reviews";
  title?: string;
  items?: GoogleOrganicThirdPartyReviewElement[];
}

export interface GoogleOrganicGooglePostsItem extends SerpItemBase {
  type: "google_posts";
  items?: Record<string, unknown>[];
}

export interface GoogleOrganicHotelsPackElement {
  type: "hotels_pack_element";
  title?: string;
  rating?: SerpRating | null;
  price?: SerpPrice | null;
  image_url?: string;
  url?: string;
}

export interface GoogleOrganicHotelsPackItem extends SerpItemBase {
  type: "hotels_pack";
  items?: GoogleOrganicHotelsPackElement[];
}

// SERP feature types DataForSEO documents only as "items: array[{...}]" with
// no per-field schema (flights, hotels search widget, twitter, etc).
// ponytail: typed as a list block with unknown item shape; flesh out a
// specific interface here if a caller ever needs to read into one of these.
export interface GoogleOrganicGenericListItem extends SerpItemBase {
  type:
    | "google_flights"
    | "google_hotels"
    | "twitter"
    | "mention_carousel"
    | "top_sights"
    | "popular_products"
    | "podcasts"
    | "stocks_box"
    | "visual_stories"
    | "commercial_units"
    | "discussions_and_forums"
    | "compare_sites"
    | "found_on_web"
    | "refine_products"
    | "product_considerations";
  title?: string;
  items?: Record<string, unknown>[];
}

export type GoogleOrganicSerpItem =
  | GoogleOrganicResultItem
  | GoogleOrganicFeaturedSnippetItem
  | GoogleOrganicPaidItem
  | GoogleOrganicCarouselItem
  | GoogleOrganicMultiCarouselItem
  | GoogleOrganicAnswerBoxItem
  | GoogleOrganicRelatedSearchesItem
  | GoogleOrganicPeopleAlsoSearchItem
  | GoogleOrganicLocalPackItem
  | GoogleOrganicPeopleAlsoAskItem
  | GoogleOrganicKnowledgeGraphItem
  | GoogleOrganicImagesItem
  | GoogleOrganicVideoItem
  | GoogleOrganicTopStoriesItem
  | AiOverviewItem
  | GoogleOrganicJobsItem
  | GoogleOrganicShoppingItem
  | GoogleOrganicEventsItem
  | GoogleOrganicMapItem
  | GoogleOrganicAppItem
  | GoogleOrganicRecipesItem
  | GoogleOrganicScholarlyArticlesItem
  | GoogleOrganicQuestionsAndAnswersItem
  | GoogleOrganicFindResultsOnItem
  | GoogleOrganicLocalServicesItem
  | GoogleOrganicMathSolverItem
  | GoogleOrganicCurrencyBoxItem
  | GoogleOrganicShortVideosItem
  | GoogleOrganicExploreBrandsItem
  | GoogleOrganicPerspectivesItem
  | GoogleOrganicCoursesItem
  | GoogleOrganicGoogleReviewsItem
  | GoogleOrganicThirdPartyReviewsItem
  | GoogleOrganicGooglePostsItem
  | GoogleOrganicHotelsPackItem
  | GoogleOrganicGenericListItem;

export interface GoogleSerpResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  spell?: SerpSpell | null;
  refinement_chips?: SerpRefinementChips | null;
  item_types: string[];
  se_results_count?: number;
  pages_count?: number;
  items_count: number;
  items: GoogleOrganicSerpItem[];
}

// The "regular" endpoints only ever return these three lean item shapes.
export interface GoogleOrganicRegularItem {
  type: "organic" | "paid" | "featured_snippet";
  rank_group: number;
  rank_absolute: number;
  page: number;
  domain?: string;
  title: string;
  description?: string;
  url: string;
  breadcrumb?: string | null;
}

export interface GoogleOrganicRegularResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  spell?: SerpSpell | null;
  refinement_chips?: SerpRefinementChips | null;
  item_types: string[];
  se_results_count?: number;
  pages_count?: number;
  items_count: number;
  items: GoogleOrganicRegularItem[];
}

// --- Google AI Mode SERP ---

export interface GoogleAiModeTask {
  keyword: string;
  location_name?: string;
  location_code?: number;
  location_coordinate?: string;
  language_name?: string;
  language_code?: string;
  device?: "desktop" | "mobile";
  os?: "windows" | "macos" | "android" | "ios";
  tag?: string;
  calculate_rectangles?: boolean;
  browser_screen_width?: number;
  browser_screen_height?: number;
  browser_screen_resolution_ratio?: number;
}

export interface GoogleAiModeTaskPostTask extends GoogleAiModeTask {
  priority?: 1 | 2;
  postback_url?: string;
  postback_data?: "advanced" | "html";
  pingback_url?: string;
}

export interface GoogleAiModeReference {
  type: "ai_overview_reference";
  source?: string;
  domain?: string;
  url: string;
  title?: string;
  text?: string;
}

export interface GoogleAiModeElement {
  type: "ai_overview_element";
  position?: "left" | "right";
  title?: string | null;
  text?: string;
  markdown?: string;
  links?: SerpLinkElement[] | null;
  images?: SerpImageElement[] | null;
  references?: GoogleAiModeReference[];
}

export interface GoogleAiModeVideoElement {
  type: "ai_overview_video_element";
  position?: "left" | "right";
  title?: string;
  snippet?: string;
  url?: string;
  domain?: string;
  image_url?: string;
  source?: string;
  date?: string;
  timestamp?: string;
}

export interface GoogleAiModeTableElement {
  type: "ai_overview_table_element";
  position?: "left" | "right";
  markdown?: string;
  table: LlmScraperTable;
  references?: GoogleAiModeReference[];
}

export interface GoogleAiModeExpandedComponent {
  type: "ai_overview_expanded_component";
  title?: string;
  text?: string;
  markdown?: string;
  images?: SerpImageElement[] | null;
  links?: SerpLinkElement[] | null;
  references?: GoogleAiModeReference[];
}

export interface GoogleAiModeExpandedElement {
  type: "ai_overview_expanded_element";
  position?: "left" | "right";
  title?: string;
  text?: string;
  components?: GoogleAiModeExpandedComponent[];
}

export interface GoogleAiModeShoppingElement {
  type: "ai_overview_shopping_element";
  product_id?: string;
  data_docid?: string;
  gid?: string;
  title?: string;
  url?: string;
  domain?: string;
  rating?: SerpRating | null;
  price?: SerpPrice | null;
  seller?: string;
  snippet?: string;
  marketplace?: string;
  marketplace_url?: string;
  image_url?: string;
}

export interface GoogleAiModeShoppingItem {
  type: "ai_overview_shopping";
  position?: "left" | "right";
  title?: string;
  markdown?: string;
  items?: GoogleAiModeShoppingElement[];
}

export type GoogleAiModeOverviewElement =
  | GoogleAiModeElement
  | GoogleAiModeVideoElement
  | GoogleAiModeTableElement
  | GoogleAiModeExpandedElement
  | GoogleAiModeShoppingItem;

export interface GoogleAiModeOverviewItem {
  type: "ai_overview";
  rank_group: number;
  rank_absolute: number;
  page?: number;
  position?: "left" | "right";
  xpath?: string;
  asynchronous_ai_overview?: boolean;
  markdown: string;
  items?: GoogleAiModeOverviewElement[];
  references?: GoogleAiModeReference[];
  rectangle?: SerpRectangle | null;
}

export interface GoogleAiModeResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  spell?: SerpSpell | null;
  refinement_chips?: SerpRefinementChips | null;
  item_types: string[];
  se_results_count: number;
  items_count: number;
  items: GoogleAiModeOverviewItem[];
}

// --- LLM Responses (direct chat-completion style: ChatGPT, Claude, Perplexity) ---
//
// All three providers return the same result shape: usage stats plus a list
// of `message` (and, for reasoning models, `reasoning`) items made of text
// sections with optional source annotations.

export interface LlmMessageChainItem {
  role: "user" | "assistant";
  message: string;
}

export interface LlmResponseAnnotation {
  title: string;
  url: string;
}

export interface LlmResponseSection {
  type: string;
  text?: string;
  annotations?: LlmResponseAnnotation[] | null;
}

export interface LlmResponseItem {
  type: "message" | "reasoning" | string;
  sections: LlmResponseSection[];
}

export interface LlmResponseResult {
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens?: number;
  web_search?: boolean;
  money_spent?: number;
  datetime?: string;
  items: LlmResponseItem[];
  fan_out_queries?: string[];
}

export interface ChatGptLlmResponseTask {
  user_prompt: string;
  model_name: string;
  max_output_tokens?: number;
  web_search?: boolean;
  force_web_search?: boolean;
  web_search_country_iso_code?: string;
  system_message?: string;
  tag?: string;
}

export type ChatGptLlmResponseResult = LlmResponseResult;

export interface ClaudeLlmResponseTask {
  user_prompt: string;
  model_name: string;
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  web_search?: boolean;
  force_web_search?: boolean;
  web_search_country_iso_code?: string;
  web_search_city?: string;
  system_message?: string;
  message_chain?: LlmMessageChainItem[];
  use_reasoning?: boolean;
  tag?: string;
}

export interface ClaudeLlmResponseTaskPostTask extends ClaudeLlmResponseTask {
  postback_url?: string;
  pingback_url?: string;
}

export type ClaudeLlmResponseResult = LlmResponseResult;

export interface ClaudeLlmResponseTasksReadyResult {
  id: string;
  se: string;
  function: string;
  date_posted: string;
  tag?: string;
  endpoint: string;
}

export interface PerplexityLlmResponseTask {
  user_prompt: string;
  model_name?: string;
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  web_search_country_iso_code?: string;
  system_message?: string;
  message_chain?: LlmMessageChainItem[];
  tag?: string;
}

export type PerplexityLlmResponseResult = LlmResponseResult;

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

// --- LLM Scrape (search-engine style AI results pages: ChatGPT, Gemini) ---
//
// Unlike LLM Responses above, these scrape the AI's rendered search-results
// UI, so each provider returns its own set of typed result blocks
// (text/table/images/...) instead of a plain chat message.

export interface LlmScraperTable {
  table_header: string[];
  table_content: string[][];
}

export interface ChatGptScrapeTask {
  keyword: string;
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  force_web_search?: boolean;
  tag?: string;
}

export interface ChatGptScrapeTaskPostTask {
  keyword: string;
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  priority?: 1 | 2;
  force_web_search?: boolean;
  expand_citations?: boolean;
  tag?: string;
  postback_url?: string;
  postback_data?: "advanced" | "html";
  pingback_url?: string;
}

export interface ChatGptScrapeRating {
  rating_type: "Max5" | "Percents" | "CustomMax";
  value: number;
  votes_count: number;
  rating_max: number;
}

export interface ChatGptScrapeSearchResultItem {
  type: "chatgpt_search_result";
  url: string;
  domain: string;
  title: string;
  description: string;
  breadcrumb: string;
}

export interface ChatGptScrapeSource {
  type: "chat_gpt_source";
  title: string;
  snippet: string;
  domain: string;
  url: string;
  thumbnail?: string;
  source_name: string;
  publication_date?: string;
  markdown?: string;
}

export interface ChatGptScrapeBrandEntity {
  type: "chat_gpt_brand_entity";
  title: string;
  category?: string;
  markdown?: string;
  urls?: string[];
}

export interface ChatGptScrapeTextItem {
  type: "chat_gpt_text";
  rank_group: number;
  rank_absolute: number;
  markdown: string;
  sources?: ChatGptScrapeSource[];
  brand_entities?: ChatGptScrapeBrandEntity[];
}

export interface ChatGptScrapeTableItem {
  type: "chat_gpt_table";
  rank_group: number;
  rank_absolute: number;
  text?: string;
  markdown?: string;
  table: LlmScraperTable;
  brand_entities?: ChatGptScrapeBrandEntity[];
}

export interface ChatGptScrapeNavigationListItem {
  type: "chat_gpt_navigation_list";
  rank_group: number;
  rank_absolute: number;
  title: string;
  sources?: ChatGptScrapeSource[];
}

export interface ChatGptScrapeImageElement {
  type: "chat_gpt_images_element";
  alt?: string;
  url?: string;
  image_url?: string;
  markdown?: string;
}

export interface ChatGptScrapeImagesItem {
  type: "chat_gpt_images";
  rank_group: number;
  rank_absolute: number;
  markdown?: string;
  items: ChatGptScrapeImageElement[];
}

export interface ChatGptScrapeLocalBusinessElement {
  type: "chat_gpt_local_businesses_element";
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  reviews_count?: number;
  url?: string;
  domain?: string;
  rating?: ChatGptScrapeRating | null;
}

export interface ChatGptScrapeLocalBusinessesItem {
  type: "chat_gpt_local_businesses";
  rank_group: number;
  rank_absolute: number;
  markdown?: string;
  items: ChatGptScrapeLocalBusinessElement[];
}

export interface ChatGptScrapeGoogleShoppingProductId {
  type: "chat_gpt_google_shopping_product";
  ei?: string;
  product_id?: string;
  catalog_id?: string;
  gpcid?: string;
  headline_offer_docid?: string;
  image_docid?: string;
  rds?: string;
  query?: string;
  mid?: string;
  pvt?: string;
  uule?: string;
  gl?: string;
  hl?: string;
}

export interface ChatGptScrapeProductElement {
  type: "chat_gpt_products_element";
  product_id?: string;
  merchants?: string;
  id_to_token_map?: string;
  title: string;
  rating?: ChatGptScrapeRating | null;
  price?: number;
  currency?: string;
  tag?: string;
  url?: string;
  domain?: string;
  images?: string[];
  product_ids?: ChatGptScrapeGoogleShoppingProductId[];
}

export interface ChatGptScrapeProductsItem {
  type: "chat_gpt_products";
  rank_group: number;
  rank_absolute: number;
  items: ChatGptScrapeProductElement[];
}

export interface ChatGptScrapeAdvertiser {
  name: string;
  url?: string;
  favicon_url?: string;
}

export interface ChatGptScrapeAdItem {
  type: "chat_gpt_ad";
  rank_group: number;
  rank_absolute: number;
  title: string;
  snippet?: string;
  url?: string;
  domain?: string;
  image_url?: string;
  advertiser?: ChatGptScrapeAdvertiser;
}

export type ChatGptScrapeItem =
  | ChatGptScrapeTextItem
  | ChatGptScrapeTableItem
  | ChatGptScrapeNavigationListItem
  | ChatGptScrapeImagesItem
  | ChatGptScrapeLocalBusinessesItem
  | ChatGptScrapeProductsItem
  | ChatGptScrapeAdItem;

export interface ChatGptScrapeResult {
  keyword: string;
  location_code: number;
  language_code: string;
  model: string;
  check_url: string;
  datetime: string;
  markdown: string;
  search_results?: ChatGptScrapeSearchResultItem[];
  sources?: ChatGptScrapeSource[];
  fan_out_queries?: string[];
  brand_entities?: ChatGptScrapeBrandEntity[];
  se_results_count: number;
  item_types: string[];
  items_count: number;
  items: ChatGptScrapeItem[];
}

export interface ChatGptScrapeTasksReadyResult {
  id: string;
  se: string;
  se_type: string;
  date_posted: string;
  tag?: string;
  endpoint_regular: string | null;
  endpoint_advanced: string;
  endpoint_html: string;
}

export interface GeminiScrapeTask {
  keyword: string;
  location_name?: string;
  location_code?: number;
  location_coordinate?: string;
  language_name?: string;
  language_code?: string;
  tag?: string;
}

export interface GeminiScrapeTaskPostTask extends GeminiScrapeTask {
  priority?: 1 | 2;
  expand_citations?: boolean;
  postback_url?: string;
  postback_data?: "advanced" | "html";
  pingback_url?: string;
}

export interface GeminiScrapeSource {
  type: "gemini_source";
  title: string;
  snippet: string;
  domain: string;
  url: string;
  thumbnail?: string;
  source_name: string;
  publication_date?: string | null;
  markdown?: string;
}

export interface GeminiScrapeTextItem {
  type: "gemini_text";
  rank_group: number;
  rank_absolute: number;
  markdown: string;
  original_text?: string;
  sources?: GeminiScrapeSource[];
}

export interface GeminiScrapeTableItem {
  type: "gemini_table";
  rank_group: number;
  rank_absolute: number;
  markdown: string;
  original_text?: string;
  table: LlmScraperTable;
}

export interface GeminiScrapeImageElement {
  type: "gemini_images_element";
  url?: string;
  alt?: string;
  image_url?: string;
  markdown?: string;
}

export interface GeminiScrapeImagesItem {
  type: "gemini_images";
  rank_group: number;
  rank_absolute: number;
  markdown?: string;
  items: GeminiScrapeImageElement[];
}

export type GeminiScrapeItem =
  | GeminiScrapeTextItem
  | GeminiScrapeTableItem
  | GeminiScrapeImagesItem;

export interface GeminiScrapeResult {
  keyword: string;
  location_code: number;
  language_code: string;
  model: string;
  datetime: string;
  markdown: string;
  sources?: GeminiScrapeSource[];
  se_results_count: number;
  item_types: string[];
  items_count: number;
  items: GeminiScrapeItem[];
}

export interface GeminiScrapeTasksReadyResult {
  id: string;
  se: string;
  function: string;
  date_posted: string;
  tag?: string;
  endpoint_advanced: string | null;
  endpoint_html: string | null;
}
