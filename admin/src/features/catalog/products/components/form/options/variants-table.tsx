'use client';

import {
  createColumnHelper,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import {
  row_getCanSelect,
  row_getCanSelectSubRows,
  row_getIsAllSubRowsSelected,
  row_getIsSelected,
  row_getIsSomeSelected,
  row_toggleSelected,
  table_toggleAllRowsSelected,
} from '@tanstack/react-table/static-functions';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getDraftVariants,
  type DraftVariant,
} from '../../../lib/draft-variants';
import type { ProductFormValues } from '../use-product-form';

type VariantFields = { title: string; sku: string };
export type VariantEdits = Record<string, Partial<VariantFields>>;
type VariantRow = DraftVariant & VariantFields;

const features = tableFeatures({
  rowSelectionFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const columnHelper = createColumnHelper<typeof features, VariantRow>();

export function VariantsTable({
  edits,
  setEdits,
}: {
  edits: VariantEdits;
  setEdits: Dispatch<SetStateAction<VariantEdits>>;
}) {
  const rowsPerPageId = useId();
  const variantsHelpId = useId();
  const { control } = useFormContext<ProductFormValues>();
  const options = useWatch({ control, name: 'options' });

  const updateField = useCallback(
    (key: string, field: keyof VariantFields, value: string) => {
      setEdits((current) => ({
        ...current,
        [key]: { ...current[key], [field]: value },
      }));
    },
    [setEdits],
  );

  const data = useMemo(() => {
    if (!options?.length) return [];
    return getDraftVariants(options).map((variant) => ({
      ...variant,
      title: edits[variant.key]?.title ?? variant.name,
      sku: edits[variant.key]?.sku ?? '',
    }));
  }, [options, edits]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: 'select',
          header: ({ table }) => {
            const rows = table
              .getCoreRowModel()
              .flatRows.filter((row) => row_getCanSelect(row));
            const selectedCount = rows.filter((row) =>
              row_getIsSelected(row),
            ).length;

            return (
              <Checkbox
                aria-label="Select all variants across all pages"
                checked={rows.length > 0 && selectedCount === rows.length}
                indeterminate={selectedCount > 0 && selectedCount < rows.length}
                onCheckedChange={(checked) =>
                  table_toggleAllRowsSelected(table, checked)
                }
              />
            );
          },
          cell: ({ row }) => {
            const selectsChildren =
              row.subRows.length > 0 && row_getCanSelectSubRows(row);
            const checked = selectsChildren
              ? row_getIsAllSubRowsSelected(row)
              : row_getIsSelected(row);

            return (
              <Checkbox
                aria-label={`Select ${row.original.name}`}
                checked={checked}
                indeterminate={
                  !checked && selectsChildren && row_getIsSomeSelected(row)
                }
                disabled={!row_getCanSelect(row) && !selectsChildren}
                onCheckedChange={(value) => row_toggleSelected(row, value)}
              />
            );
          },
        }),
        columnHelper.accessor('name', {
          header: 'Variant',
          cell: ({ getValue }) => (
            <span className="font-medium">{getValue()}</span>
          ),
        }),
        columnHelper.accessor('title', {
          header: 'Title',
          cell: ({ row, getValue }) => (
            <Input
              aria-label={`Title for ${row.original.name}`}
              aria-describedby={variantsHelpId}
              value={getValue()}
              maxLength={255}
              onChange={(event) =>
                updateField(row.original.key, 'title', event.target.value)
              }
            />
          ),
        }),
        columnHelper.accessor('sku', {
          header: 'SKU',
          cell: ({ row, getValue }) => (
            <Input
              aria-label={`SKU for ${row.original.name}`}
              aria-describedby={variantsHelpId}
              value={getValue()}
              maxLength={255}
              onChange={(event) =>
                updateField(
                  row.original.key,
                  'sku',
                  event.target.value.toUpperCase(),
                )
              }
            />
          ),
        }),
      ]),
    [updateField, variantsHelpId],
  );

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.key,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    autoResetPageIndex: false,
  });

  useEffect(() => {
    const lastPage = Math.max(0, table.getPageCount() - 1);
    if (table.state.pagination.pageIndex > lastPage)
      table.setPageIndex(lastPage);
  }, [table, data.length]);

  if (data.length === 0) return null;

  const { pageIndex, pageSize } = table.state.pagination;
  const firstRow = pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, data.length);

  return (
    <div className="space-y-3">
      <FieldDescription id={variantsHelpId}>
        Titles default to the option values. Add an optional SKU (stock keeping
        unit) to identify each variant.
      </FieldDescription>
      <Table aria-label="Product variants" className="min-w-140 table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.column.id === 'select' ? 'w-16 pl-4' : 'px-4'
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? 'selected' : undefined}
            >
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="px-4 py-3 break-words whitespace-normal"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Field orientation="horizontal" className="w-fit">
          <FieldLabel htmlFor={rowsPerPageId} className="text-body font-normal">
            Rows per page
          </FieldLabel>
          <Select
            value={String(table.state.pagination.pageSize)}
            onValueChange={(value) => {
              if (value !== null) table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger id={rowsPerPageId} className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-body text-text-subtle" aria-live="polite">
            {firstRow}–{lastRow} of {data.length} variants
          </span>
          <Pagination aria-label="Variant pagination" className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  size="icon"
                  text=""
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                />
              </PaginationItem>
              <PaginationItem>
                <span
                  className="text-body text-text-subtle px-2"
                  aria-live="polite"
                >
                  Page {pageIndex + 1} of {table.getPageCount()}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  size="icon"
                  text=""
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
