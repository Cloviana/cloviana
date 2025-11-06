'use client';

import {
  Plug,
  PenLine,
  Search,
  Sparkles,
  Store,
  Rocket,
  LucideIcon,
} from 'lucide-react';
import { FC } from 'react';

import { cn } from '@/utils/cn';

interface OverviewProps {
  className?: string;
}

interface OverviewItemProps {
  icon: LucideIcon;
  label: string;
  text: string;
  className?: string;
}

export const OverviewItem: FC<OverviewItemProps> = ({
  icon: Icon,
  label,
  text,
  className,
}) => {
  return (
    <div
      className={cn('flex flex-row items-center gap-x-4 rounded-xl', className)}
    >
      <div className="flex aspect-square size-20 w-fit items-center justify-center rounded-md bg-[#f4f2f0]">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-foreground-lighter text-xs">{label}</p>
        <p>{text}</p>
      </div>
    </div>
  );
};

const overviewItems = [
  { icon: Plug, label: 'Shopify Sync', text: 'Connect your store in seconds' },
  {
    icon: Search,
    label: 'Keyword Discovery',
    text: 'Real buyer searches, real volume',
  },
  {
    icon: PenLine,
    label: 'AI Blog Creation',
    text: 'Turn products into SEO posts',
  },
  { icon: Sparkles, label: 'Brand Voice', text: 'Keep every post on-brand' },
  {
    icon: Store,
    label: 'Product Linking',
    text: 'Showcase items inside content',
  },
  {
    icon: Rocket,
    label: 'One-Click Publish',
    text: 'Go live directly on Shopify',
  },
];

export const Overview: FC<OverviewProps> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global relative')}>
      <div className="padding-section-medium container space-y-14">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl md:text-2xl lg:text-4xl">
            Get to know Cloviana.
          </h2>
          <p className="text-foreground-lighter text-sm md:text-base">
            Stop paying for slow SEO. Cloviana builds your organic growth engine
            while you run the rest of the business.
          </p>
        </div>

        {/* Desktop grid */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
          {overviewItems.map((item, i) => (
            <OverviewItem key={i} {...item} />
          ))}
        </div>

        {/* Mobile horizontal scroll */}
        <div className="scrollbar-hide no-scrollbar -mx-4 overflow-x-auto lg:hidden">
          <div className="flex snap-x snap-mandatory gap-4 px-4">
            {overviewItems.map((item, i) => (
              <OverviewItem
                key={i}
                {...item}
                className="w-64 flex-shrink-0 snap-start"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
