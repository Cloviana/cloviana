import type {
  ContentsOptions,
  DeepSearchOutput,
  RegularSearchOptions,
  SearchResponse,
} from "exa-js";

export type {
  ContentsOptions,
  DeepOutputSchema,
  DeepSearchOutput,
  RegularSearchOptions,
  SearchResponse,
  SearchResult,
} from "exa-js";

export type ExaSearchOptions<
  TContents extends ContentsOptions = ContentsOptions,
> = RegularSearchOptions & {
  contents?: TContents;
};

export type ExaSearchOutput<TOutput> = Omit<DeepSearchOutput, "content"> & {
  content: TOutput;
};

export type ExaSearchResponse<
  TContents extends ContentsOptions = ContentsOptions,
  TOutput = string | Record<string, unknown>,
> = Omit<SearchResponse<TContents>, "output"> & {
  output?: ExaSearchOutput<TOutput>;
};

export type ExaContentsResult<TSummary = unknown> = {
  title?: string;
  url: string;
  id: string;
  publishedDate?: string | null;
  author?: string | null;
  image?: string;
  favicon?: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: TSummary;
  subpages?: ExaContentsResult<TSummary>[];
  extras?: {
    links?: string[];
    imageLinks?: string[];
  };
};

export type ExaContentsStatus = {
  id: string;
  status: "success" | "error";
  error?: {
    tag: string;
    httpStatusCode?: number | null;
  };
};

export type ExaGetContentsResponse<TSummary = unknown> = {
  requestId: string;
  results: ExaContentsResult<TSummary>[];
  statuses: ExaContentsStatus[];
  costDollars?: {
    total?: number;
  };
};
