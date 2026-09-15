'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getFaviconUrl, normalizeDomain } from '@/utils/domain';

export type DomainItem = { name?: string; domain: string };

const getLabel = (item: DomainItem) => item.name ?? item.domain;

/** Favicon for a domain, tooltipped with the domain it stands for. */
export function DomainAvatar({
  item,
  className,
}: {
  item: DomainItem;
  className?: string;
}) {
  const label = getLabel(item);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className={className ?? 'bg-surface size-5 rounded-md'}>
          <AvatarImage
            src={getFaviconUrl(item.domain)}
            alt={`${label} favicon`}
          />
          <AvatarFallback className="rounded-md text-[9px] font-medium">
            {label.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {normalizeDomain(item.domain)}
      </TooltipContent>
    </Tooltip>
  );
}

/** Overlapping favicons with a "+n" overflow counter. Each avatar tooltips itself. */
export function DomainAvatarStack({
  items,
  max = 3,
  emptyLabel,
}: {
  items: DomainItem[];
  max?: number;
  emptyLabel?: string;
}) {
  if (!items.length)
    return <span className="text-muted-foreground">{emptyLabel ?? '-'}</span>;

  // The leading avatar sits on its own so only the ones behind it overlap.
  const [leadItem, ...stackedItems] = items.slice(0, max + 1);
  const remainingCount = items.length - Math.min(items.length, max + 1);

  return (
    <div className="flex w-fit items-center gap-1">
      {leadItem && <DomainAvatar item={leadItem} />}
      {stackedItems.length > 0 && (
        <div className="flex -space-x-1.5">
          {stackedItems.map((item) => (
            <DomainAvatar key={item.domain} item={item} />
          ))}
        </div>
      )}
      {remainingCount > 0 && (
        <span className="text-muted-foreground text-xs font-medium">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
