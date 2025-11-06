'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

import { GIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@/components/ui/marquee';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container pb-[3rem]">
        <div className="flex flex-col space-y-6">
          <span className="text-foreground-light text-sm">
            Your always-on AI teammate for organic growth
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl">
            The fastest way to get pages for ready-to-buy searches live
          </h1>
          <p className="max-w-[70ch] text-base md:text-lg">
            We turn your Shopify products into on-brand posts mapped to{' '}
            <strong>real search volume</strong> and link them to product
            pages—approve, publish, track in GSC/GA4.
          </p>

          <div className="flex w-full flex-col items-stretch gap-2 md:flex-row md:items-center">
            <Button asChild size="lg" onClick={() => gaEvent('sign_up')}>
              <Link href={paths.auth.signup.getHref()}>
                Get started for free
              </Link>
            </Button>

            <Button
              asChild
              className="group"
              variant={'outline'}
              size="lg"
              onClick={() => gaEvent('book_demo')}
            >
              <a href={links.demo} target="_blank" rel="noopener noreferrer">
                Request a demo
                <GIcon
                  name="arrow_forward"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </Button>
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
            src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/hero-background.png"
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
