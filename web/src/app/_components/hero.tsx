'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

import { GIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
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
        <div className="flex flex-col items-center space-y-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl">
            Your always-on AI teammate for <br />{' '}
            <span className="italic">organic growth</span>
          </h1>
          <p className="max-w-[70ch] text-base md:text-lg">
            Cloviana helps Shopify brands grow organically by turning your
            products into content that{' '}
            <strong>shows up where buyers are already searching</strong>.
          </p>

          <div className="flex w-full flex-col items-stretch justify-center gap-2 md:flex-row md:items-center">
            <Button asChild size="lg" onClick={() => gaEvent('sign_up')}>
              <Link href={paths.auth.signup.getHref()}>
                Get started for free
              </Link>
            </Button>

            <Button
              asChild
              className="group bg-primary/10 text-primary"
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
      <div className="relative container px-0">
        <Image
          src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/hero-background.png"
          alt="Demo background"
          fill
          priority
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAsUlEQVR4AQClAFr/AlSj0P9VpNH/XqfQ/2mqz/90rcz/dK7O/3+vyv+Jssf/AhwK/wAqC/YAMQvvAB8H9AAkBu8AIwXvACkH6AAbBO4AAjX3zgAm/ucAKAHhAC8D2wAtAtYAKP/bAAHjygD/5d0AAurRuADq1csA4uD1APDn+gDn6AIA1dPmAMW8wwDSwK8AAuQTQADmDikA9goOAO4ECQDxAQQA9v/+APn9/wAEAgEAAAAA//8Hb/XaAAAABklEQVQDAELXTElcdSFQAAAAAElFTkSuQmCC"
          className="rounded-xl object-cover"
        />

        <div className="relative z-10 p-3 md:p-8 lg:p-10">
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
