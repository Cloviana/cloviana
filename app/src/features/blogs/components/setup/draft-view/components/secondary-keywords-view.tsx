import { ListFilter, Sparkles, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';

import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/deprecated/ui/page';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import {
  SecondaryKeywordSuggestion,
  useGetSecondaryKeywordSuggestions,
} from '@/features/blogs/api/get-secondary-keywords-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { SerpIntent } from '@/features/blogs/types';
import { BlogSetupStep } from '@/types/api';
import { cn } from '@/utils/cn';

function formatK(n?: number) {
  if (n == null) return '–';
  if (n >= 1000) {
    const v = n / 1000;
    const s = Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
    return `${s}K`;
  }
  return n.toString();
}

const INTENT_META: Record<
  SerpIntent,
  {
    short: string;
    name: string;
    desc: string;
    variant: 'sky' | 'warning' | 'secondary' | 'success';
  }
> = {
  I: { short: 'I', name: 'Informational', desc: '', variant: 'sky' },
  C: { short: 'C', name: 'Commercial', desc: '', variant: 'warning' },
  N: { short: 'N', name: 'Navigational', desc: '', variant: 'secondary' },
  L: { short: 'L', name: 'Local', desc: '', variant: 'success' },
};

const getIntentMeta = (intent?: SerpIntent) =>
  intent && INTENT_META[intent] ? INTENT_META[intent] : INTENT_META.I;

function difficultyDotClass(p?: number) {
  if (p == null) return 'bg-muted-foreground/50';
  if (p <= 25) return 'bg-emerald-500';
  if (p <= 50) return 'bg-orange-500';
  return 'bg-rose-500';
}

export function KeywordSuggestionsTableMulti({
  rows,
  selectedKeywords,
  onChange,
  withSelectAll = true,
}: {
  rows: SecondaryKeywordSuggestion[];
  selectedKeywords: string[];
  onChange: (next: string[]) => void;
  withSelectAll?: boolean;
}) {
  const [sortDesc, setSortDesc] = React.useState(true);
  const data = React.useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a.volume ?? -1;
      const bv = b.volume ?? -1;
      return sortDesc ? bv - av : av - bv;
    });
    return copy;
  }, [rows, sortDesc]);

  const allSelected =
    data.length > 0 && selectedKeywords.length === data.length;

  const toggle = (k: string, v: boolean) => {
    const set = new Set(selectedKeywords);
    if (v) set.add(k);
    else set.delete(k);
    onChange(Array.from(set));
  };

  const toggleRow = (k: string) => {
    const has = selectedKeywords.includes(k);
    const set = new Set(selectedKeywords);
    if (has) set.delete(k);
    else set.add(k);
    onChange(Array.from(set));
  };

  const setAll = (v: boolean) => {
    if (v) onChange(data.map((r) => r.keyword));
    else onChange([]);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            {withSelectAll && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) => setAll(Boolean(v))}
                aria-label="Select all"
              />
            )}
          </TableHead>
          <TableHead className="text-sm font-medium">Suggestion</TableHead>
          <TableHead className="w-28 text-sm font-medium">Intent</TableHead>
          <TableHead className="w-28 text-right text-sm font-medium">
            <button
              className="inline-flex items-center gap-2"
              onClick={() => setSortDesc((s) => !s)}
            >
              Volume{' '}
              <ListFilter
                strokeWidth={2.2}
                className="text-foreground/70 size-3"
              />
            </button>
          </TableHead>
          <TableHead className="w-36 text-right text-sm font-medium">
            Difficulty, %
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((r) => {
          const checked = selectedKeywords.includes(r.keyword);
          const i = getIntentMeta(r.intent);
          return (
            <TableRow
              key={r.keyword}
              className={cn(checked && '!bg-sky-50')}
              onClick={() => toggleRow(r.keyword)}
            >
              <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggle(r.keyword, Boolean(v))}
                  aria-label={`Toggle ${r.keyword}`}
                />
              </TableCell>
              <TableCell className="flex items-center gap-2 text-sm font-medium">
                <span className="truncate">{r.keyword}</span>
                {r.recommended && (
                  <Badge variant="success" className="gap-1">
                    <Sparkles className="size-3" />
                    AI recommended
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant={i.variant}
                        className="size-5 items-center justify-center rounded p-0 text-[11px]"
                      >
                        {i.short}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="left">{i.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right text-sm font-medium tabular-nums">
                {formatK(r.volume)}
              </TableCell>
              <TableCell className="text-right text-sm font-medium tabular-nums">
                <span className="inline-flex items-center justify-end gap-2">
                  <span>{r.difficulty != null ? `${r.difficulty}%` : '–'}</span>
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      difficultyDotClass(r.difficulty),
                    )}
                  />
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function SelectedKeywordsChips({
  value,
  onRemove,
  onClear,
  limit = 100,
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

export function SecondaryKeywordsView() {
  const { getNextStepEnum } = useDrafter();
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();

  const { data: blog } = useGetBlog({ blogId, storeId });
  const { mutateAsync: update } = useUpdateBlog();
  const { data: suggestions = [], isLoading } =
    useGetSecondaryKeywordSuggestions({
      blogId,
    });

  const [selected, setSelected] = React.useState<string[]>([]);
  const [manual] = React.useState('');

  React.useEffect(() => {
    if (Array.isArray(blog?.secondaryKeywords))
      setSelected(blog?.secondaryKeywords as string[]);
  }, [blog?.secondaryKeywords]);

  React.useEffect(() => {
    if (suggestions.length) {
      const rec = suggestions
        .filter((s) => s.recommended)
        .map((s) => s.keyword);
      if (rec.length) setSelected(rec);
    }
  }, [suggestions]);

  const mergedRows = React.useMemo(() => {
    const set = new Set<string>(suggestions.map((s) => s.keyword));
    const extras = manual
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    extras.forEach((e) => set.add(e));
    const existing = selected.filter(Boolean);
    existing.forEach((e) => set.add(e));
    const merged = Array.from(set);
    const map = new Map(suggestions.map((s) => [s.keyword.toLowerCase(), s]));
    return merged.map(
      (k) =>
        map.get(k.toLowerCase()) ??
        ({ keyword: k, recommended: false } as SecondaryKeywordSuggestion),
    );
  }, [suggestions, manual, selected]);

  const nextEnum = getNextStepEnum();
  const disabled =
    JSON.stringify(selected) ===
      JSON.stringify(blog?.secondaryKeywords ?? []) || !selected.length;

  const save = async () => {
    await update({
      blogId,
      secondaryKeywords: selected,
      currentStep: nextEnum as BlogSetupStep,
      storeId,
    });
  };

  if (isLoading) return <ViewLoading />;

  return (
    <ViewWrapper onNext={save} isNextDisabled={disabled}>
      <Page>
        <PageHeader>
          <PageTitle>Secondary Keywords</PageTitle>
          <PageParagraph>
            Select a few supporting keywords related to your main topic.
            Cloviana will weave them naturally into the article to improve
            search coverage.
          </PageParagraph>
        </PageHeader>
        <PageContent>
          <SelectedKeywordsChips
            className="mt-4"
            value={selected}
            onRemove={(k) => setSelected(selected.filter((x) => x !== k))}
            onClear={() => setSelected([])}
            limit={30}
          />

          <div className="mt-4">
            <KeywordSuggestionsTableMulti
              rows={mergedRows}
              selectedKeywords={selected}
              onChange={setSelected}
              withSelectAll
            />
          </div>
        </PageContent>
      </Page>
    </ViewWrapper>
  );
}
