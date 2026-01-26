import { AppConfiguration } from "@/config/app.configuration";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import pRetry, { AbortError } from "p-retry";
import { firstValueFrom } from "rxjs";
import {
  DataForSeoResponse,
  KeywordIdeasResult,
  KeywordIdeasTask,
  KeywordOverviewResult,
  KeywordOverviewTask,
  KeywordSuggestionsResult,
  KeywordSuggestionsTask,
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
    const url =
      "https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live";

    const authHeader = `Basic ${this.config.dataForSeoBase64Credentials}`;

    const exec = async (): Promise<
      DataForSeoResponse<RelatedKeywordsResult>
    > => {
      try {
        const { data } = await firstValueFrom(
          this.http.post<DataForSeoResponse<RelatedKeywordsResult>>(
            url,
            [task],
            {
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
            },
          ),
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

  async getKeywordIdeas(
    task: KeywordIdeasTask,
  ): Promise<DataForSeoResponse<KeywordIdeasResult>> {
    const url =
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live";

    const authHeader = `Basic ${this.config.dataForSeoBase64Credentials}`;

    const exec = async (): Promise<DataForSeoResponse<KeywordIdeasResult>> => {
      try {
        const { data } = await firstValueFrom(
          this.http.post<DataForSeoResponse<KeywordIdeasResult>>(url, [task], {
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

  async getKeywordSuggestions(
    task: KeywordSuggestionsTask,
  ): Promise<DataForSeoResponse<KeywordSuggestionsResult>> {
    const url =
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live";

    const authHeader = `Basic ${this.config.dataForSeoBase64Credentials}`;

    const exec = async (): Promise<
      DataForSeoResponse<KeywordSuggestionsResult>
    > => {
      try {
        const { data } = await firstValueFrom(
          this.http.post<DataForSeoResponse<KeywordSuggestionsResult>>(
            url,
            [task],
            {
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
            },
          ),
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

  async getKeywordOverview(
    task: KeywordOverviewTask,
  ): Promise<DataForSeoResponse<KeywordOverviewResult>> {
    const url =
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live";

    const authHeader = `Basic ${this.config.dataForSeoBase64Credentials}`;

    const exec = async (): Promise<
      DataForSeoResponse<KeywordOverviewResult>
    > => {
      try {
        const { data } = await firstValueFrom(
          this.http.post<DataForSeoResponse<KeywordOverviewResult>>(
            url,
            [task],
            {
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
            },
          ),
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
