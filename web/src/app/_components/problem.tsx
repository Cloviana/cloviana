import { FC } from 'react';

import { cn } from '@/utils/cn';

export const Problem: FC<{ className?: string }> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container max-w-6xl">
        <h2 className="text-foreground-light text-center text-3xl md:text-4xl lg:text-[40px]/12">
          B2B buyers now ask AI before talking to sales — 94% of them. Every
          answer that skips your name is a lost deal.{' '}
          <span className="text-foreground">Cloviana changes that.</span>
        </h2>
      </div>
    </section>
  );
};
