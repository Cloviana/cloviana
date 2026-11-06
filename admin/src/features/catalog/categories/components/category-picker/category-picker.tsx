'use client';

import { ChevronRightIcon } from 'lucide-react';
import { useEffect, useRef, useState, type Ref } from 'react';

import {
  Combobox,
  ComboboxBack,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox';

import type { Category } from '../../types';

import { useCategoryPicker } from './use-category-picker';

type CategoryPickerProps = {
  slug: string;
  id: string;
  value: string | null;
  onChange: (id: string | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Also offer inactive and internal categories. */
  includeHidden?: boolean;
  ref?: Ref<HTMLButtonElement>;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

export function CategoryPicker({
  slug,
  value,
  onChange,
  onBlur,
  placeholder = 'Choose a product category',
  includeHidden,
  ...triggerProps
}: CategoryPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const picker = useCategoryPicker({
    slug,
    value,
    onChange,
    onBlur,
    includeHidden,
  });
  const { back, more } = picker;

  useEffect(() => {
    if (!picker.open || !listElement || !more || more.loading) return;

    const loadMore = () => {
      const remaining =
        listElement.scrollHeight -
        listElement.scrollTop -
        listElement.clientHeight;
      if (remaining < 80) {
        void more.load({ cancelRefetch: false });
      }
    };

    loadMore();
    listElement.addEventListener('scroll', loadMore);
    return () => listElement.removeEventListener('scroll', loadMore);
  }, [picker.open, listElement, more]);

  return (
    <Combobox<Category>
      value={picker.selected}
      items={picker.items}
      filter={null}
      itemToStringLabel={(category) => category.name}
      itemToStringValue={(category) => category.id}
      isItemEqualToValue={(first, second) => first.id === second.id}
      open={picker.open}
      disabled={triggerProps.disabled}
      inputValue={picker.search}
      onOpenChange={picker.changeOpen}
      onInputValueChange={(search, details) => {
        if (
          details.reason === 'input-change' ||
          details.reason === 'input-clear'
        ) {
          picker.setSearch(search);
        } else {
          details.cancel();
        }
      }}
      onValueChange={(category, details) => {
        if (category && !picker.choose(category)) {
          details.cancel();
          inputRef.current?.focus();
        }
      }}
    >
      <ComboboxTrigger {...triggerProps}>
        <ComboboxValue placeholder={placeholder} />
      </ComboboxTrigger>
      <ComboboxContent className="min-w-0" initialFocus={inputRef}>
        <ComboboxInput
          ref={inputRef}
          id={`${triggerProps.id}-search`}
          aria-label="Search categories"
          placeholder="Search categories"
          maxLength={100}
          showTrigger={false}
        />
        {back && (
          <ComboboxBack
            disabled={back.disabled}
            onClick={() => {
              back.go();
              inputRef.current?.focus();
            }}
          >
            Back to {back.label}
          </ComboboxBack>
        )}
        <ComboboxList
          ref={setListElement}
          key={`${picker.current?.id ?? 'all'}:${picker.search.trim().toLowerCase()}`}
          aria-label={
            picker.isSearching
              ? 'Category search results'
              : (picker.current?.name ?? 'Categories')
          }
          aria-busy={picker.isBusy}
        >
          {(category: Category) => (
            <ComboboxItem
              key={category.id}
              value={category}
              showIndicator={
                category.id === value && !picker.canBrowse(category)
              }
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{category.name}</span>
                {picker.isSearching && category.path.length > 1 && (
                  <span className="text-text-subtlest text-body-small block truncate">
                    {category.path
                      .slice(0, -1)
                      .map((entry) => entry.name)
                      .join(' / ')}
                  </span>
                )}
              </span>
              {picker.canBrowse(category) && (
                <ChevronRightIcon aria-hidden="true" />
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
        {picker.emptyMessage && (
          <ComboboxEmpty>{picker.emptyMessage}</ComboboxEmpty>
        )}
        {picker.status && <ComboboxStatus {...picker.status} />}
      </ComboboxContent>
    </Combobox>
  );
}
