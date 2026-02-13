'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

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
    <section className={cn(className)}>
      <div className="padding-global">
        <div className="padding-section-medium container pb-[3rem]">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-y-6 text-center">
            <h1 className="text-4xl font-semibold md:text-5xl lg:text-[56px]/14">
              Your products, found on Google, ChatGPT, and beyond.
            </h1>
            <p className="text-foreground-light max-w-[65ch] text-base md:text-base lg:text-lg">
              Cloviana connects to your{' '}
              <Image
                src={'/icons/shopify-240.svg'}
                className="inline-block"
                width={24}
                height={24}
                alt="Shopify"
              />{' '}
              Shopify store, turns your catalog into high-intent content, and
              publishes on autopilot — so you show up everywhere buyers search,
              without an agency or a single writer.
            </p>

            <div className="space-y-2">
              <div className="flex flex-col items-stretch justify-center gap-4 md:flex-row md:items-center">
                <Button
                  asChild
                  size={'lg'}
                  onClick={() => gaEvent('sign_up', { location: 'hero' })}
                >
                  <Link href={paths.auth.signup.getHref()}>
                    Start free trial
                  </Link>
                </Button>
                <Button
                  asChild
                  size={'lg'}
                  variant={'ghost'}
                  className="bg-accent"
                  onClick={() => gaEvent('book_demo', { location: 'hero' })}
                >
                  <Link href={links.demo}>Book a demo</Link>
                </Button>
              </div>
              <span className="text-foreground-light text-xs">
                <strong>14 days free trial</strong> — All Cloviana features — No
                card required
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="padding-global">
        <div className="relative z-10 container p-3 md:p-8 lg:p-10">
          <Image
            src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/hero-background.png"
            alt="Demo background"
            fill
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAYAAACzzX7wAAAAkElEQVR4AQCEAHv/Ao23w/9upbn/Zqu7/2avvf97r8H/YKK3/2mpvP9qprv/Aszm6gDr7vEA0NHcANrf6gDc3uYA2uTqANrs8AASBPwAAuLe7ADb3ucA9fX5APDe6QC/zdwAAPj3AAf19gC1w9UAAt7Z5ADt8/UA/fj+AOLc5gD9/wEA2c3gAOjp9QD6/P4AAAAA//89cdHGAAAABklEQVQDAO6AUwWAC7z9AAAAAElFTkSuQmCC"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            className="rounded-3xl object-cover"
          />

          <div
            style={{
              position: 'relative',
              paddingBottom: 'calc(53.567251461988306% + 47px)',
              height: 0,
            }}
          >
            <iframe
              id="zklvm36fjr"
              title="Product demo"
              src="https://app.guideflow.com/embed/zklvm36fjr"
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
      <div className="padding-global pb-[3rem]">
        <div className="container flex items-center gap-3">
          <div className="hidden max-w-xs md:block">
            <p className="text-foreground-lighter text-left text-sm">
              Powered by the tools the best SEO teams use.
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
      </div>
    </section>
  );
};
