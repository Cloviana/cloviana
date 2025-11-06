import { FC } from 'react';

import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@/components/ui/marquee';
import { cn } from '@/utils/cn';

interface PartneredByProps {
  className?: string;
}

export const PartneredBy: FC<PartneredByProps> = ({ className }) => {
  return (
    <section
      className={cn(
        className,
        'padding-global relative overflow-hidden border-t border-b',
      )}
    >
      <div className="relative z-10 container border-r border-l pt-8">
        <p className="text-foreground-lighter text-center text-sm">
          Proudly partnered with leading companies powering smarter organic
          growth.
        </p>

        <Marquee>
          <MarqueeFade side="left" />
          <MarqueeFade side="right" />
          <MarqueeContent pauseOnHover={false}>
            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/openai-logo.svg"
                alt="OpenAI"
                className="h-7 object-contain opacity-70"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/Claude_Logo_0.svg"
                alt="Claude"
                className="h-7 object-contain opacity-70"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/Ideogram_id9LsmXQWf_0.svg"
                alt="Ideogram"
                className="h-9 object-contain opacity-70"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/Shopify.com_Logo_0.svg"
                alt="Shopify"
                className="h-7 object-contain opacity-70"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/SEMrush_idVgjVMO52_0.svg"
                alt="SEMrush"
                className="h-10 object-contain opacity-70"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/SE Ranking_idwstdxyha_1.svg"
                alt="SE Ranking"
                className="h-8 object-contain opacity-70"
              />
            </MarqueeItem>
          </MarqueeContent>
        </Marquee>
      </div>
    </section>
  );
};
