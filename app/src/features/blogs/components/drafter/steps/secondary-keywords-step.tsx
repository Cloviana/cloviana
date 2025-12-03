import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useGetSecondaryKeywordSuggestions } from '@/features/blogs/api/get-secondary-keywords-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { KeywordsTable } from '@/features/blogs/components/drafter/ui/keywords-table';
import { StepLoading } from '@/features/blogs/components/drafter/ui/step-loading';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';
import { SuggestedKeyword } from '@/types/api';
import { cn } from '@/utils/cn';

function SelectedKeywordsChips({
  value,
  onRemove,
  onClear,
  limit = 30,
  className,
}: {
  value: string[];
  onRemove: (k: string) => void;
  onClear: () => void;
  limit?: number;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[13px] font-medium">
          Keywords{' '}
          <span className="text-foreground/60">
            {value.length} / {limit}
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-foreground/70 hover:text-foreground text-sm font-medium underline decoration-dashed"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-x-1.5 gap-y-2">
        {value.map((k) => (
          <span
            key={k}
            className="bg-muted inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
          >
            {k}
            <button
              type="button"
              className="hover:bg-muted-foreground/10 rounded-full p-0.5"
              onClick={() => onRemove(k)}
              aria-label={`Remove ${k}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export const SecondaryKeywordsStep = () => {
  const { steps, currentIndex, storeId, blogId, goNext, goPrev } = useDrafter();
  const step = steps[currentIndex];

  const { data: blog, isLoading: isBlogLoading } = useGetBlog({
    storeId,
    blogId,
  });

  const {
    data: suggestions = [],
    isFetching: isSuggestionsFetching,
    isLoading: isSuggestionsLoading,
  } = useGetSecondaryKeywordSuggestions({
    storeId,
    blogId,
  });

  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (Array.isArray(blog?.secondaryKeywords)) {
      setSelected(blog.secondaryKeywords as string[]);
    }
  }, [blog?.secondaryKeywords]);

  useEffect(() => {
    if (!suggestions.length) return;
    if (blog?.secondaryKeywords && blog.secondaryKeywords.length) return;
    const rec = suggestions.filter((s) => s.recommended).map((s) => s.keyword);
    if (rec.length) setSelected(rec);
  }, [suggestions, blog?.secondaryKeywords]);

  const mergedRows = useMemo(() => {
    const set = new Set<string>(suggestions.map((s) => s.keyword));
    const extras = selected.filter(Boolean);
    extras.forEach((e) => set.add(e));
    const merged = Array.from(set);
    const map = new Map(suggestions.map((s) => [s.keyword.toLowerCase(), s]));
    return merged.map((k, idx) => {
      const existing = map.get(k.toLowerCase());
      if (existing) return existing;
      const fallback: SuggestedKeyword = {
        id: Number.MAX_SAFE_INTEGER - idx,
        keyword: k,
        recommended: false,
        volume: 0,
        difficulty: null,
        intent: null,
      };
      return fallback;
    });
  }, [suggestions, selected]);

  const hasSuggestions = mergedRows.length > 0;
  const showSuggestionsLoading = isSuggestionsLoading || isSuggestionsFetching;

  const isUnchanged =
    JSON.stringify(selected) === JSON.stringify(blog?.secondaryKeywords ?? []);
  const isFormValid = selected.length > 0;

  const handleNext = async () => {
    if (!isFormValid || isUnchanged) {
      if (isFormValid) goNext();
      return;
    }

    await updateBlog({
      storeId,
      blogId,
      secondaryKeywords: selected,
      currentStep: steps[currentIndex + 1].dbEnum,
    });

    goNext();
  };

  const handleToggle = (keyword: string) => {
    const set = new Set(selected);
    if (set.has(keyword)) set.delete(keyword);
    else set.add(keyword);
    setSelected(Array.from(set));
  };

  const handleSelectAll = (shouldSelect: boolean) => {
    if (shouldSelect) {
      setSelected(mergedRows.map((r) => r.keyword));
    } else {
      setSelected([]);
    }
  };

  if (isBlogLoading || showSuggestionsLoading) return <StepLoading />;

  return (
    <StepWrapper
      title={step.title}
      description={step.description}
      onNext={handleNext}
      onBack={goPrev}
      isNextDisabled={!isFormValid}
      isNextLoading={isPending}
    >
      <div className="space-y-6">
        <SelectedKeywordsChips
          className="mt-2"
          value={selected}
          onRemove={(k) => setSelected(selected.filter((x) => x !== k))}
          onClear={() => setSelected([])}
          limit={30}
        />

        {showSuggestionsLoading && (
          <div className="text-muted-foreground text-sm">
            Loading secondary keyword suggestions…
          </div>
        )}

        {!showSuggestionsLoading && hasSuggestions && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              Select supporting secondary keywords related to your primary
              keyword. Cloviana will weave them into the article to expand
              search coverage.
            </p>
            <KeywordsTable
              keywords={mergedRows}
              selected={selected}
              onToggle={handleToggle}
              onSelectAll={handleSelectAll}
            />
          </div>
        )}

        {!showSuggestionsLoading && !hasSuggestions && (
          <p className="text-muted-foreground text-xs">
            No secondary keyword suggestions are available for this blog yet.
          </p>
        )}
      </div>
    </StepWrapper>
  );
};
