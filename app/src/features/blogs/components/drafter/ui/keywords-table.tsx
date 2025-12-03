import { ListFilter, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { SuggestedKeyword } from '@/types/api';
import { cn } from '@/utils/cn';

interface KeywordsTableProps {
  keywords: SuggestedKeyword[];
  selected: string[];
  onToggle: (keyword: string) => void;
  onSelectAll?: (select: boolean) => void;
}

function difficultyDotClass(p?: number | null) {
  if (p == null) return 'bg-muted-foreground/50';
  if (p <= 25) return 'bg-emerald-500';
  if (p <= 50) return 'bg-orange-500';
  return 'bg-rose-500';
}

function formatK(n?: number | null) {
  if (n == null) return '–';
  if (n >= 1000) {
    const v = n / 1000;
    const s = Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
    return `${s}K`;
  }
  return n.toString();
}

function formatIntent(intent?: string | null) {
  if (!intent) return '–';
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

export function KeywordsTable({
  keywords,
  selected,
  onToggle,
  onSelectAll,
}: KeywordsTableProps) {
  const [sortDesc, setSortDesc] = useState(true);

  const sortedData = useMemo(() => {
    const copy = [...keywords];
    copy.sort((a, b) => {
      const av = a.volume ?? -1;
      const bv = b.volume ?? -1;
      return sortDesc ? bv - av : av - bv;
    });
    return copy;
  }, [keywords, sortDesc]);

  const allSelected =
    keywords.length > 0 && selected.length === keywords.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            {onSelectAll && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) => onSelectAll(Boolean(v))}
                aria-label="Select all"
              />
            )}
          </TableHead>
          <TableHead className="text-sm font-medium">Suggestion</TableHead>
          <TableHead className="w-40 text-sm font-medium">Intent</TableHead>
          <TableHead className="w-28 text-right text-sm font-medium">
            <button
              type="button"
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
        {sortedData.map((r) => {
          const isChecked = selected.includes(r.keyword);
          return (
            <TableRow
              key={r.keyword}
              className={cn(isChecked && '!bg-sky-50')}
              onClick={() => onToggle(r.keyword)}
            >
              <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggle(r.keyword)}
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
              <TableCell className="text-sm">
                {formatIntent(r.intent)}
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
