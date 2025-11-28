'use client';

import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNowStrict } from 'date-fns';
import { Image, Key } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Blog, BlogStatus, Thumbnail } from '@/types/api';

export const blogColumns: ColumnDef<Blog>[] = [
  {
    accessorKey: 'blog',
    header: 'Topic',
    cell: ({ row }) => {
      const topic = row.original.topic as string | undefined;
      const thumbnail = row.original.thumbnail as Thumbnail | null | undefined;
      const primaryKeyword = row.original.primaryKeyword as string;

      return (
        <div className="flex min-w-40 items-center gap-2">
          <Avatar className="bg-muted/60 hidden size-8 rounded-md md:block">
            {thumbnail?.srcUrl ? (
              <AvatarImage
                src={thumbnail.srcUrl}
                alt={thumbnail.altText || 'thumbnail'}
                className="rounded-md object-cover object-center"
                fetchPriority="high"
              />
            ) : null}
            <AvatarFallback
              delayMs={200}
              className="bg-muted rounded-md border"
            >
              <Image className="text-muted-foreground size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="max-w-2xs space-y-[2px]">
            <span className="line-clamp-1 text-[13px] leading-tight font-medium tracking-tight group-hover:underline">
              {topic}
            </span>
            <div className="text-foreground-light flex items-center gap-1 text-xs">
              <Key className="size-3 shrink-0" />
              {primaryKeyword?.trim() || '-'}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BlogStatus;
      return (
        <div className="text-[13px] capitalize">{status.toLowerCase()}</div>
      );
    },
  },
  {
    accessorKey: 'productsCount',
    header: () => <div className="w-full text-center">Products</div>,
    cell: ({ row }) => {
      const productsCount = row.getValue('productsCount') as number;
      return (
        <div className="flex flex-col justify-center gap-[2px] text-center">
          <div className="text-[13px] leading-none">{productsCount}</div>
          <div className="text-foreground-light text-xs leading-none">used</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last modified',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => {
      const value = row.original.updatedAt;
      const date = value ? new Date(value) : null;

      return (
        <div className="text-foreground-light text-[13px]">
          {date ? formatDistanceToNowStrict(date, { addSuffix: true }) : '-'}
        </div>
      );
    },
  },
];
