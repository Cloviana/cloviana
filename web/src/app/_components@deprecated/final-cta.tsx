'use client';

import Link from 'next/link';
import { FC } from 'react';

import { GIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

interface FinalCTAProps {
  className?: string;
}

export const FinalCTA: FC<FinalCTAProps> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-section-small')}>
      <div className="container">
        <div className="relative overflow-hidden md:aspect-[3/1] md:rounded-xl">
          <video
            src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/final-cta.mp4"
            poster="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/final-cta-blur.jpg"
            className="h-auto w-full rounded-xl object-cover md:absolute md:inset-0 md:h-full md:w-full"
            autoPlay
            loop
            muted
            playsInline
          />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="font-outfit mb-6 max-w-2xl text-xl font-medium text-white md:text-4xl">
              Your next customer is already searching. Make sure they find you.
            </h2>
            <div className="flex flex-row items-center justify-center gap-4">
              <Button
                asChild
                variant="ghost"
                size={'lg'}
                className="text-foreground bg-white"
                onClick={() => gaEvent('sign_up', { location: 'final_cta' })}
              >
                <Link href={paths.auth.signup.getHref()}>Start free trial</Link>
              </Button>
              <Button
                asChild
                variant="ghost_a"
                size={'lg'}
                className="group text-white"
                onClick={() => gaEvent('book_demo', { location: 'final_cta' })}
              >
                <a href={links.demo} target="_blank" rel="noopener noreferrer">
                  Book a demo
                  <GIcon
                    name="arrow_forward"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
