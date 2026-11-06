'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { CirclePlusIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from '@/components/ui/combobox';
import type { VariantAttribute } from '@/features/catalog/attributes';

import { useVariantOptionPicker } from './use-variant-option-picker';

type VariantOptionPickerProps = {
  onSelect: (option: VariantAttribute) => void;
  onCreateCustomOption: () => void;
  disabled?: boolean;
  label?: string;
  variant?: 'secondary' | 'outline' | 'ghost';
};

export function VariantOptionPicker({
  onSelect,
  onCreateCustomOption,
  disabled = false,
  label = 'Add options like size or color',
  variant = 'secondary',
}: VariantOptionPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { slug } = useParams<{ slug: string }>();
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const picker = useVariantOptionPicker(slug, disabled);
  const { more } = picker;

  useEffect(() => {
    if (!picker.open || !listElement || !more || more.loading) return;

    const loadMore = () => {
      const remaining =
        listElement.scrollHeight -
        listElement.scrollTop -
        listElement.clientHeight;
      if (remaining < 80) void more.load({ cancelRefetch: false });
    };

    loadMore();
    listElement.addEventListener('scroll', loadMore);
    return () => listElement.removeEventListener('scroll', loadMore);
  }, [picker.open, listElement, more]);

  return (
    <Combobox<VariantAttribute>
      items={picker.items}
      filter={null}
      open={picker.open}
      onOpenChange={picker.changeOpen}
      disabled={disabled}
      value={null}
      onValueChange={(option) => {
        if (!option) return;
        picker.changeOpen(false);
        onSelect(option);
      }}
      inputValue={picker.search}
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
      itemToStringLabel={(option) => option.name}
      itemToStringValue={(option) => option.id}
      isItemEqualToValue={(first, second) => first.id === second.id}
    >
      <ComboboxPrimitive.Trigger
        render={
          <Button
            type="button"
            variant={variant}
            size="sm"
            className="self-start"
          />
        }
      >
        <CirclePlusIcon aria-hidden="true" />
        {label}
      </ComboboxPrimitive.Trigger>
      <ComboboxContent
        initialFocus={inputRef}
        className="flex w-80 min-w-0 flex-col"
      >
        <ComboboxInput
          ref={inputRef}
          aria-label="Search variant options"
          placeholder="Search"
          showTrigger={false}
          maxLength={100}
        />
        <ComboboxList
          ref={setListElement}
          key={picker.search.trim().toLowerCase()}
          className="min-h-0"
          aria-label="Variant options"
          aria-busy={picker.isBusy}
        >
          {(option: VariantAttribute) => (
            <ComboboxItem key={option.id} value={option}>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.name}</span>
                <span className="text-text-subtlest text-body-small block truncate">
                  {option.values.map((value) => value.name).join(', ')}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
        {picker.emptyMessage && (
          <ComboboxEmpty>{picker.emptyMessage}</ComboboxEmpty>
        )}
        {picker.status && <ComboboxStatus {...picker.status} />}
        <div className="border-border-default border-t-line shrink-0 p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              picker.changeOpen(false);
              onCreateCustomOption();
            }}
          >
            <CirclePlusIcon aria-hidden="true" />
            Create custom option
          </Button>
        </div>
      </ComboboxContent>
    </Combobox>
  );
}
