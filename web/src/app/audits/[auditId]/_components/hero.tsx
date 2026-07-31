'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Leaderboard } from '@/components/ui/leaderboard';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Spinner } from '@/components/ui/spinner';
import { env } from '@/config/env';
import { links } from '@/config/links';
import { Audit } from '@/features/audit';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

type HeroProps = {
  className?: string;
  auditId: string;
  audit: Pick<Audit, 'domain' | 'brandName' | 'visibilityLeaderboard'>;
};

export const Hero = ({ className, auditId, audit }: HeroProps) => {
  const [downloading, setDownloading] = useState(false);

  const brand = audit.visibilityLeaderboard?.find(
    (b) => b.domain === audit.domain,
  );
  const rankLabel = brand
    ? `You rank ${ordinal(brand.position)}`
    : "You're not ranking";

  // fetched as a blob rather than a plain <a download> so the button can show
  // progress — PDF generation renders the page headlessly and takes seconds
  const downloadPdf = async () => {
    setDownloading(true);
    gaEvent('download_pdf', { location: 'hero', audit_id: auditId });

    try {
      const response = await fetch(`${env.API_URL}/audits/${auditId}/pdf`);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${audit.domain}-ai-visibility-audit.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // revoking synchronously cancels the download before it starts
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.error("Couldn't generate your PDF", {
        description: 'Please try again in a moment.',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-12">
          <div className="w-full text-center md:w-1/2 md:text-left">
            <div className="space-y-2">
              <div className="mb-4 inline-flex items-center gap-2">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${audit.domain}&sz=32`}
                  alt={audit.domain}
                  width={18}
                  height={18}
                  className="rounded-sm"
                />
                <span>
                  {audit.brandName ?? audit.domain} AI Visibility Report
                </span>
              </div>
              <h1 className="text-4xl">
                {rankLabel}
                <br />
                in AI Visibility
              </h1>
              <p className="max-w-[55ch]">
                Your buyers are already asking ChatGPT and Perplexity which
                software to use. This report shows whether they're hearing your
                name — or your competitor's.
              </p>
            </div>
            <div className="mt-6 flex flex-col items-stretch gap-4 md:flex-row md:items-center print:hidden">
              <ShinyButton>
                <Button
                  asChild
                  size={'lg'}
                  className="w-full md:w-auto"
                  onClick={() =>
                    gaEvent('book_demo', {
                      location: 'hero',
                      audit_id: auditId,
                    })
                  }
                >
                  <Link href={links.demo}>Request a demo</Link>
                </Button>
              </ShinyButton>
              <Button
                variant="ghost"
                size="lg"
                onClick={downloadPdf}
                disabled={downloading}
              >
                {downloading ? <Spinner /> : <Download />}
                {downloading ? 'Preparing PDF…' : 'Download PDF'}
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <Leaderboard
              items={(audit.visibilityLeaderboard ?? []).map((b) => ({
                position: b.position,
                domain: b.domain,
                name: b.name,
                share: b.mentionShare,
              }))}
              targetDomain={audit.domain}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
