import Image from 'next/image';
import { FC } from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

interface ComparisonProps {
  className?: string;
}

export const Comparison: FC<ComparisonProps> = ({ className }) => {
  return (
    <section
      className={cn(className, 'padding-global relative border-t border-b')}
    >
      <div className="padding-section-large container">
        <div className="mb-12 space-y-6">
          <div className="text-foreground-light flex w-fit items-center gap-2 border-b border-dashed pb-2">
            <GIcon name="square" size={6} fill />
            <span className="text-xs md:text-sm">
              The difference is night and day
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl">
            See how Cloviana transforms your SEO — without extra work
          </h1>
          <p className="text-base md:text-lg">
            Manual SEO drains your time and budget. Cloviana does it all for you
            — faster, cheaper, and smarter.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-y-6">
            <div className="text-foreground/70 flex items-center justify-center gap-3">
              <GIcon name="close" size={18} />
              <h3 className="text-center text-lg text-current">
                Without Cloviana
              </h3>
            </div>

            <div className="text-foreground/70 flex flex-1 flex-col gap-5 border p-10">
              <div className="flex items-center gap-3">
                <GIcon name="hourglass_empty" size={18} />
                <span className="text-lg">Hours of keyword guesswork</span>
              </div>
              <div className="flex items-center gap-3">
                <GIcon name="money_off" size={18} />
                <span className="text-lg">Big agency fees every month</span>
              </div>
              <div className="flex items-center gap-3">
                <GIcon name="article" size={18} />
                <span className="text-lg">
                  Slow, generic content that doesn’t rank
                </span>
              </div>
              <div className="flex items-center gap-3">
                <GIcon name="link_off" size={18} />
                <span className="text-lg">
                  Broken basics: weak links, messy metas
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-6">
            <div className="text-foreground flex items-center justify-center gap-3">
              <Image src={'/logo-icon.png'} alt="logo" width={22} height={22} />
              <h3 className="text-center text-xl text-current">
                With Cloviana
              </h3>
            </div>

            <div className="relative flex-1 p-[2px]">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
              <div className="bg-background relative flex h-full w-full flex-col gap-5 p-10">
                <div className="flex items-center gap-3">
                  <GIcon name="bolt" size={18} />
                  <span className="text-lg">
                    Set up in 5 minutes, inside Shopify
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GIcon name="edit_note" size={18} />
                  <span className="text-lg">
                    Finds keywords and writes content for you
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GIcon name="link" size={18} />
                  <span className="text-lg">
                    Auto internal linking and meta fixes
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GIcon name="trending_up" size={18} />
                  <span className="text-lg">Faster growth at lower cost</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
