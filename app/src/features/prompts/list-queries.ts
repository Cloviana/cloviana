import { isAiEngine, isPromptBranding, isPromptStage } from './options';
import type {
  AiEngine,
  PromptBranding,
  PromptListFilters,
  PromptResponseListFilters,
  PromptStage,
  PromptStatusFilter,
} from './types';

/**
 * The URL is the source of truth for both lists, so the table and its pagination
 * derive their query from the same parser and can never disagree about what is
 * on screen. Unknown values are dropped rather than sent to the API.
 */

type SearchParamsReader = {
  get(name: string): string | null;
};

export type PromptListQuery = PromptListFilters & {
  page: number;
  limit: number;
};

export type PromptResponseListQuery = PromptResponseListFilters & {
  page: number;
  limit: number;
};

const PAGE_SIZE = 25;

const isStatusFilter = (value: string): value is PromptStatusFilter =>
  value === 'active' || value === 'all' || value === 'inactive';

const isNonEmpty = (value: string): value is string => value.length > 0;

function parsePage(value: string | null) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseList<T extends string>(
  value: string | null,
  isAllowed: (item: string) => item is T,
): T[] | undefined {
  const values = Array.from(
    new Set(
      (value?.split(',') ?? []).map((item) => item.trim()).filter(isAllowed),
    ),
  );

  return values.length ? values : undefined;
}

export function getPromptListQuery(
  searchParams: SearchParamsReader,
): PromptListQuery {
  const statusParam = searchParams.get('status');
  const q = searchParams.get('q')?.trim();

  return {
    page: parsePage(searchParams.get('page')),
    limit: PAGE_SIZE,
    status: statusParam && isStatusFilter(statusParam) ? statusParam : 'all',
    ...(q ? { q } : {}),
    topicIds: parseList(searchParams.get('topicIds'), isNonEmpty),
    tagIds: parseList(searchParams.get('tagIds'), isNonEmpty),
    branding: parseList<PromptBranding>(
      searchParams.get('branding'),
      isPromptBranding,
    ),
    stages: parseList<PromptStage>(searchParams.get('stages'), isPromptStage),
  };
}

export function getPromptResponseListQuery(
  searchParams: SearchParamsReader,
): PromptResponseListQuery {
  const webSearch = searchParams.get('webSearch');

  return {
    page: parsePage(searchParams.get('page')),
    limit: PAGE_SIZE,
    engines: parseList<AiEngine>(searchParams.get('engines'), isAiEngine),
    promptIds: parseList(searchParams.get('promptIds'), isNonEmpty),
    topicIds: parseList(searchParams.get('topicIds'), isNonEmpty),
    tagIds: parseList(searchParams.get('tagIds'), isNonEmpty),
    ...(webSearch === 'true' || webSearch === 'false'
      ? { webSearch: webSearch === 'true' }
      : {}),
  };
}
