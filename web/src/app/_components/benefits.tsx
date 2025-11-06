'use client';

import {
  Plug,
  Sparkles,
  Store,
  Rocket,
  LucideIcon,
  Target,
  TrendingUp,
} from 'lucide-react';
import { FC } from 'react';

import { cn } from '@/utils/cn';

interface BenefitsProps {
  className?: string;
}

interface BenefitsItemProps {
  icon: LucideIcon;
  label: string;
  text: string;
  className?: string;
}

export const BenefitsItem: FC<BenefitsItemProps> = ({
  icon: Icon,
  label,
  text,
  className,
}) => {
  return (
    <div
      className={cn('flex flex-row items-center gap-x-4 rounded-xl', className)}
    >
      <div className="flex aspect-square size-16 items-center justify-center rounded-md bg-[#f4f2f0]">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-foreground-lighter text-xs">{label}</p>
        <p>{text}</p>
      </div>
    </div>
  );
};

const benefitsItems = [
  {
    icon: TrendingUp,
    label: 'More buyers without ads',
    text: 'Show up on Google and in AI search for ready-to-buy queries.',
  },
  {
    icon: Target,
    label: 'Traffic that converts',
    text: 'Posts target buyer intent and route readers straight to product pages.',
  },
  {
    icon: Rocket,
    label: 'Weeks of work in minutes',
    text: 'Research, write, link, and publish in one flow—no agency handoffs.',
  },
  {
    icon: Store,
    label: 'Lift product page visits',
    text: 'Every post embeds your SKUs and drives qualified PDP traffic.',
  },
  {
    icon: Sparkles,
    label: 'On-brand by default',
    text: 'Your tone and internal links stay consistent across all content.',
  },
  {
    icon: Plug,
    label: 'Shopify-native setup',
    text: 'Connect in seconds and publish directly to your Shopify blog.',
  },
];

export const Benefits: FC<BenefitsProps> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global relative')}>
      <div className="padding-section-medium container space-y-10">
        <div className="max-w-2xl space-y-3 md:space-y-4">
          <h2 className="text-xl md:text-2xl lg:text-4xl">
            Why Shopify brands use Cloviana
          </h2>
          <p className="text-foreground-lighter text-sm md:text-base">
            Replace agencies and scattered tools with Cloviana—the platform that
            turns your catalog into search visibility and organic sales.
          </p>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-3">
          {benefitsItems.map((item, i) => (
            <BenefitsItem key={i} {...item} />
          ))}
        </div>

        <div className="no-scrollbar -mx-4 overflow-x-auto lg:hidden">
          <div className="flex snap-x snap-mandatory gap-4 px-4">
            {benefitsItems.map((item, i) => (
              <BenefitsItem
                key={i}
                {...item}
                className="w-72 flex-shrink-0 snap-start"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
