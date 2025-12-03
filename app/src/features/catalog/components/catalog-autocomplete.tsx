'use client';

import { Check, Loader2, Package, Layers, X } from 'lucide-react';
import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearchCatalog } from '@/features/catalog/api/search-catalog';

export type CatalogSelection = {
  type: 'PRODUCT' | 'COLLECTION';
  id: string;
  title: string;
  imageUrl?: string | null;
};

interface CatalogAutocompleteProps {
  storeId: string;
  value?: CatalogSelection[];
  onSelect: (selection: CatalogSelection[]) => void;
}

export function CatalogAutocomplete({
  storeId,
  value = [],
  onSelect,
}: CatalogAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectionIds = React.useMemo(
    () => new Set(value.map((item) => item.id)),
    [value],
  );

  const { data, isLoading, isFetching } = useSearchCatalog({
    storeId,
    params: {
      q: debouncedQuery,
      limit: 25,
    },
  });

  const loading = isLoading || isFetching;

  const collections = data?.collections ?? [];
  const products = data?.products ?? [];
  const totalResults = collections.length + products.length;

  const hasResults = totalResults > 0;
  const isMaxedOut = totalResults >= 25;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setQuery(val);
    setOpen(val.length > 0);
  };

  const handleSelect = (item: CatalogSelection) => {
    const isSelected = selectionIds.has(item.id);
    const nextSelection = isSelected
      ? value.filter((v) => v.id !== item.id)
      : [...value, item];

    onSelect(nextSelection);
    setInputValue('');
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  const handleRemove = (id: string) => {
    if (!selectionIds.has(id)) return;
    onSelect(value.filter((v) => v.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemove(value[value.length - 1].id);
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="catalog-listbox"
          tabIndex={0}
          className="border-input bg-background flex min-h-[40px] w-full flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
          onClick={() => inputRef.current?.focus()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.focus();
              setOpen(true);
            }
          }}
        >
          {value.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="gap-1 py-1 pr-0.5 pl-1"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage
                  src={item.imageUrl || undefined}
                  alt={item.title}
                />
                <AvatarFallback className="bg-transparent">
                  {item.type === 'COLLECTION' ? (
                    <Layers className="text-secondary-dark h-3 w-3" />
                  ) : (
                    <Package className="text-secondary-dark h-3 w-3" />
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[150px] truncate">{item.title}</span>
              <button
                type="button"
                className="hover:bg-secondary-200 ml-1 rounded-full p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.id);
                }}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </button>
            </Badge>
          ))}

          <input
            ref={inputRef}
            type="text"
            className="placeholder:text-muted-foreground h-6 min-w-[120px] flex-1 bg-transparent outline-none"
            placeholder={
              value.length > 0 ? '' : 'Search products or collections...'
            }
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="border-none">
          <CommandList>
            {loading && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 p-4 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {!loading && !hasResults && debouncedQuery && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {!loading && collections.length > 0 && (
              <CommandGroup heading="Collections">
                {collections.map((collection) => {
                  const isSelected = selectionIds.has(collection.id);
                  return (
                    <CommandItem
                      key={`col-${collection.id}`}
                      value={collection.id}
                      onSelect={() =>
                        handleSelect({
                          type: 'COLLECTION',
                          id: collection.id,
                          title: collection.title,
                          imageUrl: collection.imageUrl,
                        })
                      }
                    >
                      <Avatar className="mr-2 h-6 w-6">
                        <AvatarImage src={collection.imageUrl || undefined} />
                        <AvatarFallback>
                          <Layers className="text-muted-foreground h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{collection.title}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {!loading && collections.length > 0 && products.length > 0 && (
              <CommandSeparator />
            )}

            {!loading && products.length > 0 && (
              <CommandGroup heading="Products">
                {products.map((product) => {
                  const isSelected = selectionIds.has(product.id);
                  return (
                    <CommandItem
                      key={`prod-${product.id}`}
                      value={product.id}
                      onSelect={() =>
                        handleSelect({
                          type: 'PRODUCT',
                          id: product.id,
                          title: product.title,
                          imageUrl: product.imageUrl,
                        })
                      }
                    >
                      <Avatar className="mr-2 h-6 w-6">
                        <AvatarImage src={product.imageUrl || undefined} />
                        <AvatarFallback>
                          <Package className="text-muted-foreground h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{product.title}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {!loading && isMaxedOut && (
              <div className="bg-muted/50 text-muted-foreground border-t p-2 text-center text-xs">
                Displaying top 25 results. Keep typing to refine...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
