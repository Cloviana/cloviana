'use client';

import {
  Zap,
  Check,
  Minus,
  TrendingUp,
  AlertTriangle,
  CircleDashed,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import React, { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/lib/utils';

type CellType = 'good' | 'neutral' | 'bad' | 'info' | 'text-only';
type IconType =
  | 'fast'
  | 'check'
  | 'trend-up'
  | 'trend-medium'
  | 'minus'
  | 'warning'
  | 'circle'
  | 'none';

interface CellData {
  label: string;
  type: CellType;
  icon: IconType;
}

interface RowData {
  criteria: string;
  marketer: CellData;
  agency: CellData;
  inHouse: CellData;
  freelancers: CellData;
  diy: CellData;
}

const initialRows: RowData[] = [
  {
    criteria: 'Organic traffic growth',
    marketer: { label: 'Compounding', type: 'good', icon: 'trend-up' },
    agency: { label: 'Slow to start', type: 'neutral', icon: 'trend-medium' },
    inHouse: { label: 'Inconsistent', type: 'neutral', icon: 'trend-medium' },
    freelancers: { label: 'Unpredictable', type: 'bad', icon: 'warning' },
    diy: { label: 'Rarely happens', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Revenue from Google',
    marketer: { label: 'From day one', type: 'good', icon: 'fast' },
    agency: { label: 'Months away', type: 'bad', icon: 'minus' },
    inHouse: { label: 'Months away', type: 'bad', icon: 'minus' },
    freelancers: {
      label: 'Hit or miss',
      type: 'neutral',
      icon: 'trend-medium',
    },
    diy: { label: 'Unlikely', type: 'bad', icon: 'minus' },
  },
  {
    criteria: 'Hours saved per month',
    marketer: { label: '20–40 hrs', type: 'good', icon: 'check' },
    agency: { label: '5–10 hrs', type: 'neutral', icon: 'minus' },
    inHouse: { label: 'None', type: 'bad', icon: 'warning' },
    freelancers: { label: '5–10 hrs', type: 'neutral', icon: 'minus' },
    diy: { label: 'None', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Predictable monthly cost',
    marketer: { label: 'Fixed', type: 'good', icon: 'check' },
    agency: { label: 'Varies', type: 'neutral', icon: 'minus' },
    inHouse: { label: 'Unpredictable', type: 'bad', icon: 'warning' },
    freelancers: { label: 'Varies', type: 'neutral', icon: 'minus' },
    diy: { label: 'Unpredictable', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Content converts to sales',
    marketer: { label: 'Product-matched', type: 'good', icon: 'check' },
    agency: { label: 'Extra cost', type: 'neutral', icon: 'circle' },
    inHouse: { label: 'Depends on hire', type: 'neutral', icon: 'circle' },
    freelancers: { label: 'Needs briefing', type: 'neutral', icon: 'circle' },
    diy: { label: 'Generic content', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Consistent ranking improvement',
    marketer: { label: 'Guaranteed', type: 'good', icon: 'fast' },
    agency: { label: 'Scope-dependent', type: 'neutral', icon: 'circle' },
    inHouse: { label: 'Priority-dependent', type: 'neutral', icon: 'circle' },
    freelancers: { label: 'Unreliable', type: 'bad', icon: 'warning' },
    diy: { label: 'Always lapses', type: 'bad', icon: 'warning' },
  },
];

const expandedRows: RowData[] = [
  {
    criteria: 'Targets keywords customers search',
    marketer: { label: 'Automated', type: 'good', icon: 'fast' },
    agency: { label: 'Included', type: 'neutral', icon: 'minus' },
    inHouse: { label: 'Manual', type: 'bad', icon: 'warning' },
    freelancers: { label: 'Extra cost', type: 'neutral', icon: 'minus' },
    diy: { label: 'Manual tools', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Products rank in Google automatically',
    marketer: { label: 'Native', type: 'good', icon: 'check' },
    agency: { label: 'Manual', type: 'bad', icon: 'minus' },
    inHouse: { label: 'Manual', type: 'bad', icon: 'minus' },
    freelancers: { label: 'Manual', type: 'bad', icon: 'minus' },
    diy: { label: 'Manual', type: 'bad', icon: 'minus' },
  },
  {
    criteria: 'Revenue growth without more headcount',
    marketer: { label: 'High', type: 'good', icon: 'trend-up' },
    agency: { label: 'Medium', type: 'neutral', icon: 'minus' },
    inHouse: { label: 'Low', type: 'bad', icon: 'warning' },
    freelancers: { label: 'Low', type: 'bad', icon: 'warning' },
    diy: { label: 'Low', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Results survive staff changes',
    marketer: { label: 'Always', type: 'good', icon: 'check' },
    agency: { label: 'Medium risk', type: 'neutral', icon: 'minus' },
    inHouse: { label: 'High risk', type: 'bad', icon: 'warning' },
    freelancers: { label: 'High risk', type: 'bad', icon: 'warning' },
    diy: { label: 'High risk', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Content ownership',
    marketer: { label: 'Full', type: 'good', icon: 'check' },
    agency: { label: 'Partial', type: 'neutral', icon: 'minus' },
    inHouse: { label: 'Full', type: 'good', icon: 'check' },
    freelancers: { label: 'Full', type: 'good', icon: 'check' },
    diy: { label: 'Full', type: 'good', icon: 'check' },
  },
  {
    criteria: 'Works without SEO knowledge',
    marketer: { label: 'Yes', type: 'good', icon: 'check' },
    agency: { label: 'Mostly', type: 'good', icon: 'check' },
    inHouse: { label: 'No', type: 'bad', icon: 'warning' },
    freelancers: { label: 'Partially', type: 'neutral', icon: 'minus' },
    diy: { label: 'No', type: 'bad', icon: 'warning' },
  },
  {
    criteria: 'Best fit by monthly revenue',
    marketer: { label: '$5k-$1M+', type: 'text-only', icon: 'none' },
    agency: { label: '$100k+', type: 'text-only', icon: 'none' },
    inHouse: { label: '$500k+', type: 'text-only', icon: 'none' },
    freelancers: { label: '$20k-$200k', type: 'text-only', icon: 'none' },
    diy: { label: '$0-$50k', type: 'text-only', icon: 'none' },
  },
  {
    criteria: 'Estimated annual cost',
    marketer: { label: '$468-$1k', type: 'text-only', icon: 'none' },
    agency: { label: '$24k-$72k', type: 'text-only', icon: 'none' },
    inHouse: { label: '$100k+', type: 'text-only', icon: 'none' },
    freelancers: { label: '$12k-$36k', type: 'text-only', icon: 'none' },
    diy: { label: '$2k-$10k', type: 'text-only', icon: 'none' },
  },
];

const iconMap: Record<string, React.ElementType> = {
  fast: Zap,
  check: Check,
  'trend-up': TrendingUp,
  'trend-medium': TrendingUp,
  minus: Minus,
  warning: AlertTriangle,
  circle: CircleDashed,
};

const IconRenderer = ({
  icon,
  className,
}: {
  icon: IconType;
  className?: string;
}) => {
  const IconComponent = iconMap[icon];
  if (!IconComponent) return null;

  return (
    <IconComponent
      className={cn(
        'mr-2 h-3.5 w-3.5',
        icon === 'trend-medium' && 'rotate-45',
        className,
      )}
    />
  );
};

const CellRenderer = ({
  data,
  bold = false,
  textClass = 'text-foreground-light/90',
  usePrimaryGoodIcon = false,
}: {
  data: CellData;
  bold?: boolean;
  textClass?: string;
  usePrimaryGoodIcon?: boolean;
}) => {
  let iconColorClass = 'text-slate-400';

  if (data.type === 'good') {
    iconColorClass = usePrimaryGoodIcon ? 'text-primary' : 'text-slate-400';
  } else if (data.type === 'neutral') {
    iconColorClass = 'text-orange-600';
  }

  if (data.label === 'Low' && data.type === 'bad') {
    iconColorClass = 'text-slate-400';
  }

  return (
    <div className="flex items-center">
      <IconRenderer icon={data.icon} className={iconColorClass} />
      <span
        className={cn(
          textClass,
          bold && 'text-foreground font-bold',
          data.type === 'text-only' && 'font-normal',
        )}
      >
        {data.label}
      </span>
    </div>
  );
};

const TableRow = ({ row, isLast }: { row: RowData; isLast: boolean }) => (
  <>
    <div
      className={cn(
        'text-foreground border-r-primary col-span-1 flex items-center border-r bg-[#fefefe] p-4 font-medium',
        !isLast && 'border-b border-b-[#f2f2f2]',
      )}
    >
      {row.criteria}
    </div>
    <div
      className={cn(
        'border-r-primary bg-primary/5 col-span-1 flex items-center justify-center border-r p-4',
        !isLast && 'border-b border-b-[#f2f2f2]',
      )}
    >
      <CellRenderer
        data={row.marketer}
        textClass="text-foreground font-semibold"
        usePrimaryGoodIcon
      />
    </div>
    <div
      className={cn(
        'col-span-1 flex items-center justify-center border-r border-[#f2f2f2] p-4',
        !isLast && 'border-b',
      )}
    >
      <CellRenderer data={row.agency} />
    </div>
    <div
      className={cn(
        'col-span-1 flex items-center justify-center border-r border-[#f2f2f2] p-4',
        !isLast && 'border-b',
      )}
    >
      <CellRenderer data={row.inHouse} />
    </div>
    <div
      className={cn(
        'col-span-1 flex items-center justify-center border-r border-[#f2f2f2] p-4',
        !isLast && 'border-b',
      )}
    >
      <CellRenderer data={row.freelancers} />
    </div>
    <div
      className={cn(
        'col-span-1 flex items-center justify-center border-[#f2f2f2] p-4',
        !isLast && 'border-b',
      )}
    >
      <CellRenderer data={row.diy} />
    </div>
  </>
);

function ComparisonTable() {
  const [isExpanded, setIsExpanded] = useState(false);
  const headerClass =
    'flex items-center justify-center border-r border-b border-[#f2f2f2] bg-[#fdfdfd] p-4 text-center font-medium text-foreground';

  return (
    <div className="mx-auto w-full text-sm">
      <ScrollArea className="w-full">
        <div className="min-w-[980px] bg-white">
          <div className="overflow-hidden rounded-xl border border-[#f2f2f2] bg-white">
            <div className="grid grid-cols-6">
              <div className="text-foreground-light border-r-primary col-span-1 flex items-center border-r border-b border-b-[#f2f2f2] bg-[#fdfdfd] p-4 font-medium">
                Decision criteria
              </div>
              <div className="text-foreground border-r-primary border-t-primary bg-primary/5 col-span-1 border-t border-r border-b border-b-[#f2f2f2] p-4 text-center font-semibold">
                Cloviana
              </div>
              <div className={headerClass}>Marketing agency</div>
              <div className={headerClass}>In-house team</div>
              <div className={headerClass}>Freelancers</div>
              <div className={cn(headerClass, 'border-r-0')}>Manual SEO</div>

              {initialRows.map((row, idx) => (
                <TableRow key={idx} row={row} isLast={false} />
              ))}

              <div
                className={cn(
                  'hover:bg-accent col-span-6 flex cursor-pointer items-center justify-center p-3 transition-colors',
                  isExpanded && 'border-b border-[#f2f2f2]',
                )}
              >
                <button
                  className="flex items-center gap-2 text-sm font-medium text-slate-900 focus:outline-none"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isExpanded &&
                expandedRows.map((row, idx) => (
                  <TableRow
                    key={`expanded-${idx}`}
                    row={row}
                    isLast={idx === expandedRows.length - 1}
                  />
                ))}
            </div>
          </div>

          <div className="grid grid-cols-6">
            <div className="col-span-1 bg-white" />
            <div className="border-l-primary border-r-primary border-b-primary bg-primary/5 col-span-1 flex items-start justify-center rounded-b-xl border border-[#f2f2f2] p-6">
              <Button
                asChild
                size="lg"
                onClick={() => gaEvent('sign_up', { location: 'comparison' })}
              >
                <Link href={paths.auth.signup.getHref()}>
                  Start growing for free
                </Link>
              </Button>
            </div>
            <div className="col-span-4 bg-white" />
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export const Comparison: FC<{ className?: string }> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        <div className="mx-auto mb-8 flex flex-col items-center gap-y-3 text-center">
          <h2 className="max-w-[25ch] text-2xl font-medium md:text-3xl lg:text-4xl">
            Every other option costs more and earns less.
          </h2>
          <p className="text-foreground-light max-w-[60ch] text-base">
            Agencies bill $5k/month. Freelancers drift. DIY never sticks.
            Cloviana drives compounding organic revenue — automatically.
          </p>
        </div>
        <ComparisonTable />
      </div>
    </section>
  );
};
