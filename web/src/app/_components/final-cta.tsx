'use client';

import Link from 'next/link';
import { FC } from 'react';

import { Button } from '@/components/ui/button';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

export const FinalCta: FC<{ className?: string }> = ({ className }) => (
  <section className={cn('padding-global', className)}>
    <div className="padding-section-medium container">
      <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <h2 className="font-gambarino text-3xl leading-tight sm:text-4xl md:text-5xl lg:max-w-none lg:text-4xl xl:text-5xl">
          Get found in AI search
        </h2>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center lg:justify-end">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => gaEvent('free_audit', { location: 'final_cta' })}
          >
            <Link href={paths.audit.getHref()}>Free audit</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => gaEvent('book_demo', { location: 'final_cta' })}
          >
            <Link href={links.demo}>Request a demo</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
