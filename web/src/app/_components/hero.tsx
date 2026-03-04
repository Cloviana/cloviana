'use client';

import Link from 'next/link';
import { FC } from 'react';

import LogoIcon from '@/assets/logo-icon.svg';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { links } from '@/config/links';
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
          <div className="mx-auto flex max-w-xl flex-col items-center gap-y-6 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl">
              AI meeting assistant that makes you smarter
            </h1>
            <p className="text-foreground-light text-base md:text-base lg:text-lg">
              Get real-time answers during calls. Caret pulls context from your
              docs and past meetings in under a second.
            </p>

            <div className="space-y-2">
              <div className="flex flex-col items-stretch justify-center gap-4 md:flex-row md:items-center">
                <ShinyButton>
                  <Button
                    asChild
                    size={'lg'}
                    onClick={() => gaEvent('book_demo', { location: 'hero' })}
                  >
                    <Link href={links.demo}>Request a demo</Link>
                  </Button>
                </ShinyButton>
              </div>
              <span className="text-foreground-light text-xs">
                <strong>14 days free trial</strong> — All Cloviana features — No
                card required
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-wine container flex h-[40rem] items-start justify-center overflow-clip rounded-md border-t bg-[url(/images/wallpaper-hero.jpg)] bg-cover bg-top pt-28">
        <div className="flex gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur">
            <LogoIcon className="size-5" />
          </div>
          <div className="rounded-3xl bg-black/30 p-4 text-white backdrop-blur">
            Hello, how are you doing?
          </div>
        </div>
      </div>
    </section>
  );
};
