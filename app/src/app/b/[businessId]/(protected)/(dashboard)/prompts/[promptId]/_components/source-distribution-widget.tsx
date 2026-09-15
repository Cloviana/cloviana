'use client';

import { Info } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetPromptDomainTypes } from '@/features/prompts/api/get-prompt-domain-types';
import { useGetPromptSourceDomains } from '@/features/prompts/api/get-prompt-source-domains';
import { useGetPromptSourceUrls } from '@/features/prompts/api/get-prompt-source-urls';
import { useGetPromptUrlTypes } from '@/features/prompts/api/get-prompt-url-types';
import type {
  CitationDomainType,
  CitationUrlType,
  PromptSourceView,
} from '@/features/prompts/types';
import { cn } from '@/utils/cn';
import { getFaviconUrl } from '@/utils/domain';

type SourceTab = 'domains' | 'urls';

type SourceRowData = {
  key: string;
  label: string;
  domain: string;
  retrievals: number;
};

type TypeRowData = {
  key: string;
  label: string;
  retrievals: number;
  percentage: number;
  color: string;
};

const SOURCE_VIEWS: Array<{ value: PromptSourceView; label: string }> = [
  { value: 'top', label: 'Top' },
  { value: 'new', label: 'New' },
  { value: 'trending', label: 'Trending' },
  { value: 'losing', label: 'Losing' },
];

const SOURCE_VIEW_DESCRIPTIONS: Record<PromptSourceView, string> = {
  top: 'The most retrieved sources in the last seven days.',
  new: 'Sources retrieved in the last seven days but not in the preceding seven days.',
  trending: 'Sources with more retrievals than in the preceding seven days.',
  losing: 'Sources with fewer retrievals than in the preceding seven days.',
};

const DOMAIN_TYPE_LABELS: Record<CitationDomainType, string> = {
  CORPORATE: 'Corporate',
  UGC: 'UGC',
  OTHER: 'Other',
  REFERENCE: 'Reference',
  COMPETITOR: 'Competitor',
  INSTITUTIONAL: 'Institutional',
  EDITORIAL: 'Editorial',
};

const DOMAIN_TYPE_COLORS: Record<CitationDomainType, string> = {
  CORPORATE: '#F97316',
  UGC: '#06B6D4',
  OTHER: '#737780',
  REFERENCE: '#A855F7',
  COMPETITOR: '#F43F5E',
  INSTITUTIONAL: '#84CC16',
  EDITORIAL: '#3B82F6',
};

const URL_TYPE_LABELS: Record<CitationUrlType, string> = {
  COMPARISON: 'Comparison',
  OTHER: 'Other',
  ARTICLE: 'Article',
  HOW_TO_GUIDE: 'How-To Guide',
  PRODUCT_PAGE: 'Product Page',
  DISCUSSION: 'Discussion',
  LISTICLE: 'Listicle',
  VIDEO: 'Video',
  PROFILE: 'Profile',
  HOMEPAGE: 'Homepage',
};

const URL_TYPE_COLORS: Record<CitationUrlType, string> = {
  COMPARISON: '#3B82F6',
  OTHER: '#737780',
  ARTICLE: '#16A34A',
  HOW_TO_GUIDE: '#14B8A6',
  PRODUCT_PAGE: '#84CC16',
  DISCUSSION: '#0EA5E9',
  LISTICLE: '#06B6D4',
  VIDEO: '#EF4444',
  PROFILE: '#A855F7',
  HOMEPAGE: '#F97316',
};

const percentageFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getLastSevenDayRange() {
  const now = new Date();
  const toDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const fromDate = new Date(toDate);

  fromDate.setUTCDate(fromDate.getUTCDate() - 6);

  return { from: toDateKey(fromDate), to: toDateKey(toDate) };
}

function getUrlLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || '/';
  } catch {
    return url;
  }
}

function SourcePanelHeader({
  view,
  onViewChange,
}: {
  view: PromptSourceView;
  onViewChange: (view: PromptSourceView) => void;
}) {
  return (
    <div className="flex h-11 items-center justify-between gap-3">
      <Tabs
        value={view}
        onValueChange={(value) => onViewChange(value as PromptSourceView)}
        className="w-auto gap-0"
      >
        <TabsList className="h-auto w-auto gap-3 border-0">
          {SOURCE_VIEWS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`About ${view} sources`}
              className="cursor-default"
            >
              <Info className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
            {SOURCE_VIEW_DESCRIPTIONS[view]}
          </TooltipContent>
        </Tooltip>
        <span className="text-foreground-light text-[13px]">Retrievals</span>
      </div>
    </div>
  );
}

function SourceRows({ items }: { items: SourceRowData[] }) {
  const maximumRetrievals = Math.max(
    1,
    ...items.map((item) => item.retrievals),
  );

  return (
    <div className="space-y-1 py-3">
      {items.map((item) => (
        <div
          key={item.key}
          className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2"
        >
          <div className="relative flex h-9 min-w-0 items-center overflow-hidden rounded-md px-3">
            <div
              className="bg-muted absolute inset-y-0 left-0 rounded-md"
              style={{
                width: `${(item.retrievals / maximumRetrievals) * 100}%`,
              }}
              aria-hidden="true"
            />
            <div className="relative flex min-w-0 items-center gap-2">
              <Avatar className="size-5 shrink-0 rounded-md">
                <AvatarImage
                  src={getFaviconUrl(item.domain)}
                  alt={`${item.domain} favicon`}
                  className="object-contain"
                />
                <AvatarFallback className="rounded-md text-[9px] font-medium">
                  {item.domain.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className="truncate text-[13px] font-medium"
                title={item.key}
              >
                {item.label}
              </span>
            </div>
          </div>
          <span className="text-foreground-light text-right text-[13px] tabular-nums">
            {item.retrievals}
          </span>
        </div>
      ))}
    </div>
  );
}

function PanelMessage({ children }: { children: ReactNode }) {
  return (
    <div className="text-foreground-light flex min-h-80 items-center justify-center px-6 text-center text-sm">
      {children}
    </div>
  );
}

function SourceRowsSkeleton() {
  return (
    <div className="space-y-1 py-3">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2"
        >
          <Skeleton
            className="h-9 rounded-md"
            style={{ width: `${100 - index * 7}%` }}
          />
          <Skeleton className="ml-auto h-3 w-5" />
        </div>
      ))}
    </div>
  );
}

function SourceRankingPanel({
  view,
  onViewChange,
  items,
  itemName,
  isPending,
  isError,
}: {
  view: PromptSourceView;
  onViewChange: (view: PromptSourceView) => void;
  items: SourceRowData[];
  itemName: 'domains' | 'URLs';
  isPending: boolean;
  isError: boolean;
}) {
  return (
    <section className="min-w-0">
      <SourcePanelHeader view={view} onViewChange={onViewChange} />
      {isPending ? (
        <SourceRowsSkeleton />
      ) : isError ? (
        <PanelMessage>Source data is unavailable.</PanelMessage>
      ) : items.length === 0 ? (
        <PanelMessage>
          No {view === 'top' ? '' : `${view} `}
          {itemName} in the last seven days.
        </PanelMessage>
      ) : (
        <SourceRows items={items} />
      )}
    </section>
  );
}

function TypeRows({ items }: { items: TypeRowData[] }) {
  return (
    <div className="space-y-1 py-3">
      {items.map((item) => (
        <div
          key={item.key}
          className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2"
        >
          <div className="relative flex h-9 min-w-0 items-center overflow-hidden rounded-md px-3">
            <div
              className="bg-muted absolute inset-y-0 left-0 rounded-md"
              style={{ width: `${Math.min(100, item.percentage)}%` }}
              aria-hidden="true"
            />
            <div className="relative flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="truncate text-[13px] font-medium">
                {item.label}
              </span>
            </div>
          </div>
          <span className="text-foreground-light text-right text-[13px] tabular-nums">
            {percentageFormatter.format(item.percentage)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function TypeRowsSkeleton() {
  return (
    <div className="space-y-1 py-3">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2"
        >
          <Skeleton
            className="h-9 rounded-md"
            style={{ width: `${88 - index * 9}%` }}
          />
          <Skeleton className="ml-auto h-3 w-7" />
        </div>
      ))}
    </div>
  );
}

function TypeDistributionPanel({
  title,
  totalRetrievals,
  items,
  isPending,
  isError,
}: {
  title: string;
  totalRetrievals: number;
  items: TypeRowData[];
  isPending: boolean;
  isError: boolean;
}) {
  return (
    <section className="min-w-0">
      <div className="flex h-11 items-center justify-between gap-3">
        <span className="text-[13px] font-medium">{title}</span>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`About ${title.toLowerCase()}`}
                className="cursor-default"
              >
                <Info className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
              How retrievals from the last seven days are distributed across{' '}
              {title.toLowerCase()}.
            </TooltipContent>
          </Tooltip>
          <span className="text-[13px] font-medium tabular-nums">
            Total retrievals: {isPending ? '—' : totalRetrievals}
          </span>
        </div>
      </div>
      {isPending ? (
        <TypeRowsSkeleton />
      ) : isError ? (
        <PanelMessage>Type distribution is unavailable.</PanelMessage>
      ) : items.length === 0 ? (
        <PanelMessage>No source type data in the last seven days.</PanelMessage>
      ) : (
        <TypeRows items={items} />
      )}
    </section>
  );
}

function DistributionLayout({
  sourcePanel,
  typePanel,
}: {
  sourcePanel: ReactNode;
  typePanel: ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {sourcePanel}
      {typePanel}
    </div>
  );
}

type SourceDistributionWidgetProps = {
  businessId: string;
  promptId: string;
  className?: string;
};

export function SourceDistributionWidget({
  businessId,
  promptId,
  className,
}: SourceDistributionWidgetProps) {
  const range = useMemo(() => getLastSevenDayRange(), []);
  const [tab, setTab] = useState<SourceTab>('domains');
  const [view, setView] = useState<PromptSourceView>('top');
  const domainSourcesQuery = useGetPromptSourceDomains(
    { businessId, promptId, ...range, view },
    { queryConfig: { enabled: tab === 'domains' } },
  );
  const domainTypesQuery = useGetPromptDomainTypes(
    { businessId, promptId, ...range },
    { queryConfig: { enabled: tab === 'domains' } },
  );
  const urlSourcesQuery = useGetPromptSourceUrls(
    { businessId, promptId, ...range, view },
    { queryConfig: { enabled: tab === 'urls' } },
  );
  const urlTypesQuery = useGetPromptUrlTypes(
    { businessId, promptId, ...range },
    { queryConfig: { enabled: tab === 'urls' } },
  );

  const domainSources: SourceRowData[] = (
    domainSourcesQuery.data?.items ?? []
  ).map((item) => ({
    key: item.domain,
    label: item.domain,
    domain: item.domain,
    retrievals: item.retrievals,
  }));
  const urlSources: SourceRowData[] = (urlSourcesQuery.data?.items ?? []).map(
    (item) => ({
      key: item.url,
      label: getUrlLabel(item.url),
      domain: item.domain,
      retrievals: item.retrievals,
    }),
  );
  const domainTypes: TypeRowData[] = (domainTypesQuery.data?.items ?? []).map(
    (item) => ({
      key: item.type,
      label: DOMAIN_TYPE_LABELS[item.type],
      retrievals: item.retrievals,
      percentage: item.percentage,
      color: DOMAIN_TYPE_COLORS[item.type],
    }),
  );
  const urlTypes: TypeRowData[] = (urlTypesQuery.data?.items ?? []).map(
    (item) => ({
      key: item.type,
      label: URL_TYPE_LABELS[item.type],
      retrievals: item.retrievals,
      percentage: item.percentage,
      color: URL_TYPE_COLORS[item.type],
    }),
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Source Distribution
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="About source distribution"
                className="cursor-default"
              >
                <Info className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
              See which sources contributed to AI responses in the last seven
              days and how they are distributed.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardAction className="self-center">
          <ToggleGroup
            type="single"
            value={tab}
            onValueChange={(value) => {
              if (value) setTab(value as SourceTab);
            }}
            size="sm"
            className="bg-muted rounded-lg p-0.5"
            aria-label="Source type"
          >
            <ToggleGroupItem
              value="domains"
              className="data-[state=on]:bg-surface data-[state=on]:text-foreground h-7 min-w-16 rounded-md px-2.5 text-[13px] font-normal data-[state=on]:shadow-sm"
            >
              Domains
            </ToggleGroupItem>
            <ToggleGroupItem
              value="urls"
              className="data-[state=on]:bg-surface data-[state=on]:text-foreground h-7 min-w-12 rounded-md px-2.5 text-[13px] font-normal data-[state=on]:shadow-sm"
            >
              URLs
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-3">
        {tab === 'domains' ? (
          <DistributionLayout
            sourcePanel={
              <SourceRankingPanel
                view={view}
                onViewChange={setView}
                items={domainSources}
                itemName="domains"
                isPending={domainSourcesQuery.isPending}
                isError={domainSourcesQuery.isError}
              />
            }
            typePanel={
              <TypeDistributionPanel
                title="Domain types"
                totalRetrievals={domainTypesQuery.data?.totalRetrievals ?? 0}
                items={domainTypes}
                isPending={domainTypesQuery.isPending}
                isError={domainTypesQuery.isError}
              />
            }
          />
        ) : (
          <DistributionLayout
            sourcePanel={
              <SourceRankingPanel
                view={view}
                onViewChange={setView}
                items={urlSources}
                itemName="URLs"
                isPending={urlSourcesQuery.isPending}
                isError={urlSourcesQuery.isError}
              />
            }
            typePanel={
              <TypeDistributionPanel
                title="URL types"
                totalRetrievals={urlTypesQuery.data?.totalRetrievals ?? 0}
                items={urlTypes}
                isPending={urlTypesQuery.isPending}
                isError={urlTypesQuery.isError}
              />
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
