'use client';

import { useEffect, useRef, useState, type Ref } from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

import { useSellerPicker } from '../hooks/use-seller-picker';
import type { Seller } from '../types/seller';

type SellerPickerProps = {
  id: string;
  ref?: Ref<HTMLButtonElement>;
  onBlur?: () => void;
  'aria-describedby'?: string;
  slug: string;
  value: Seller | null;
  onChange: (seller: Seller) => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  popupClassName?: string;
};

export function SellerPicker({
  slug,
  value,
  onChange,
  popupClassName,
  ...triggerProps
}: SellerPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const picker = useSellerPicker(slug, triggerProps.disabled ?? false);
  const { more } = picker;

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
    <Combobox<Seller>
      items={picker.items}
      value={value}
      filter={null}
      disabled={triggerProps.disabled}
      open={picker.open}
      onOpenChange={picker.changeOpen}
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
      itemToStringLabel={(seller) => seller.name}
      itemToStringValue={(seller) => seller.id}
      isItemEqualToValue={(first, second) => first.id === second.id}
      onValueChange={(seller) => {
        if (!seller) return;
        onChange(seller);
        picker.changeOpen(false);
      }}
    >
      <ComboboxTrigger {...triggerProps}>
        <ComboboxValue placeholder="Choose a store" />
      </ComboboxTrigger>
      <ComboboxContent
        className={cn('min-w-0', popupClassName)}
        initialFocus={inputRef}
      >
        <ComboboxInput
          ref={inputRef}
          id={`${triggerProps.id}-search`}
          aria-label="Search stores"
          placeholder="Search stores"
          showTrigger={false}
          maxLength={100}
        />
        <ComboboxList
          ref={setListElement}
          key={picker.search.trim().toLowerCase()}
          aria-label="Stores"
          aria-busy={picker.isBusy}
        >
          {(seller: Seller) => (
            <ComboboxItem key={seller.id} value={seller}>
              <span className="min-w-0 truncate">{seller.name}</span>
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
