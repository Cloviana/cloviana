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
      <img
        src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/contrasting-background.png"
        alt="Background"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="padding-section-medium relative z-10 container space-y-8 pb-26">
        <p className="text-center text-sm md:text-base">
          50+ growing brands trust Cloviana to boost their Shopify traffic —
          powered by leading partners for the best results.
        </p>
        <div className="grid grid-cols-2 place-items-center gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
          <img
            className="h-7 opacity-75 transition-opacity hover:opacity-100"
            src="/logos/openai-logo.svg"
            alt="OpenAI"
          />
          <img
            className="h-6 opacity-75 transition-opacity hover:opacity-100"
            src="/logos/Claude_Logo_0.svg"
            alt="Claude"
          />
          <img
            className="h-7 opacity-75 transition-opacity hover:opacity-100"
            src="/logos/Ideogram_id9LsmXQWf_0.svg"
            alt="Ideogram"
          />
          <img
            className="h-7 opacity-75 transition-opacity hover:opacity-100"
            src="/logos/Shopify.com_Logo_0.svg"
            alt="Shopify"
          />
          <img
            className="h-9 opacity-75 transition-opacity hover:opacity-100"
            src="/logos/SEMrush_idVgjVMO52_0.svg"
            alt="SEMrush"
          />
          <img
            className="h-8 opacity-75 transition-opacity hover:opacity-100"
            src="/logos/SE Ranking_idwstdxyha_1.svg"
            alt="SE Ranking"
          />
        </div>
      </div>
    </section>
  );
};
