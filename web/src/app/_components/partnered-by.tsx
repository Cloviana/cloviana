import { FC } from 'react';

import { cn } from '@/utils/cn';

interface PartneredByProps {
  className?: string;
}

export const PartneredBy: FC<PartneredByProps> = ({ className }) => {
  return (
    <section
      className={cn(className, 'padding-global relative overflow-hidden')}
    >
      <div className="padding-section-small relative z-10 container space-y-8 pb-26">
        <p className="text-center text-sm md:text-base">
          Proudly partnered with leading companies powering smarter organic
          growth.
        </p>

        <div className="grid grid-cols-2 place-items-center gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-6">
          <div className="flex h-19 w-full items-center justify-center rounded-md border bg-neutral-50/70 shadow-xs">
            <img
              className="h-7 opacity-75"
              src="/logos/openai-logo.svg"
              alt="OpenAI"
            />
          </div>
          <div className="flex h-19 w-full items-center justify-center rounded-md border bg-neutral-50/70 shadow-xs">
            <img
              className="h-6 opacity-75"
              src="/logos/Claude_Logo_0.svg"
              alt="Claude"
            />
          </div>
          <div className="flex h-19 w-full items-center justify-center rounded-md border bg-neutral-50/70 shadow-xs">
            <img
              className="h-7 opacity-75"
              src="/logos/Ideogram_id9LsmXQWf_0.svg"
              alt="Ideogram"
            />
          </div>
          <div className="flex h-19 w-full items-center justify-center rounded-md border bg-neutral-50/70 shadow-xs">
            <img
              className="h-6.5 opacity-75"
              src="/logos/Shopify.com_Logo_0.svg"
              alt="Shopify"
            />
          </div>
          <div className="flex h-19 w-full items-center justify-center rounded-md border bg-neutral-50/70 shadow-xs">
            <img
              className="h-9 opacity-75"
              src="/logos/SEMrush_idVgjVMO52_0.svg"
              alt="SEMrush"
            />
          </div>
          <div className="flex h-19 w-full items-center justify-center rounded-md border bg-neutral-50/70 shadow-xs">
            <img
              className="h-7 opacity-75"
              src="/logos/SE Ranking_idwstdxyha_1.svg"
              alt="SE Ranking"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
