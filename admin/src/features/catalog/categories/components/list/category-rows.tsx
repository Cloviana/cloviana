'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Anchor } from '@/components/ui/anchor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell } from '@/components/ui/table';
import {
  TreeTableLevel,
  TreeTableLoadingRows,
  TreeTableMessageRow,
  TreeTableNameCell,
  TreeTableRow,
} from '@/components/ui/tree-table';
import { paths } from '@/config/paths';

import {
  type CategoryLevel as Level,
  useCategoryLevel,
} from '../../hooks/use-category-level';
import type { Category } from '../../types';

import { CategoryRowActions } from './category-row-actions';

const CATEGORY_COLUMNS = 5;

/** The rows of one level, with a "Load more" row when there are further pages. `flat` is the search result list. */
export function CategoryRows({
  slug,
  level,
  flat = false,
}: {
  slug: string;
  level: Level;
  flat?: boolean;
}) {
  return (
    <TreeTableLevel
      hasToggles={!flat && level.items.some((category) => category.hasChildren)}
    >
      {level.items.map((category) => (
        <CategoryRow
          key={category.id}
          slug={slug}
          category={category}
          flat={flat}
        />
      ))}
      {level.hasNextPage && (
        <TreeTableMessageRow colSpan={CATEGORY_COLUMNS}>
          <Button
            variant="ghost"
            size="sm"
            loading={level.isFetchingNextPage}
            onClick={() => void level.fetchNextPage()}
          >
            Load more
          </Button>
        </TreeTableMessageRow>
      )}
    </TreeTableLevel>
  );
}

/** The children of an expanded category. They load when it opens, then come from the cache. */
function CategoryChildren({
  slug,
  parentId,
}: {
  slug: string;
  parentId: string;
}) {
  const level = useCategoryLevel(slug, { parentId });

  if (level.isPending) {
    return (
      <TreeTableLevel>
        <TreeTableLoadingRows label="Loading categories">
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell />
        </TreeTableLoadingRows>
      </TreeTableLevel>
    );
  }

  if (level.isError) {
    return (
      <TreeTableLevel>
        <TreeTableMessageRow
          colSpan={CATEGORY_COLUMNS}
          className="text-text-subtlest text-body"
        >
          <span role="alert">Could not load categories.</span>
          <Button variant="link" size="sm" onClick={() => void level.refetch()}>
            Try again
          </Button>
        </TreeTableMessageRow>
      </TreeTableLevel>
    );
  }

  return <CategoryRows slug={slug} level={level} />;
}

/** A category row plus, when open, its children. In the search result list (`flat`) the category's path shows under its name. */
function CategoryRow({
  slug,
  category,
  flat,
}: {
  slug: string;
  category: Category;
  flat: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const expandable = category.hasChildren && !flat;
  const href = paths.mp.categories.edit.getHref(slug, category.id);
  const location = category.path
    .slice(0, -1)
    .map((entry) => entry.name)
    .join(' / ');

  return (
    <>
      <TreeTableRow
        expanded={expandable ? open : undefined}
        className="cursor-pointer"
        // A mouse shortcut for the name link, which stays for keyboards, screen readers and "open in new tab".
        onClick={(event) => {
          // Clicks inside the menu or a dialog bubble up through React from elsewhere in the page; ignore those.
          if (!event.currentTarget.contains(event.target as Node)) return;
          if (
            event.target instanceof Element &&
            event.target.closest('a, button')
          )
            return;
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          if (window.getSelection()?.toString()) return;
          router.push(href);
        }}
      >
        <TreeTableNameCell
          expandable={expandable}
          expanded={open}
          onToggle={() => setOpen((current) => !current)}
          label={category.name}
        >
          <Anchor
            href={href}
            variant="hover"
            tone="primary"
            className="font-medium"
          >
            {category.name}
          </Anchor>
          {flat && location && (
            <span className="text-text-subtlest text-body-small block">
              {location}
            </span>
          )}
        </TreeTableNameCell>
        <TableCell className="text-text-subtle break-words whitespace-normal">
          {category.handle}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Badge variant={category.isActive ? 'success' : 'muted'}>
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {category.isInternal && (
              <Badge variant="information">Internal</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          {category.productCount === 0
            ? 'No products'
            : `${category.productCount} ${category.productCount === 1 ? 'product' : 'products'}`}
        </TableCell>
        <TableCell className="text-right">
          <CategoryRowActions slug={slug} category={category} />
        </TableCell>
      </TreeTableRow>
      {open && <CategoryChildren slug={slug} parentId={category.id} />}
    </>
  );
}
