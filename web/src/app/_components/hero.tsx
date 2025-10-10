import Link from 'next/link';
import { FC } from 'react';

import { Button } from '@/components/actions';
import { GIcon } from '@/components/icons';
import { Safari } from '@/components/mockups';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        <div className="space-y-6">
          <div className="text-foreground-light flex w-fit items-center gap-2 border-b border-dashed pb-2">
            <GIcon name="square" size={6} fill />
            <span className="text-xs md:text-sm">
              SEO that runs on autopilot for your Shopify store
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl">
            An SEO teammate that grows your Shopify store while you sleep
          </h1>
          <p className="max-w-[70ch] text-base md:text-lg">
            Cloviana lives right inside your Shopify store. It finds keywords,
            writes content, and{' '}
            <strong>boosts your traffic — all on autopilot</strong>, so you can
            focus on growing your business.
          </p>
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            <Button asChild size="lg">
              <Link href={paths.auth.signup.getHref()}>
                Get started for free
              </Link>
            </Button>
            <Button asChild className="group" variant="ghost" size="lg">
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
      <div className="relative container mt-4">
        <Safari
          url="https://app.cloviana.com"
          mode="default"
          className="light relative h-auto w-full rounded-xl ring-8 ring-gray-200/30"
          videoSrc="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/hero-banner.mp4"
        />
        <img
          className="absolute -top-18 right-0 h-16"
          src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/watch-a-quick-demo.png"
          alt="Watch a quick demo"
        />
      </div>
    </section>
  );
};
