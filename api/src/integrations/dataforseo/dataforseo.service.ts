import { AppConfiguration } from "@/config/app.configuration";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";
import { firstValueFrom } from "rxjs";
import {
  appendCitationMarkers,
  linkNumberedCitationMarkers,
  rewriteInlineCitations,
} from "./citation-markers.util";
import {
  AiKeywordSearchVolumeResult,
  AiKeywordSearchVolumeTask,
  AiOverviewItem,
  ChatGptLlmResponseResult,
  ChatGptLlmResponseTask,
  ChatGptScrapeResult,
  ChatGptScrapeTask,
  ChatGptScrapeTaskPostTask,
  ChatGptScrapeTasksReadyResult,
  ClaudeLlmResponseResult,
  ClaudeLlmResponseTask,
  ClaudeLlmResponseTaskPostTask,
  ClaudeLlmResponseTasksReadyResult,
  CompetitorsDomainResult,
  CompetitorsDomainTask,
  DataForSeoAiAnswer,
  DataForSeoAiAnswerRequest,
  DataForSeoResponse,
  GeminiScrapeResult,
  GeminiScrapeTask,
  GeminiScrapeTaskPostTask,
  GeminiScrapeTasksReadyResult,
  GoogleAiModeResult,
  GoogleAiModeTask,
  GoogleAiModeTaskPostTask,
  GoogleOrganicRegularResult,
  GoogleOrganicTask,
  GoogleOrganicTaskPostTask,
  GoogleSerpResult,
  KeywordIdeasResult,
  KeywordIdeasTask,
  KeywordOverviewResult,
  KeywordOverviewTask,
  KeywordSuggestionsResult,
  KeywordSuggestionsTask,
  LlmResponseResult,
  PerplexityLlmResponseResult,
  PerplexityLlmResponseTask,
  RelatedKeywordsResult,
  RelatedKeywordsTask,
  SerpTasksReadyResult,
} from "./dataforseo.types";

const BASE_URL = "https://api.dataforseo.com/v3";
const DEFAULT_AI_LOCATION_CODE = 2840;
const DEFAULT_AI_LANGUAGE_CODE = "en";
const DEFAULT_MAX_OUTPUT_TOKENS = 2_048;
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6";
const DEFAULT_PERPLEXITY_MODEL = "sonar";
const DEFAULT_CHATGPT_MODEL = "gpt-5.6-luna";

function requireFirstResult<T>(
  response: DataForSeoResponse<T>,
  fallbackMessage: string,
): T {
  const result = response.tasks?.[0]?.result?.[0];
  if (!result) {
    throw new Error(response.tasks?.[0]?.status_message ?? fallbackMessage);
  }
  return result;
}

/**
 * Claude returns plain prose with its sources hanging off each section.
 * Perplexity places numbered references such as `[1][2]` in the prose, with the
 * numbers matching the section's annotations. Both are normalised to the same
 * citation links every other engine produces.
 */
function normalizeLlmAnswer(
  result: LlmResponseResult,
  linkNumberedCitations = false,
): DataForSeoAiAnswer {
  const sections = (result.items ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.sections ?? []);

  const titleByUrl = new Map<string, string>();
  const blocks = sections.map((section) => {
    const sources = (section.annotations ?? []).map((annotation) => ({
      url: annotation.url,
      title: annotation.title ?? "",
      excerpt: null,
    }));

    for (const source of sources) {
      if (!titleByUrl.has(source.url)) {
        titleByUrl.set(source.url, source.title);
      }
    }

    const text = section.text ?? "";
    if (linkNumberedCitations) {
      const linkedText = linkNumberedCitationMarkers(text, sources);
      if (linkedText !== text) {
        return linkedText;
      }
    }

    return appendCitationMarkers(text, sources);
  });

  const { content, citations } = rewriteInlineCitations(
    blocks.join("\n\n"),
    titleByUrl,
  );

  return {
    content,
    webSearch: result.web_search ?? true,
    citations,
    fanOutQueries: result.fan_out_queries ?? [],
  };
}

@Injectable()
export class DataForSeoService {
  // Same pattern as the other API clients: cap concurrent requests so bursts
  // queue here instead of triggering DataForSEO 429s.
  private readonly limit = pLimit(30);

  constructor(
    private readonly http: HttpService,
    private readonly config: AppConfiguration,
  ) {}

  async getAiAnswer({
    engine,
    prompt,
    modelName,
    maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
    locationCode = DEFAULT_AI_LOCATION_CODE,
    languageCode = DEFAULT_AI_LANGUAGE_CODE,
    forceWebSearch = true,
  }: DataForSeoAiAnswerRequest): Promise<DataForSeoAiAnswer> {
    switch (engine) {
      case "google-ai-overview": {
        const result = requireFirstResult(
          await this.getGoogleSerpAiOverview({
            keyword: prompt,
            language_code: languageCode,
            location_code: locationCode,
            load_async_ai_overview: true,
          }),
          "Google AI Overview response returned no result",
        );
        const overview = result.items?.find(
          (item): item is AiOverviewItem => item.type === "ai_overview",
        );
        // AI Overviews already place `[[1]](url)` markers in the markdown, so
        // only the numbering is normalised. `references` supplies the titles
        // and excerpts the markdown itself does not carry.
        const referenceByUrl = new Map(
          (overview?.references ?? []).map((source) => [source.url, source]),
        );
        const { content, citations } = rewriteInlineCitations(
          overview?.markdown ?? "",
          new Map(
            [...referenceByUrl].map(([url, source]) => [
              url,
              source.title ?? "",
            ]),
          ),
        );

        return {
          content,
          webSearch: true,
          citations: citations.map((citation) => ({
            ...citation,
            excerpt: referenceByUrl.get(citation.url)?.text ?? null,
          })),
          fanOutQueries: [],
        };
      }

      case "perplexity": {
        const result = requireFirstResult(
          await this.getPerplexityLlmResponse({
            user_prompt: prompt,
            model_name: modelName ?? DEFAULT_PERPLEXITY_MODEL,
            max_output_tokens: maxOutputTokens,
          }),
          "Perplexity response returned no result",
        );
        return normalizeLlmAnswer(result, true);
      }

      case "claude": {
        const result = requireFirstResult(
          await this.getClaudeLlmResponse({
            user_prompt: prompt,
            model_name: modelName ?? DEFAULT_CLAUDE_MODEL,
            max_output_tokens: maxOutputTokens,
            web_search: true,
            force_web_search: forceWebSearch,
          }),
          "Claude response returned no result",
        );
        return normalizeLlmAnswer(result);
      }

      case "chatgpt": {
        const result = requireFirstResult(
          await this.getChatGptLlmResponse({
            user_prompt: prompt,
            model_name: modelName ?? DEFAULT_CHATGPT_MODEL,
            max_output_tokens: maxOutputTokens,
            web_search: true,
            force_web_search: forceWebSearch,
          }),
          "ChatGPT response returned no result",
        );
        return normalizeLlmAnswer(result);
      }

      default:
        throw new Error(`Unsupported DataForSEO AI engine: ${engine}`);
    }
  }

  // --- AI Optimization keyword data ---

  async getAiKeywordSearchVolume(
    task: AiKeywordSearchVolumeTask,
  ): Promise<DataForSeoResponse<AiKeywordSearchVolumeResult>> {
    return this.postWithRetry<AiKeywordSearchVolumeResult>(
      `${BASE_URL}/ai_optimization/ai_keyword_data/keywords_search_volume/live`,
      [task],
    );
  }

  // --- DataForSEO Labs (Google keyword & competitor data) ---

  async getRelatedKeywords(
    task: RelatedKeywordsTask,
  ): Promise<DataForSeoResponse<RelatedKeywordsResult>> {
    return this.postWithRetry<RelatedKeywordsResult>(
      `${BASE_URL}/dataforseo_labs/google/related_keywords/live`,
      [task],
    );
  }

  async getKeywordIdeas(
    task: KeywordIdeasTask,
  ): Promise<DataForSeoResponse<KeywordIdeasResult>> {
    return this.postWithRetry<KeywordIdeasResult>(
      `${BASE_URL}/dataforseo_labs/google/keyword_ideas/live`,
      [task],
    );
  }

  async getKeywordSuggestions(
    task: KeywordSuggestionsTask,
  ): Promise<DataForSeoResponse<KeywordSuggestionsResult>> {
    return this.postWithRetry<KeywordSuggestionsResult>(
      `${BASE_URL}/dataforseo_labs/google/keyword_suggestions/live`,
      [task],
    );
  }

  async getKeywordOverview(
    task: KeywordOverviewTask,
  ): Promise<DataForSeoResponse<KeywordOverviewResult>> {
    return this.postWithRetry<KeywordOverviewResult>(
      `${BASE_URL}/dataforseo_labs/google/keyword_overview/live`,
      [task],
    );
  }

  async getCompetitorsDomain(
    task: CompetitorsDomainTask,
  ): Promise<DataForSeoResponse<CompetitorsDomainResult>> {
    return this.postWithRetry<CompetitorsDomainResult>(
      `${BASE_URL}/dataforseo_labs/google/competitors_domain/live`,
      [task],
    );
  }

  // --- Google Organic SERP ---

  async getGoogleSerpAiOverview(
    task: GoogleOrganicTask,
  ): Promise<DataForSeoResponse<GoogleSerpResult>> {
    return this.postWithRetry<GoogleSerpResult>(
      `${BASE_URL}/serp/google/organic/live/advanced`,
      [
        {
          ...task,
          load_async_ai_overview: task.load_async_ai_overview ?? true,
        },
      ],
    );
  }

  async getGoogleOrganicSerpRegular(
    task: GoogleOrganicTask,
  ): Promise<DataForSeoResponse<GoogleOrganicRegularResult>> {
    return this.postWithRetry<GoogleOrganicRegularResult>(
      `${BASE_URL}/serp/google/organic/live/regular`,
      [task],
    );
  }

  async postGoogleOrganicSerpTask(
    task: GoogleOrganicTaskPostTask,
  ): Promise<DataForSeoResponse<GoogleSerpResult>> {
    return this.postWithRetry<GoogleSerpResult>(
      `${BASE_URL}/serp/google/organic/task_post`,
      [task],
    );
  }

  async getGoogleOrganicSerpTaskRegular(
    taskId: string,
  ): Promise<DataForSeoResponse<GoogleOrganicRegularResult>> {
    return this.getWithRetry<GoogleOrganicRegularResult>(
      `${BASE_URL}/serp/google/organic/task_get/regular/${taskId}`,
    );
  }

  // ponytail: task_get/regular has no ai_overview item, needed for monitoring
  async getGoogleOrganicSerpTaskAdvanced(
    taskId: string,
  ): Promise<DataForSeoResponse<GoogleSerpResult>> {
    return this.getWithRetry<GoogleSerpResult>(
      `${BASE_URL}/serp/google/organic/task_get/advanced/${taskId}`,
    );
  }

  async getGoogleOrganicSerpTasksReady(): Promise<
    DataForSeoResponse<SerpTasksReadyResult>
  > {
    return this.getWithRetry<SerpTasksReadyResult>(
      `${BASE_URL}/serp/google/organic/tasks_ready`,
    );
  }

  // --- Google AI Mode SERP ---

  async getGoogleAiModeSerp(
    task: GoogleAiModeTask,
  ): Promise<DataForSeoResponse<GoogleAiModeResult>> {
    return this.postWithRetry<GoogleAiModeResult>(
      `${BASE_URL}/serp/google/ai_mode/live/advanced`,
      [task],
    );
  }

  async postGoogleAiModeSerpTask(
    task: GoogleAiModeTaskPostTask,
  ): Promise<DataForSeoResponse<GoogleAiModeResult>> {
    return this.postWithRetry<GoogleAiModeResult>(
      `${BASE_URL}/serp/google/ai_mode/task_post`,
      [task],
    );
  }

  async getGoogleAiModeSerpTask(
    taskId: string,
  ): Promise<DataForSeoResponse<GoogleAiModeResult>> {
    return this.getWithRetry<GoogleAiModeResult>(
      `${BASE_URL}/serp/google/ai_mode/task_get/advanced/${taskId}`,
    );
  }

  async getGoogleAiModeSerpTasksReady(): Promise<
    DataForSeoResponse<SerpTasksReadyResult>
  > {
    return this.getWithRetry<SerpTasksReadyResult>(
      `${BASE_URL}/serp/google/ai_mode/tasks_ready`,
    );
  }

  // --- LLM Responses (direct chat-completion style: ChatGPT, Claude, Perplexity) ---

  async getChatGptLlmResponse(
    task: ChatGptLlmResponseTask,
  ): Promise<DataForSeoResponse<ChatGptLlmResponseResult>> {
    return this.postWithRetry<ChatGptLlmResponseResult>(
      `${BASE_URL}/ai_optimization/chat_gpt/llm_responses/live`,
      [{ web_search: true, ...task }],
    );
  }

  async getClaudeLlmResponse(
    task: ClaudeLlmResponseTask,
  ): Promise<DataForSeoResponse<ClaudeLlmResponseResult>> {
    return this.postWithRetry<ClaudeLlmResponseResult>(
      `${BASE_URL}/ai_optimization/claude/llm_responses/live`,
      [task],
    );
  }

  async postClaudeLlmResponseTask(
    task: ClaudeLlmResponseTaskPostTask,
  ): Promise<DataForSeoResponse<ClaudeLlmResponseResult>> {
    return this.postWithRetry<ClaudeLlmResponseResult>(
      `${BASE_URL}/ai_optimization/claude/llm_responses/task_post`,
      [task],
    );
  }

  async getClaudeLlmResponseTask(
    taskId: string,
  ): Promise<DataForSeoResponse<ClaudeLlmResponseResult>> {
    return this.getWithRetry<ClaudeLlmResponseResult>(
      `${BASE_URL}/ai_optimization/claude/llm_responses/task_get/${taskId}`,
    );
  }

  async getClaudeLlmResponseTasksReady(): Promise<
    DataForSeoResponse<ClaudeLlmResponseTasksReadyResult>
  > {
    return this.getWithRetry<ClaudeLlmResponseTasksReadyResult>(
      `${BASE_URL}/ai_optimization/claude/llm_responses/tasks_ready`,
    );
  }

  async getPerplexityLlmResponse(
    task: PerplexityLlmResponseTask,
  ): Promise<DataForSeoResponse<PerplexityLlmResponseResult>> {
    return this.postWithRetry<PerplexityLlmResponseResult>(
      `${BASE_URL}/ai_optimization/perplexity/llm_responses/live`,
      [
        {
          ...task,
          model_name: task.model_name ?? "sonar",
          max_output_tokens: task.max_output_tokens ?? 2048,
        },
      ],
    );
  }

  // --- LLM Scrape (search-engine style AI results pages: ChatGPT, Gemini) ---

  async getChatGptScrape(
    task: ChatGptScrapeTask,
  ): Promise<DataForSeoResponse<ChatGptScrapeResult>> {
    return this.postWithRetry<ChatGptScrapeResult>(
      `${BASE_URL}/ai_optimization/chat_gpt/llm_scraper/live/advanced`,
      [task],
    );
  }

  async postChatGptScrapeTask(
    task: ChatGptScrapeTaskPostTask,
  ): Promise<DataForSeoResponse<ChatGptScrapeResult>> {
    return this.postWithRetry<ChatGptScrapeResult>(
      `${BASE_URL}/ai_optimization/chat_gpt/llm_scraper/task_post`,
      [task],
    );
  }

  async getChatGptScrapeTask(
    taskId: string,
  ): Promise<DataForSeoResponse<ChatGptScrapeResult>> {
    return this.getWithRetry<ChatGptScrapeResult>(
      `${BASE_URL}/ai_optimization/chat_gpt/llm_scraper/task_get/advanced/${taskId}`,
    );
  }

  async getChatGptScrapeTasksReady(): Promise<
    DataForSeoResponse<ChatGptScrapeTasksReadyResult>
  > {
    return this.getWithRetry<ChatGptScrapeTasksReadyResult>(
      `${BASE_URL}/ai_optimization/chat_gpt/llm_scraper/tasks_ready`,
    );
  }

  async getGeminiScrape(
    task: GeminiScrapeTask,
  ): Promise<DataForSeoResponse<GeminiScrapeResult>> {
    return this.postWithRetry<GeminiScrapeResult>(
      `${BASE_URL}/ai_optimization/gemini/llm_scraper/live/advanced`,
      [task],
    );
  }

  async postGeminiScrapeTask(
    task: GeminiScrapeTaskPostTask,
  ): Promise<DataForSeoResponse<GeminiScrapeResult>> {
    return this.postWithRetry<GeminiScrapeResult>(
      `${BASE_URL}/ai_optimization/gemini/llm_scraper/task_post`,
      [task],
    );
  }

  async getGeminiScrapeTask(
    taskId: string,
  ): Promise<DataForSeoResponse<GeminiScrapeResult>> {
    return this.getWithRetry<GeminiScrapeResult>(
      `${BASE_URL}/ai_optimization/gemini/llm_scraper/task_get/advanced/${taskId}`,
    );
  }

  async getGeminiScrapeTasksReady(): Promise<
    DataForSeoResponse<GeminiScrapeTasksReadyResult>
  > {
    return this.getWithRetry<GeminiScrapeTasksReadyResult>(
      `${BASE_URL}/ai_optimization/gemini/llm_scraper/tasks_ready`,
    );
  }

  // --- Shared request plumbing ---

  private async postWithRetry<T>(
    url: string,
    body: unknown[],
  ): Promise<DataForSeoResponse<T>> {
    return this.withRetry(() =>
      firstValueFrom(
        this.http.post<DataForSeoResponse<T>>(url, body, {
          headers: this.authHeaders(),
        }),
      ),
    );
  }

  private async getWithRetry<T>(url: string): Promise<DataForSeoResponse<T>> {
    return this.withRetry(() =>
      firstValueFrom(
        this.http.get<DataForSeoResponse<T>>(url, {
          headers: this.authHeaders(),
        }),
      ),
    );
  }

  private authHeaders() {
    return {
      Authorization: `Basic ${this.config.dataForSeoBase64Credentials}`,
      "Content-Type": "application/json",
    };
  }

  private async withRetry<T>(
    request: () => Promise<{ data: DataForSeoResponse<T> }>,
  ): Promise<DataForSeoResponse<T>> {
    const exec = async (): Promise<DataForSeoResponse<T>> => {
      try {
        const { data } = await request();
        return data;
      } catch (error: unknown) {
        const responseStatus = (error as { response?: { status?: unknown } })
          .response?.status;
        const status =
          typeof responseStatus === "number" ? responseStatus : undefined;
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw new AbortError(error instanceof Error ? error : String(error));
        }
        throw error;
      }
    };

    return this.limit(() =>
      pRetry(exec, {
        retries: 5,
        minTimeout: 1000,
        maxTimeout: 5000,
        factor: 2,
        randomize: true,
      }),
    );
  }
}
