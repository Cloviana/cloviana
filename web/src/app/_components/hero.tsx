'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@/components/ui/marquee';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  const { push } = useRouter();
  const [storeUrl, setStoreUrl] = useState('');

  function normalize(url: string) {
    let v = url.trim();
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    return v;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    gaEvent('sign_up');
    const v = normalize(storeUrl);
    push(paths.auth.signup.getHref({ store: v }));
  }

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container pb-[3rem]">
        <div className="max-w-[70ch]">
          <div className="flex flex-col space-y-3 md:space-y-4">
            <span className="text-foreground-light text-sm">
              For Shopify stores
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl">
              More buyers from Google and AI search — no ads
            </h1>

            <div className="flex flex-col">
              <p className="text-base md:text-lg">
                Your products become on-brand posts that rank on Google and in
                AI search. We find buyer searches, write, link to your SKUs, and
                publish to Shopify.
              </p>
              <p className="text-foreground-lighter mt-1.5 text-xs md:mt-2">
                Find what people search · Write the post · Link to product pages
                · Publish to Shopify
              </p>
            </div>
          </div>
          <div className="mt-6 flex w-full flex-col items-stretch gap-2 md:mt-8 md:flex-row md:items-center">
            <form onSubmit={onSubmit} className="w-full md:max-w-lg">
              <div className="relative">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="Enter your Shopify store URL"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  className="h-12 pr-36"
                  size="lg"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                >
                  <span className="sm:hidden">Get started</span>
                  <span className="hidden sm:inline">Get started for free</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="container flex items-center gap-3">
        <div className="hidden max-w-xs md:block">
          <p className="text-foreground-lighter text-left text-sm">
            Powered by the platforms behind smarter organic growth.
          </p>
        </div>
        <Marquee>
          <MarqueeFade side="left" />
          <MarqueeFade side="right" />
          <MarqueeContent pauseOnHover={false}>
            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/openai-logo.svg"
                alt="OpenAI"
                className="h-7 object-contain opacity-65"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/Claude_Logo_0.svg"
                alt="Claude"
                className="h-7 object-contain opacity-65"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/Ideogram_id9LsmXQWf_0.svg"
                alt="Ideogram"
                className="h-9 object-contain opacity-65"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/Shopify.com_Logo_0.svg"
                alt="Shopify"
                className="h-7 object-contain opacity-65"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/SEMrush_idVgjVMO52_0.svg"
                alt="SEMrush"
                className="h-10 object-contain opacity-65"
              />
            </MarqueeItem>

            <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
              <img
                src="/logos/SE Ranking_idwstdxyha_1.svg"
                alt="SE Ranking"
                className="h-8 object-contain opacity-65"
              />
            </MarqueeItem>
          </MarqueeContent>
        </Marquee>
      </div>
      <div className="container">
        <div className="relative z-10 p-3 md:p-8 lg:p-10">
          <Image
            src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/hero-background.png?v=2025-11-06-1"
            alt="Demo background"
            fill
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAYAAAD+Bd/7AAAAv0lEQVR4AQzI30rCYBjA4R+vy0Ba0EHdQ3fbNXTSYWdCCUERbA79sCSMEUS5Ur/p/DN16thed/CcPBL2e/rZNzp4N/rxZrRnOur5gT48e3pze6dyVi9wTwrOT0vcSsM54JAh5ZZ0NUZE91VUqTuccoPkS9aLXxIbclnfI3/xnKGdEtmYaDLmf/RNOOjy9NLCD3yk2e7Q9HxaXcNjEHD/2sZ8/ZAfNszmMWLTjEmSENshaRLRKFa4tYwLJ+f6qsYRAAD//1ehPzcAAAAGSURBVAMA/ARs6W1FFNoAAAAASUVORK5CYII="
            className="rounded-xl object-cover"
          />

          <div
            style={{
              position: 'relative',
              paddingBottom: 'calc(52.45614035087719% + 50px)',
              height: 0,
            }}
          >
            <iframe
              id="0p0y33obvk"
              title="Cloviana interactive demo"
              src="https://app.guideflow.com/embed/0p0y33obvk"
              width="100%"
              height="100%"
              style={{
                overflow: 'hidden',
                position: 'absolute',
                border: 'none',
              }}
              scrolling="no"
              allow="clipboard-read; clipboard-write"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
};
