'use client';

import { format, parseISO } from 'date-fns';
import {
  ChevronDownIcon,
  CircleXIcon,
  PlusIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import { type ComponentProps, type ReactNode, useRef } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  type FilterDefinition,
  type FilterOption,
  type FilterWidth,
  filterSummary,
  optionsOf,
} from '@/lib/filters';
import { cn } from '@/lib/utils';

const widths: Record<FilterWidth, string> = {
  sm: 'w-44',
  md: 'w-56',
  lg: 'w-72',
};

function FilterBar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="filter-bar"
      role="group"
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}

/** Lays out a filter's button and, when it has a selection, the button that clears it. `children` is the picker. */
function FilterChip({
  label,
  summary,
  onClear,
  children,
}: {
  label: string;
  summary?: string;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <div data-slot="filter-chip" className="group/chip relative inline-flex">
      {children}
      {summary && (
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={`Clear ${label} filter`}
          // Sits over the chevron at the chip's right edge without taking space, and shows on hover or focus.
          className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-focus-within/chip:opacity-100 group-hover/chip:opacity-100 pointer-coarse:opacity-100"
          onClick={onClear}
        >
          <XIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

/** The button every picker opens from. It ignores `children`, so any trigger can render it. */
function FilterButton({
  label,
  icon: Icon,
  summary,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children'> & {
  label: string;
  icon?: LucideIcon;
  summary?: string;
}) {
  return (
    <Button
      variant="outline"
      aria-label={summary ? `${label}: ${summary}` : undefined}
      className={className}
      {...props}
    >
      {Icon && <Icon data-icon="inline-start" aria-hidden="true" />}
      {summary ?? label}
      <ChevronDownIcon
        data-icon="inline-end"
        aria-hidden="true"
        // The clear button appears over the chevron, so it steps aside whenever that button shows.
        className={cn(
          summary &&
            'group-focus-within/chip:opacity-0 group-hover/chip:opacity-0 pointer-coarse:opacity-0',
        )}
      />
    </Button>
  );
}

type PickerProps = {
  label: string;
  icon?: LucideIcon;
  summary?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ListPickerProps = PickerProps & {
  width: FilterWidth;
  options: FilterOption[];
};

/** A short fixed list in a dropdown menu. */
function FilterMenuPicker({
  label,
  icon,
  summary,
  value,
  onValueChange,
  open,
  onOpenChange,
  width,
  multiple,
  options,
}: ListPickerProps & { multiple: boolean }) {
  return (
    <FilterChip
      label={label}
      summary={summary}
      onClear={() => onValueChange([])}
    >
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <FilterButton label={label} icon={icon} summary={summary} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={widths[width]}>
          {multiple ? (
            options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={value.includes(option.value)}
                onCheckedChange={(checked) =>
                  onValueChange(
                    checked
                      ? [...value, option.value]
                      : value.filter((entry) => entry !== option.value),
                  )
                }
                // Keep the menu open so several options can be picked.
                onSelect={(event) => event.preventDefault()}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <DropdownMenuRadioGroup
              value={value[0] ?? ''}
              onValueChange={(next) => onValueChange([next])}
            >
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </FilterChip>
  );
}

/** A longer list with a search box, where several options can be selected. */
function FilterComboboxPicker({
  label,
  icon,
  summary,
  value,
  onValueChange,
  open,
  onOpenChange,
  width,
  options,
  onSearchChange,
}: ListPickerProps & { onSearchChange?: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  // A selection can be missing from `options` (it has scrolled out of a search), but it must stay selected.
  const selected = value.map(
    (entry) =>
      options.find((option) => option.value === entry) ?? {
        value: entry,
        label: entry,
      },
  );
  return (
    <FilterChip
      label={label}
      summary={summary}
      onClear={() => onValueChange([])}
    >
      <Combobox<FilterOption, true>
        multiple
        items={options}
        value={selected}
        onValueChange={(next) =>
          onValueChange(next.map((option) => option.value))
        }
        itemToStringLabel={(option) => option.label}
        itemToStringValue={(option) => option.value}
        isItemEqualToValue={(first, second) => first.value === second.value}
        // With `onSearchChange` the options are searched on the server, so the list isn't filtered again here.
        filter={onSearchChange ? null : undefined}
        onInputValueChange={onSearchChange}
        open={open}
        onOpenChange={onOpenChange}
      >
        <ComboboxTrigger
          render={<FilterButton label={label} icon={icon} summary={summary} />}
        />
        <ComboboxContent
          initialFocus={inputRef}
          className={cn('min-w-0', widths[width])}
        >
          <ComboboxInput
            ref={inputRef}
            placeholder={`Search ${label.toLowerCase()}`}
            aria-label={`Search ${label.toLowerCase()}`}
            showTrigger={false}
          />
          <ComboboxEmpty>No results</ComboboxEmpty>
          <ComboboxList>
            {(option: FilterOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FilterChip>
  );
}

/** A date range from a calendar in a popover. The values are `[from]` or `[from, to]` as `yyyy-MM-dd`. */
function FilterDatePicker({
  label,
  icon,
  summary,
  value,
  onValueChange,
  open,
  onOpenChange,
}: PickerProps) {
  const range: DateRange | undefined = value[0]
    ? {
        from: parseISO(value[0]),
        to: value[1] ? parseISO(value[1]) : undefined,
      }
    : undefined;

  return (
    <FilterChip
      label={label}
      summary={summary}
      onClear={() => onValueChange([])}
    >
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={<FilterButton label={label} icon={icon} summary={summary} />}
        />
        <PopoverContent className="w-auto">
          <Calendar
            mode="range"
            selected={range}
            defaultMonth={range?.from}
            // The calendar reports a range as complete after the first click, so the two clicks are handled here:
            // the first starts a range and the second ends it, in either order.
            onDayClick={(day) => {
              const picked = format(day, 'yyyy-MM-dd');
              if (value.length !== 1) onValueChange([picked]);
              else
                onValueChange(
                  picked < value[0] ? [picked, value[0]] : [value[0], picked],
                );
            }}
          />
        </PopoverContent>
      </Popover>
    </FilterChip>
  );
}

/** Renders the picker a filter's `type` calls for. `options` overrides the definition's own, for lists that depend on loaded data. */
function FilterPicker({
  definition,
  options: provided,
  onSearchChange,
  value,
  onValueChange,
  open,
  onOpenChange,
}: {
  definition: FilterDefinition;
  options?: FilterOption[];
  onSearchChange?: (text: string) => void;
  value: string[];
  onValueChange: (value: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const width = definition.width ?? 'md';
  const options = provided ?? optionsOf(definition);
  const shared = {
    label: definition.label,
    icon: definition.icon,
    summary: filterSummary(definition, value, options),
    value,
    onValueChange,
    open,
    onOpenChange,
  };

  switch (definition.type) {
    case 'date':
      return <FilterDatePicker {...shared} />;
    case 'combobox':
      return (
        <FilterComboboxPicker
          {...shared}
          width={width}
          options={options}
          onSearchChange={onSearchChange}
        />
      );
    default:
      return (
        <FilterMenuPicker
          {...shared}
          width={width}
          multiple={definition.type === 'multi'}
          options={options}
        />
      );
  }
}

/** "12 results in this marketplace" with a button that clears the search and filters. Show it only while something is filtered. */
function FilterSummary({
  count,
  scope,
  onClear,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'children'> & {
  count: number;
  /** Where the results come from, such as "in this marketplace". */
  scope: string;
  onClear: () => void;
}) {
  return (
    <div
      data-slot="filter-summary"
      className={cn(
        'text-body text-text-subtle flex flex-wrap items-center gap-3 py-2',
        className,
      )}
      {...props}
    >
      <p>
        <span className="text-text-default font-medium">
          {count} {count === 1 ? 'result' : 'results'}
        </span>{' '}
        {scope}
      </p>
      <Button variant="secondary" size="sm" onClick={onClear}>
        <CircleXIcon data-icon="inline-start" aria-hidden="true" />
        Clear search and filters
      </Button>
    </div>
  );
}

/** The "+ Filters" menu. Hidden when there is nothing left to add. */
function FilterAdd({
  items,
  onAdd,
}: {
  items: { id: string; label: string; icon?: LucideIcon }[];
  onAdd: (id: string) => void;
}) {
  const added = useRef(false);
  if (!items.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        // The new filter opens its own picker, so don't return focus to this trigger.
        onCloseAutoFocus={(event) => {
          if (!added.current) return;
          added.current = false;
          event.preventDefault();
        }}
        className="w-56"
      >
        {items.map(({ id, label, icon: Icon }) => (
          <DropdownMenuItem
            key={id}
            onSelect={() => {
              added.current = true;
              onAdd(id);
            }}
          >
            {Icon && <Icon aria-hidden="true" />}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  FilterAdd,
  FilterBar,
  FilterButton,
  FilterChip,
  FilterComboboxPicker,
  FilterDatePicker,
  FilterMenuPicker,
  FilterPicker,
  FilterSummary,
};
