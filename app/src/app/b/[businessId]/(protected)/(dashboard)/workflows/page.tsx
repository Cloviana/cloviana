'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  FilterSidebar,
  type FilterValue,
} from '@/components/ui/filter-sidebar';
import { WorkflowsFilterRow } from '@/features/workflows/components/workflows-filter-row';
import { WorkflowsTable } from '@/features/workflows/components/workflows-table';
import { WORKFLOW_FILTER_FIELDS } from '@/features/workflows/filters';
import { mockWorkflowSummaries } from '@/mocks/data/workflows';

export default function WorkflowsPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = useMemo<FilterValue<string>[]>(
    () =>
      WORKFLOW_FILTER_FIELDS.flatMap((field) => {
        const allowedValues = new Set(
          field.options.map((option) => option.value),
        );
        const values = Array.from(
          new Set(
            (searchParams.get(field.key)?.split(',') ?? []).filter((value) =>
              allowedValues.has(value),
            ),
          ),
        );

        return values.length > 0 ? [{ field: field.key, values }] : [];
      }),
    [searchParams],
  );

  const handleFiltersChange = (nextFilters: FilterValue<string>[]) => {
    const params = new URLSearchParams(window.location.search);

    WORKFLOW_FILTER_FIELDS.forEach((field) => params.delete(field.key));
    nextFilters.forEach((filter) => {
      if (filter.values.length > 0) {
        params.set(filter.field, filter.values.join(','));
      }
    });
    params.delete('page');
    const query = params.toString();

    window.history.replaceState(
      null,
      '',
      query ? `${pathname}?${query}` : pathname,
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkflowsFilterRow
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {filtersOpen && (
          <FilterSidebar
            fields={WORKFLOW_FILTER_FIELDS}
            filters={filters}
            onChange={handleFiltersChange}
          />
        )}
        <WorkflowsTable workflows={mockWorkflowSummaries} filters={filters} />
      </div>
    </div>
  );
}
