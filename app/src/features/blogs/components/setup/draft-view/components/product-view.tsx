'use client';

import { Sparkles, Filter, Search, Check } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/deprecated/ui/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useGetProductSuggestions } from '@/features/blogs/api/get-product-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';
import { cn } from '@/utils/cn';

type FilterMode = 'all' | 'selected' | 'recommended';

export const ProductView = () => {
  const { getNextStepEnum } = useDrafter();
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();

  const { data: blog, isLoading: isBlogLoading } = useGetBlog({
    blogId,
    storeId,
  });
  const { mutateAsync: update } = useUpdateBlog();
  const { data: suggestions = [], isLoading: isSuggestLoading } =
    useGetProductSuggestions({ blogId });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<FilterMode>('all');
  const [q, setQ] = useState('');

  // Seed selection from blog products
  useEffect(() => {
    if (!blog) return;
    setSelectedIds((blog.products ?? []).map((p) => p.id));
  }, [blog]);

  // If no prior selection, auto-pick AI recommended
  useEffect(() => {
    if (!suggestions.length) return;
    setSelectedIds((prev) =>
      prev.length
        ? prev
        : suggestions.filter((s) => s.recommended).map((s) => s.id),
    );
  }, [suggestions]);

  // Stable, recommended-first ordering
  const sorted = useMemo(() => {
    return [...suggestions].sort((a, b) => {
      if (b.recommended !== a.recommended)
        return Number(b.recommended) - Number(a.recommended);
      return a.title.localeCompare(b.title);
    });
  }, [suggestions]);

  // Apply filter + search
  const visible = useMemo(() => {
    const qs = q.trim().toLowerCase();
    let list = sorted;
    if (mode === 'selected')
      list = list.filter((p) => selectedIds.includes(p.id));
    if (mode === 'recommended') list = list.filter((p) => p.recommended);
    if (qs) list = list.filter((p) => p.title.toLowerCase().includes(qs));
    return list;
  }, [sorted, mode, q, selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const nextEnum = getNextStepEnum();

  // Disable Next when nothing changed
  const originalIds = useMemo(
    () => (blog?.products ?? []).map((p) => p.id).sort(),
    [blog?.products],
  );
  const currentIds = useMemo(() => [...selectedIds].sort(), [selectedIds]);
  const unchanged =
    originalIds.length === currentIds.length &&
    originalIds.every((v, i) => v === currentIds[i]);

  const save = async () => {
    await update({
      blogId,
      storeId,
      productIds: selectedIds,
      currentStep: nextEnum as BlogSetupStep,
    });
  };

  if (isBlogLoading || isSuggestLoading) return <ViewLoading />;

  return (
    <ViewWrapper onNext={save} isNextDisabled={unchanged}>
      <Page>
        <PageHeader>
          <PageTitle>Products</PageTitle>
          <PageParagraph>
            Pick one or more products to feature in this article.
          </PageParagraph>
        </PageHeader>

        <PageContent>
          <div className="flex flex-col gap-5">
            {/* Controls */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="dashed"
                    size="icon-sm"
                    className="shrink-0 gap-2"
                  >
                    <Filter className="size-3" strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    onClick={() => setMode('all')}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>All</span>
                    {mode === 'all' && <Check className="size-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setMode('selected')}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>Selected ({selectedIds.length})</span>
                    {mode === 'selected' && <Check className="size-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setMode('recommended')}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>Recommended</span>
                    {mode === 'recommended' && <Check className="size-2" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative flex-1">
                <Search
                  strokeWidth={2}
                  className="text-foreground-lighter pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                />
                <Input
                  placeholder="Filter products..."
                  value={q}
                  size="sm"
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* List (multi-select) */}
            <div className="flex w-full flex-col gap-3">
              {visible.map((p) => {
                const selected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-md border border-gray-100 px-4 py-2 text-left',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.title}
                          width={48}
                          height={48}
                          className="size-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground bg-muted flex h-12 w-12 items-center justify-center rounded-md text-xs">
                          No image
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <span
                          className="text-foreground line-clamp-2 text-xs font-medium"
                          title={p.title}
                        >
                          {p.title}
                        </span>
                        {p.recommended && (
                          <Badge variant="success" className="w-fit gap-1">
                            <Sparkles className="size-3" />
                            AI recommended
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        'grid size-5 place-items-center rounded-sm border',
                        selected
                          ? 'bg-secondary text-background border-0'
                          : 'border-input bg-background',
                      )}
                      aria-hidden
                    >
                      {selected && <Check className="size-3" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </PageContent>
      </Page>
    </ViewWrapper>
  );
};
