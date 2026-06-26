import Image from 'next/image';
import { FC, ReactNode } from 'react';

import { cn } from '@/utils/cn';

export type FeatureCardBackground = {
  src: string;
  blurDataURL?: string;
  className?: string;
};

type FeatureCardProps = {
  title: string;
  mutedTitle: string;
  layout: 'wide' | 'tall';
  children: ReactNode;
  background?: FeatureCardBackground;
};

export const FeatureCard: FC<FeatureCardProps> = ({
  title,
  mutedTitle,
  layout,
  children,
  background,
}) => {
  const hasImageBackground = Boolean(background);

  return (
    <article
      className={cn(
        'relative flex w-full flex-col items-stretch overflow-hidden rounded-xl border border-zinc-100 bg-[#faf9f7] text-left',
        layout === 'wide' &&
          'min-h-90 sm:min-h-110 lg:aspect-644/483 lg:min-h-[483px]',
        layout === 'tall' && 'min-h-80 sm:min-h-100 md:aspect-421/526',
      )}
    >
      {background && (
        <Image
          src={background.src}
          alt=""
          fill
          aria-hidden="true"
          placeholder={background.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={background.blurDataURL}
          className={cn(
            'pointer-events-none absolute inset-0 object-cover',
            background.className,
          )}
        />
      )}

      <div className="relative z-10 flex items-start justify-between gap-2 px-4 py-6 sm:px-6 sm:py-8 lg:pl-8">
        <h3
          className={cn(
            'leading-trim max-w-[330px] text-xl sm:text-2xl',
            hasImageBackground && 'text-white',
          )}
        >
          {title}{' '}
          <span
            className={cn(
              'text-foreground-light',
              hasImageBackground && 'text-white/70',
            )}
          >
            {mutedTitle}
          </span>
        </h3>
      </div>

      <div
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6',
          layout === 'tall' &&
            hasImageBackground &&
            'pointer-events-none absolute inset-0 items-end p-0',
        )}
      >
        {children}
      </div>
    </article>
  );
};
