'use client';

import { Key } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useGetBlogs } from '@/features/blogs/api/get-blogs';
import { cn } from '@/utils/cn';

function formatAbsolute(value?: string | Date) {
  if (!value) return '–';
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(d);
}

function formatRelative(value?: string | Date) {
  if (!value) return '–';
  const d = typeof value === 'string' ? new Date(value) : value;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 45) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function statusMeta(status?: string): {
  label: string;
  variant: 'success' | 'warning';
} {
  if ((status ?? '').toLowerCase() === 'published')
    return { label: 'Published', variant: 'success' };
  return { label: 'Unpublished', variant: 'warning' };
}

function RelativeTime({ value }: { value?: string | Date }) {
  const [text, setText] = React.useState<string>('');
  React.useEffect(() => {
    setText(formatRelative(value));
  }, [value]);
  return <>{text || '\u00A0'}</>;
}

export const BlogList = () => {
  const router = useRouter();
  const { storeId } = useParams<{ storeId: string }>();
  const { data: blogs = [], isLoading } = useGetBlogs(storeId);

  const sorted = [...blogs].sort((a, b) => {
    const av = new Date(a.updatedAt as any).getTime();
    const bv = new Date(b.updatedAt as any).getTime();
    return bv - av;
  });

  const goToEditor = (blogId: string) => {
    router.push(paths.store.blogs.editor.getHref(storeId, blogId));
  };

  if (isLoading) {
    return <div className="text-foreground/70 p-6 text-sm">Loading…</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-sm font-medium">Topic</TableHead>
          <TableHead className="text-sm font-medium">Primary keyword</TableHead>
          <TableHead className="w-32 text-sm font-medium">Status</TableHead>
          <TableHead className="w-48 text-right text-sm font-medium">
            Created
          </TableHead>
          <TableHead className="w-48 text-right text-sm font-medium">
            Updated
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-foreground/70 py-12 text-center text-sm"
            >
              No blogs yet.
            </TableCell>
          </TableRow>
        )}
        {sorted.map((b: any) => {
          const meta = statusMeta(b.status);
          return (
            <TableRow
              key={b.id}
              className={cn('hover:bg-muted/70 cursor-pointer')}
              onClick={() => goToEditor(b.id)}
            >
              <TableCell className="text-sm font-medium">
                <div className="max-w-[300px]">
                  <span className="block truncate">{b.topic ?? '—'}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                <span className="text-foreground/80 inline-flex max-w-[26rem] items-center gap-1 truncate">
                  <Key className="size-3.5 shrink-0" />
                  <span className="truncate">{b.primaryKeyword || '—'}</span>
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <time
                  suppressHydrationWarning
                  dateTime={
                    typeof b.createdAt === 'string'
                      ? b.createdAt
                      : new Date(b.createdAt).toISOString()
                  }
                  title={formatAbsolute(b.createdAt)}
                >
                  <RelativeTime value={b.createdAt} />
                </time>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <time
                  suppressHydrationWarning
                  dateTime={
                    typeof b.updatedAt === 'string'
                      ? b.updatedAt
                      : new Date(b.updatedAt).toISOString()
                  }
                  title={formatAbsolute(b.updatedAt)}
                >
                  <RelativeTime value={b.updatedAt} />
                </time>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
