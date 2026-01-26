import { useQueryClient } from '@tanstack/react-query';
import { Check, ImageIcon, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';
import { useGetProducts } from '@/features/catalog/api/get-products';
import { suggestionKeys } from '@/lib/react-query';
import type { Product } from '@/types/api';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 20;
const SKELETON_COUNT = 10;

type ProductCardProps = {
  product: Product;
  selected: boolean;
  onToggle: (id: string) => void;
};

const ProductCard = ({ product, selected, onToggle }: ProductCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(product.id)}
      className="group flex flex-col gap-y-2.5 text-left"
    >
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-lg',
        )}
      >
        <Avatar className="h-full w-full rounded-lg">
          <AvatarImage
            src={product.imageUrl || ''}
            className="h-full w-full object-cover"
            alt={product.title}
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
          aria-label={selected ? 'Deselect product' : 'Select product'}
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
          {product.title}
        </span>
        <span className="text-muted-foreground line-clamp-2 text-xs">
          {product.description}
        </span>
      </div>
    </button>
  );
};

const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
};

export const ProductStep = () => {
  const { steps, currentIndex, storeId, blogId, goPrev, goNext } = useDrafter();
  const step = steps[currentIndex];

  const qc = useQueryClient();
  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const { data: blog } = useGetBlog({ storeId, blogId });

  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useGetProducts({
    storeId,
    params: { limit: PAGE_SIZE, q: query },
  });

  const products = data?.pages.flatMap((p) => p.data) ?? [];

  const maxSelectable =
    blog?.contentType === 'COMPARISON'
      ? 2
      : blog?.contentType === 'PROBLEM_SOLUTION'
        ? 1
        : 1;

  const isSelectionValid = selectedIds.length === maxSelectable;

  const handleNext = async () => {
    if (!blog || !isSelectionValid) return;

    await updateBlog({
      storeId,
      blogId,
      productIds: selectedIds,
      currentStep: 'TOPIC',
    });

    const invalidations = [
      qc.invalidateQueries({
        queryKey: suggestionKeys.topic(storeId, blogId),
      }),
      qc.invalidateQueries({
        queryKey: suggestionKeys.primaryKeyword(storeId, blogId),
      }),
      qc.invalidateQueries({
        queryKey: suggestionKeys.secondaryKeywords(storeId, blogId),
      }),
    ];

    await Promise.all(invalidations);

    goNext();
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= maxSelectable) {
        return prev;
      }
      return [...prev, id];
    });
  };

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(inputValue);
    }, 300);

    return () => clearTimeout(id);
  }, [inputValue]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!hasNextPage || isFetching) return;
        fetchNextPage();
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  useEffect(() => {
    if (!blog?.products) return;

    setSelectedIds(blog.products.map((p) => p.id));
  }, [blog?.products]);

  if (!blog) return null;

  return (
    <StepWrapper
      title={step.title}
      description={step.description}
      onBack={goPrev}
      isNextDisabled={!isSelectionValid || isPending}
      isNextLoading={isPending}
      onNext={handleNext}
    >
      <div className="mb-4 flex flex-col gap-3">
        {/* <div className="flex min-h-8 flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground flex cursor-default items-center gap-2 text-[13px]">
                  <span>{`${selectedIds.length}/${maxSelectable}`}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" sideOffset={3}>
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto whitespace-nowrap md:justify-end">
            {selectedProducts.map((p) => (
              <SelectedChip key={p.id} product={p} onRemove={removeSelected} />
            ))}
          </div>
        </div>*/}

        <div className="flex-1">
          <InputGroup>
            <InputGroupInput
              placeholder="Search products"
              value={inputValue}
              size="default"
              onChange={handleSearchChange}
            />
            <InputGroupAddon>
              <Search className="h-4 w-4" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {isError && (
        <div className="text-destructive text-sm">Failed to load products.</div>
      )}

      {isLoading && !isError && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={selectedIds.includes(product.id)}
                onToggle={toggleSelected}
              />
            ))}
          </div>

          <div ref={loadMoreRef} />

          {isFetchingNextPage && (
            <Spinner
              className="text-foreground-light mx-auto mt-6 size-5"
              strokeWidth={3.2}
              variant="2"
            />
          )}
        </>
      )}
    </StepWrapper>
  );
};
