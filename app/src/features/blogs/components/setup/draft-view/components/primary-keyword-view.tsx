import { ListFilter, Sparkles } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/ui/page';
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
import { useGetPrimaryKeywordSuggestions } from '@/features/blogs/api/get-primary-keyword-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';
import { cn } from '@/utils/cn';

export type SerpIntent = 'I' | 'N' | 'C' | 'L';

export type PrimaryKeywordSuggestion = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: SerpIntent;
  recommended: boolean;
};

type Props = {
  rows: PrimaryKeywordSuggestion[];
  selectedKeyword: string | null;
  onSelect: (k: string | null) => void;
};

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
  I: {
    short: 'I',
    name: 'Informational',
    desc: 'The goal is to acquire specific data, research a topic, or learn new information.',
    variant: 'sky',
  },
  C: {
    short: 'C',
    name: 'Commercial',
    desc: 'The goal is to find detailed information on a product/service before making a purchase.',
    variant: 'warning',
  },
  N: {
    short: 'N',
    name: 'Navigational',
    desc: 'The goal is to find a specific brand/website.',
    variant: 'secondary',
  },
  L: {
    short: 'L',
    name: 'Local',
    desc: 'The goal is to find products/services available within a specific geographic area.',
    variant: 'success',
  },
};

function difficultyDotClass(p?: number) {
  if (p == null) return 'bg-muted-foreground/50';
  if (p <= 25) return 'bg-emerald-500';
  if (p <= 50) return 'bg-orange-500';
  return 'bg-rose-500';
}

export function KeywordSuggestionsTable({
  rows,
  selectedKeyword,
  onSelect,
}: Props) {
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

  const handleToggle = (k: string, checked: boolean) => {
    if (checked) onSelect(k);
    else onSelect(null);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
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
          const isChecked = selectedKeyword === r.keyword;
          const i = INTENT_META[r.intent ?? 'I'];
          return (
            <TableRow
              key={r.keyword}
              className={cn(isChecked && '!bg-sky-50')}
              onClick={() => onSelect(r.keyword)}
            >
              <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(v) => handleToggle(r.keyword, Boolean(v))}
                  aria-label={`Select ${r.keyword}`}
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

export const PrimaryKeywordView = () => {
  const { blogId, getNextStepEnum } = useDrafter();
  const { data: blog } = useGetBlog({ blogId });
  const { mutateAsync: update } = useUpdateBlog();
  const { data: suggestions = [], isLoading } = useGetPrimaryKeywordSuggestions(
    {
      blogId,
      topic: blog?.topic ?? '',
    },
  );

  const [value, setValue] = React.useState('');
  React.useEffect(() => {
    if (blog?.primaryKeyword) setValue(blog.primaryKeyword);
  }, [blog?.primaryKeyword]);

  const selectedKeyword = React.useMemo(
    () => (suggestions.some((s) => s.keyword === value) ? value : null),
    [suggestions, value],
  );

  const trimmed = value.trim();
  const disabled = !trimmed || trimmed === (blog?.primaryKeyword ?? '').trim();
  const nextEnum = getNextStepEnum();

  const save = async () => {
    await update({
      blogId,
      primaryKeyword: trimmed,
      currentStep: nextEnum as BlogSetupStep,
    });
  };

  if (isLoading) return <ViewLoading />;

  return (
    <ViewWrapper onNext={save} isNextDisabled={disabled}>
      <Page>
        <PageHeader>
          <PageTitle>Primary Keyword</PageTitle>
          <PageParagraph>
            Choose the main keyword you want this article to rank for. Cloviana
            will optimize the content around it to help your store appear in
            relevant searches.
          </PageParagraph>
        </PageHeader>
        <PageContent>
          <div className="grid w-full gap-3">
            <Label htmlFor="primaryKeyword">Primary keyword</Label>
            <Input
              id="primaryKeyword"
              type="text"
              size="lg"
              variant="white"
              placeholder="Enter the main keyword"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <KeywordSuggestionsTable
            rows={suggestions}
            selectedKeyword={selectedKeyword}
            onSelect={(k) => setValue(k ?? '')}
          />
        </PageContent>
      </Page>
    </ViewWrapper>
  );
};
