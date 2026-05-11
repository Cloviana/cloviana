import { AppConfiguration } from "@/config/app.configuration";
import { Injectable } from "@nestjs/common";
import Exa from "exa-js";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";
import type {
  ContentsOptions,
  ExaGetContentsResponse,
  ExaSearchOptions,
  ExaSearchResponse,
  RegularSearchOptions,
  SearchResponse,
} from "./exa.types";

type RetryOptions = {
  retries: number;
  minTimeout: number;
  maxTimeout: number;
};

const STANDARD_RETRY: RetryOptions = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 10000,
};

@Injectable()
export class ExaService {
  private readonly exa: Exa;
  private readonly limit = pLimit(4);

  constructor(private readonly config: AppConfiguration) {
    this.exa = new Exa(this.config.exaApiKey);
  }

  async search<
    TContents extends ContentsOptions = ContentsOptions,
    TOutput = string | Record<string, unknown>,
  >(
    query: string,
    options: ExaSearchOptions<TContents> = {} as ExaSearchOptions<TContents>,
  ): Promise<ExaSearchResponse<TContents, TOutput>> {
    return this.limit(() =>
      this.withRetry(async () => {
        try {
          const search = this.exa.search as (
            query: string,
            options: RegularSearchOptions,
          ) => Promise<SearchResponse<TContents>>;

          return (await search.call(
            this.exa,
            query,
            options,
          )) as ExaSearchResponse<TContents, TOutput>;
        } catch (err) {
          this.throwIfExaErrorIsNotRetryable(err);
          throw err;
        }
      }, STANDARD_RETRY),
    );
  }

  async getContents<TSummary = unknown>(
    urls: string[],
    options: ContentsOptions,
  ): Promise<ExaGetContentsResponse<TSummary>> {
    return this.limit(() =>
      this.withRetry(async () => {
        try {
          const getContents = this.exa.getContents as (
            urls: string[],
            options: ContentsOptions,
          ) => Promise<ExaGetContentsResponse<TSummary>>;

          return await getContents.call(this.exa, urls, options);
        } catch (err) {
          this.throwIfExaErrorIsNotRetryable(err);
          throw err;
        }
      }, STANDARD_RETRY),
    );
  }

  private withRetry<T>(fn: () => Promise<T>, retry: RetryOptions): Promise<T> {
    return pRetry(fn, {
      ...retry,
      factor: 2,
      randomize: true,
    });
  }

  private throwIfExaErrorIsNotRetryable(err: unknown): void {
    const status =
      typeof err === "object" && err !== null
        ? ((err as { status?: number; response?: { status?: number } })
            .status ??
          (err as { status?: number; response?: { status?: number } }).response
            ?.status)
        : undefined;

    if (status && status >= 400 && status < 500 && status !== 429) {
      throw new AbortError(err instanceof Error ? err : String(err));
    }
  }
}
