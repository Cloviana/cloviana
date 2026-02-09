'use client';

import { Check, ImageIcon, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useGetCollections } from '@/features/catalog/api/get-collections';
import type { Collection } from '@/types/api';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 20;

type CollectionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  storeId?: string;
};

export function CollectionsSheet({
  open,
  onOpenChange,
  selectedIds,
  onSelectionChange,
  storeId = 'current-store-id',
}: CollectionsSheetProps) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(inputValue);
    }, 300);
    return () => clearTimeout(id);
  }, [inputValue]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useGetCollections({
    storeId,
    params: { limit: PAGE_SIZE, q: query },
  });

  const collections = data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>Select Collections</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <InputGroup>
              <InputGroupAddon>
                <Search className="text-muted-foreground h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search collections..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X className="size-4" />
                </button>
              )}
            </InputGroup>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <CollectionCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  selected={selectedIds.includes(collection.id)}
                  onToggle={toggleSelection}
                />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-4 w-full" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner className="size-5" />
            </div>
          )}

          {!isLoading && collections.length === 0 && (
            <div className="text-muted-foreground py-10 text-center text-sm">
              No collections found.
            </div>
          )}
        </div>

        <SheetFooter className="flex flex-row justify-end gap-2.5 border-t">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Continue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CollectionCard({
  collection,
  selected,
  onToggle,
}: {
  collection: Collection;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(collection.id)}
      className="group focus-visible:ring-ring flex flex-col gap-y-2.5 rounded-lg text-left outline-none focus-visible:ring-2"
    >
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-lg',
        )}
      >
        <Avatar className="h-full w-full rounded-lg">
          <AvatarImage
            src={collection.imageUrl || ''}
            className="h-full w-full object-cover"
            alt={collection.title}
          />
          <AvatarFallback className="bg-muted flex h-full w-full items-center justify-center rounded-lg">
            <ImageIcon className="text-muted-foreground h-6 w-6" />
          </AvatarFallback>
        </Avatar>

        <span
          className={cn(
            'absolute top-2 right-2 flex size-5 items-center justify-center rounded-md backdrop-blur-md transition',
            selected ? 'bg-secondary' : 'bg-black/10',
          )}
          aria-pressed={selected}
          aria-label={selected ? 'Deselect collection' : 'Select collection'}
        >
          <Check
            className={cn(
              'size-3 transition',
              selected ? 'text-white opacity-100' : 'hidden',
            )}
          />
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="truncate text-sm font-medium group-hover:underline">
          {collection.title}
        </span>
        <span className="text-muted-foreground line-clamp-2 text-xs">
          {collection.productsCount || 0}{' '}
          {collection.productsCount === 1 ? 'product' : 'products'}
        </span>
      </div>
    </button>
  );
}

function CollectionCardSkeleton() {
  return (
    <div className="flex flex-col gap-y-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
