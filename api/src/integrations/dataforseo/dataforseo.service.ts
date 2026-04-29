import { AppConfiguration } from "@/config/app.configuration";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import pRetry, { AbortError } from "p-retry";
import { firstValueFrom } from "rxjs";
import {
  ChatGptLlmResult,
  ChatGptLlmTask,
  CompetitorsDomainResult,
  CompetitorsDomainTask,
  DataForSeoResponse,
  GoogleSerpAiOverviewTask,
  GoogleSerpResult,
  KeywordIdeasResult,
  KeywordIdeasTask,
  KeywordOverviewResult,
  KeywordOverviewTask,
  KeywordSuggestionsResult,
  KeywordSuggestionsTask,
  PerplexityResult,
  PerplexityTask,
  RelatedKeywordsResult,
  RelatedKeywordsTask,
} from "./dataforseo.types";

@Injectable()
export class DataForSeoService {
  constructor(
    private readonly http: HttpService,
    private readonly config: AppConfiguration,
  ) {}

  async getRelatedKeywords(
    task: RelatedKeywordsTask,
  ): Promise<DataForSeoResponse<RelatedKeywordsResult>> {
    return this.postWithRetry<RelatedKeywordsResult>(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live",
      [task],
    );
  }

  async getKeywordIdeas(
    task: KeywordIdeasTask,
  ): Promise<DataForSeoResponse<KeywordIdeasResult>> {
    return this.postWithRetry<KeywordIdeasResult>(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
      [task],
    );
  }

  async getKeywordSuggestions(
    task: KeywordSuggestionsTask,
  ): Promise<DataForSeoResponse<KeywordSuggestionsResult>> {
    return this.postWithRetry<KeywordSuggestionsResult>(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live",
      [task],
    );
  }

  async getKeywordOverview(
    task: KeywordOverviewTask,
  ): Promise<DataForSeoResponse<KeywordOverviewResult>> {
    return this.postWithRetry<KeywordOverviewResult>(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live",
      [task],
    );
  }

  async getGoogleSerpAiOverview(
    task: GoogleSerpAiOverviewTask,
  ): Promise<DataForSeoResponse<GoogleSerpResult>> {
    return this.postWithRetry<GoogleSerpResult>(
      "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
      [
        {
          ...task,
          load_async_ai_overview: task.load_async_ai_overview ?? true,
          expand_ai_overview: task.expand_ai_overview ?? true,
        },
      ],
    );
  }

  async getChatGptResponse(
    task: ChatGptLlmTask,
  ): Promise<DataForSeoResponse<ChatGptLlmResult>> {
    return this.postWithRetry<ChatGptLlmResult>(
      "https://api.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/live",
      [{ web_search: true, ...task }],
    );
  }

  async getCompetitorsDomain(
    task: CompetitorsDomainTask,
  ): Promise<DataForSeoResponse<CompetitorsDomainResult>> {
    return this.postWithRetry<CompetitorsDomainResult>(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live",
      [task],
    );
  }

  async getPerplexityResponse(
    task: PerplexityTask,
  ): Promise<DataForSeoResponse<PerplexityResult>> {
    return this.postWithRetry<PerplexityResult>(
      "https://api.dataforseo.com/v3/ai_optimization/perplexity/llm_responses/live",
      [
        {
          ...task,
          model_name: task.model_name ?? "sonar",
          max_output_tokens: task.max_output_tokens ?? 2048,
        },
      ],
    );
  }

  private async postWithRetry<T>(
    url: string,
    body: unknown[],
  ): Promise<DataForSeoResponse<T>> {
    const authHeader = `Basic ${this.config.dataForSeoBase64Credentials}`;

    const exec = async (): Promise<DataForSeoResponse<T>> => {
      try {
        const { data } = await firstValueFrom(
          this.http.post<DataForSeoResponse<T>>(url, body, {
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
          }),
        );
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
