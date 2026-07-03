import { AppConfiguration } from "@/config/app.configuration";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import pRetry, { AbortError } from "p-retry";
import { firstValueFrom } from "rxjs";
import {
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
  PerplexityLlmResponseResult,
  PerplexityLlmResponseTask,
  RelatedKeywordsResult,
  RelatedKeywordsTask,
  SerpTasksReadyResult,
} from "./dataforseo.types";

const BASE_URL = "https://api.dataforseo.com/v3";

@Injectable()
export class DataForSeoService {
  constructor(
    private readonly http: HttpService,
    private readonly config: AppConfiguration,
  ) {}

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
      [{ ...task, load_async_ai_overview: task.load_async_ai_overview ?? true }],
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
      } catch (err: any) {
        const status: number | undefined = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw new AbortError(err);
        }
        throw err;
      }
    };

    return pRetry(exec, {
      retries: 5,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 2,
      randomize: true,
    });
  }
}
