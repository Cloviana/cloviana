'use client';

import { useState } from 'react';

import { FilterAdd, FilterBar, FilterPicker } from '@/components/ui/filter-bar';
import { useFilters } from '@/hooks/use-filters';

import { useStores } from '../../hooks/use-stores';
import { storeFilters } from '../../lib/store-filters';

import { StoresSearch } from './stores-search';

export function StoresFilters({ slug }: { slug: string }) {
  const { values, setValues, isFiltered } = useFilters(storeFilters);
  const { data } = useStores(slug);
  const [openId, setOpenId] = useState<string | null>(null);

  // A filter that was just added stays on screen while its picker is open, even before it has a value.
  const shown = storeFilters.filter(
    ({ id, pinned }) => pinned || values[id] || id === openId,
  );
  const addable = storeFilters.filter(
    ({ id, pinned }) => !pinned && !values[id] && id !== openId,
  );

  // Nothing to search or filter until the marketplace has a store.
  if (!isFiltered && data?.total === 0) return null;

  return (
    <FilterBar aria-label="Search and filters">
      <StoresSearch />
      {shown.map((definition) => (
        <FilterPicker
          key={definition.id}
          definition={definition}
          value={values[definition.id] ?? []}
          onValueChange={(next) => setValues(definition.id, next)}
          open={openId === definition.id}
          onOpenChange={(open) => setOpenId(open ? definition.id : null)}
        />
      ))}
      {addable.length > 0 && <FilterAdd items={addable} onAdd={setOpenId} />}
    </FilterBar>
  );
}
