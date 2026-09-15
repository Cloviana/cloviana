'use client';

import { ChevronDown } from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';

const EMPTY_SELECT_VALUE = '__all__';

export type FilterFieldType = 'select' | 'multiselect' | 'combobox';

export type FilterOption<T extends string = string> = {
  value: T;
  label: string;
};

export type FilterFieldConfig<T extends string = string> = {
  key: string;
  label: string;
  type: FilterFieldType;
  options: FilterOption<T>[];
  icon?: ComponentType<{ className?: string }>;
  placeholder?: string;
};

export type FilterValue<T extends string = string> = {
  field: string;
  values: T[];
};

type FilterSidebarFieldProps<T extends string> = {
  field: FilterFieldConfig<T>;
  values: T[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValuesChange: (values: T[]) => void;
};

function FilterSidebarField<T extends string>({
  field,
  values,
  open,
  onOpenChange,
  onValuesChange,
}: FilterSidebarFieldProps<T>) {
  const selectedOption = field.options.find(
    (option) => option.value === values[0],
  );
  const Icon = field.icon;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="border-b">
      <CollapsibleTrigger className="hover:bg-accent flex min-h-12 w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-medium">
        {Icon && <Icon className="text-foreground-light size-4" />}
        <span className="min-w-0 flex-1 truncate">{field.label}</span>
        <ChevronDown
          className={cn(
            'text-foreground-lighter size-4 transition-transform',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="p-3.5">
        {field.type === 'multiselect' && (
          <div className="space-y-0.5">
            {field.options.map((option) => {
              const checked = values.includes(option.value);

              return (
                <label
                  key={option.value}
                  className="hover:bg-accent -mx-2 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) =>
                      onValuesChange(
                        nextChecked === true
                          ? [...values, option.value]
                          : values.filter((value) => value !== option.value),
                      )
                    }
                    aria-label={`Filter by ${option.label}`}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {field.type === 'select' && (
          <Select
            value={values[0] ?? EMPTY_SELECT_VALUE}
            onValueChange={(value) =>
              onValuesChange(value === EMPTY_SELECT_VALUE ? [] : [value as T])
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder={field.placeholder ?? 'Any'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_SELECT_VALUE}>Any</SelectItem>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'combobox' && (
          <Combobox
            items={field.options}
            value={selectedOption ?? null}
            onValueChange={(option: FilterOption<T> | null) =>
              onValuesChange(option ? [option.value] : [])
            }
            itemToStringLabel={(option: FilterOption<T>) => option.label}
            isItemEqualToValue={(
              option: FilterOption<T>,
              value: FilterOption<T>,
            ) => option.value === value.value}
          >
            <ComboboxInput
              placeholder={field.placeholder ?? `Select ${field.label}`}
              showClear
            />
            <ComboboxContent>
              <ComboboxEmpty>No options found.</ComboboxEmpty>
              <ComboboxList>
                {(option: FilterOption<T>) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

type FilterSidebarProps<T extends string> = {
  fields: FilterFieldConfig<T>[];
  filters: FilterValue<T>[];
  onChange: (filters: FilterValue<T>[]) => void;
  className?: string;
};

export function FilterSidebar<T extends string>({
  fields,
  filters,
  onChange,
  className,
}: FilterSidebarProps<T>) {
  const [openField, setOpenField] = useState<string | null>(null);

  const updateField = (field: string, values: T[]) => {
    const nextFilters = filters.filter((filter) => filter.field !== field);

    if (values.length > 0) {
      nextFilters.push({ field, values });
    }

    onChange(nextFilters);
  };

  return (
    <aside
      aria-label="Filters"
      className={cn(
        'bg-surface flex w-72 shrink-0 flex-col overflow-y-auto border-t border-r',
        className,
      )}
    >
      {fields.map((field) => (
        <FilterSidebarField
          key={field.key}
          field={field}
          open={openField === field.key}
          onOpenChange={(open) => setOpenField(open ? field.key : null)}
          values={
            filters.find((filter) => filter.field === field.key)?.values ?? []
          }
          onValuesChange={(values) => updateField(field.key, values)}
        />
      ))}
    </aside>
  );
}
