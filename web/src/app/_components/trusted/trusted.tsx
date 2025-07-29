import type { FC, HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

interface Logo {
  src: string;
  alt: string;
  height: number;
}

const LOGOS: Logo[] = [
  { src: '/logos/Ideogram_id9LsmXQWf_0.svg', alt: 'Ideogram', height: 28 },
  { src: '/logos/OpenAI_Logo_0.svg', alt: 'OpenAI', height: 20 },
  { src: '/logos/SEMrush_idVgjVMO52_0.svg', alt: 'SEMrush', height: 36 },
  { src: '/logos/SE Ranking_idwstdxyha_1.svg', alt: 'SE Ranking', height: 28 },
  { src: '/logos/Shopify.com_Logo_0.svg', alt: 'Shopify', height: 24 },
];

interface TrustedProps extends HTMLAttributes<HTMLDivElement> {
  storeCount?: number;
}

export const Trusted: FC<TrustedProps> = ({
  className,
  storeCount = 300,
  ...props
}) => (
  <div
    className={cn(
      'container flex flex-col items-center gap-8 lg:flex-row',
      className,
    )}
    {...props}
  >
    <p className="max-w-sm text-center text-sm leading-tight text-foreground-lighter lg:text-left">
      Trusted by{' '}
      <span className="font-medium text-foreground">{storeCount}+</span> stores,
      and partnered with leading companies
    </p>
    <div className="flex flex-1 flex-wrap items-center justify-center gap-7">
      {LOGOS.map(({ src, alt, height }) => (
        <img key={alt} src={src} alt={alt} style={{ height }} />
      ))}
    </div>
  </div>
);
