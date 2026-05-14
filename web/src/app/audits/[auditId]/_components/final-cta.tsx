'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { links } from '@/config/links';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type FinalCtaProps = {
  className?: string;
  auditId: string;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const FinalCta = ({ className, auditId }: FinalCtaProps) => (
  <section className={cn(className, 'padding-global')}>
    <div className="padding-section-medium container flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-center text-2xl md:text-left lg:text-3xl">
        Stop losing deals you never knew were on the table.
      </h2>
      <ShinyButton>
        <Button
          asChild
          size="lg"
          onClick={() =>
            gaEvent('book_demo', { location: 'final_cta', audit_id: auditId })
          }
        >
          <Link href={links.demo}>Request a demo</Link>
        </Button>
      </ShinyButton>
    </div>
  </section>
);
