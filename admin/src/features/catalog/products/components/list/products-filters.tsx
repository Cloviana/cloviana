'use client';

import { useState } from 'react';

import { FilterAdd, FilterBar, FilterPicker } from '@/components/ui/filter-bar';
import { useFilters } from '@/hooks/use-filters';

import { useCategoryFilterOptions } from '../../hooks/use-category-filter-options';
import { useProducts } from '../../hooks/use-products';
import { productFilters } from '../../lib/product-filters';

import { ProductsSearch } from './products-search';

export function ProductsFilters({ slug }: { slug: string }) {
  const { values, setValues, isFiltered } = useFilters(productFilters);
  const { data } = useProducts(slug);
  const category = useCategoryFilterOptions(slug, values.category ?? []);
  const [openId, setOpenId] = useState<string | null>(null);

  // Filters whose options come from the server, by filter id.
  const dynamic = {
    category: { options: category.options, onSearchChange: category.setSearch },
  };

  // A filter that was just added stays on screen while its picker is open, even before it has a value.
  const shown = productFilters.filter(
    ({ id, pinned }) => pinned || values[id] || id === openId,
  );
  const addable = productFilters.filter(
    ({ id, pinned }) => !pinned && !values[id] && id !== openId,
  );

  // Nothing to search or filter until the marketplace has a product.
  if (!isFiltered && data?.total === 0) return null;

  return (
    <FilterBar aria-label="Search and filters">
      <ProductsSearch />
      {shown.map((definition) => (
        <FilterPicker
          key={definition.id}
          definition={definition}
          {...dynamic[definition.id as keyof typeof dynamic]}
          value={values[definition.id] ?? []}
          onValueChange={(next) => setValues(definition.id, next)}
          open={openId === definition.id}
          onOpenChange={(open) => setOpenId(open ? definition.id : null)}
        />
      ))}
      <FilterAdd items={addable} onAdd={setOpenId} />
    </FilterBar>
  );
}
