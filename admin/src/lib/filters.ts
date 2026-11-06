import { format, parseISO } from 'date-fns';
import type { LucideIcon } from 'lucide-react';

export type FilterOption = { value: string; label: string };

/** How wide a filter's list is. A date filter ignores it, since the calendar sets its own width. */
export type FilterWidth = 'sm' | 'md' | 'lg';

type FilterBase = {
  /** Also the URL parameter name. */
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Pinned filters are always shown; the others are added from the "+ Filters" menu. */
  pinned?: boolean;
  /** Defaults to `md`. */
  width?: FilterWidth;
};

/**
 * What picker a filter uses:
 * - `multi` / `single`: a short fixed list in a menu, where `single` holds at most one option.
 * - `combobox`: a longer list with a search box; several options can be selected. Its options are supplied
 *   when rendering, since they come from the server, so any value in the URL is accepted.
 * - `date`: a date range from a calendar. The values are `[from]` or `[from, to]` as `yyyy-MM-dd`.
 *
 * A definition only describes the filter. The server does the matching.
 */
export type FilterDefinition = FilterBase &
  (
    | { type: 'multi' | 'single'; options: FilterOption[] }
    | { type: 'combobox' }
    | { type: 'date' }
  );

/** Selected values by filter id. A filter with nothing selected has no entry. */
export type FilterValues = Record<string, string[]>;

export const SEARCH_PARAM = 'q';
export const PAGE_PARAM = 'page';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function optionsOf(definition: FilterDefinition): FilterOption[] {
  return definition.type === 'multi' || definition.type === 'single'
    ? definition.options
    : [];
}

export function readFilters(
  definitions: FilterDefinition[],
  params: Pick<URLSearchParams, 'getAll'>,
): FilterValues {
  const values: FilterValues = {};
  for (const definition of definitions) {
    const raw = params.getAll(definition.id);
    let selected: string[];
    if (definition.type === 'date')
      selected = raw.filter((value) => ISO_DATE.test(value)).slice(0, 2);
    else if (definition.type === 'combobox') selected = raw;
    else
      selected = raw.filter((value) =>
        definition.options.some((option) => option.value === value),
      );
    if (selected.length)
      values[definition.id] =
        definition.type === 'single' ? selected.slice(0, 1) : selected;
  }
  return values;
}

/** The search text, filter selections and page number held in the URL. */
export function readFilterState(
  definitions: FilterDefinition[],
  params: Pick<URLSearchParams, 'get' | 'getAll'>,
) {
  return {
    query: params.get(SEARCH_PARAM) ?? '',
    page: Math.max(1, Math.floor(Number(params.get(PAGE_PARAM))) || 1),
    values: readFilters(definitions, params),
  };
}

/** "Active", "Active and 1 more", or a date range. Undefined when nothing is selected. `options` overrides the definition's own. */
export function filterSummary(
  definition: FilterDefinition,
  values: string[] = [],
  options: FilterOption[] = optionsOf(definition),
): string | undefined {
  if (!values.length) return undefined;

  if (definition.type === 'date') {
    const [from, to] = values.map((value) => format(parseISO(value), 'MMM d'));
    return to && to !== from ? `${from} – ${to}` : from;
  }

  const labels = options
    .filter(({ value }) => values.includes(value))
    .map(({ label }) => label);
  if (!labels.length) return `${values.length} selected`;
  return values.length === 1
    ? labels[0]
    : `${labels[0]} and ${values.length - 1} more`;
}
