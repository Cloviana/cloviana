'use client';

import { Button } from '@/components/ui/button';
import { TableBody } from '@/components/ui/table';
import { TreeTable } from '@/components/ui/tree-table';
import { useFilters } from '@/hooks/use-filters';
import { cn } from '@/lib/utils';

import { useCategoryLevel } from '../../hooks/use-category-level';
import { categoryFilters } from '../../lib/category-filters';

import { CategoriesEmptyState } from './categories-empty-state';
import { CategoriesNoResults } from './categories-no-results';
import { CategoriesTableHeader } from './categories-table-header';
import { CategoriesTableSkeleton } from './categories-table-skeleton';
import { CategoryRows } from './category-rows';

// The categories API only searches with at least this many characters.
const MIN_SEARCH_LENGTH = 2;

export function CategoriesTable({ slug }: { slug: string }) {
  const { query, clear } = useFilters(categoryFilters);
  const term = query.trim();
  const searching = term.length >= MIN_SEARCH_LENGTH;
  const level = useCategoryLevel(slug, {
    search: searching ? term : undefined,
  });

  if (level.isPending) return <CategoriesTableSkeleton />;

  if (level.isError && level.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p role="alert" className="text-text-subtlest text-body">
          Could not load categories.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void level.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (level.items.length === 0) {
    return searching ? (
      <CategoriesNoResults onClear={clear} />
    ) : (
      <CategoriesEmptyState />
    );
  }

  return (
    // While a search loads, the rows stay on screen, dimmed.
    <div
      aria-busy={level.isPlaceholderData}
      className={cn(
        'min-w-0',
        level.isPlaceholderData && 'opacity-(--ds-opacity-loading)',
      )}
    >
      <TreeTable aria-label="Categories">
        <CategoriesTableHeader />
        <TableBody>
          <CategoryRows slug={slug} level={level} flat={searching} />
        </TableBody>
      </TreeTable>
    </div>
  );
}
