import Image from 'next/image';
import { FC } from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

interface ComparisonProps {
  className?: string;
}

export const Comparison: FC<ComparisonProps> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global relative')}>
      <div className="padding-section-large container">
        <div className="mb-12 space-y-6 text-left">
          <h1 className="text-3xl md:text-4xl">
            See how Cloviana handles organic growth — without hiring
          </h1>
          <p className="max-w-[55ch] text-base md:text-lg">
            We turn your Shopify products into product-led content around real
            buyer searches, publish with your approval, and point readers
            straight to your product pages.
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
                <span className="text-lg">
                  Keyword guessing and brief wrangling
                </span>
              </div>
              <div className="flex items-center gap-3">
                <GIcon name="money_off" size={18} />
                <span className="text-lg">
                  Agency retainers and freelance churn
                </span>
              </div>
              <div className="flex items-center gap-3">
                <GIcon name="article" size={18} />
                <span className="text-lg">
                  Generic tips posts that do not sell the product
                </span>
              </div>
              <div className="flex items-center gap-3">
                <GIcon name="timer_off" size={18} />
                <span className="text-lg">
                  Inconsistent publishing and stalled organic
                </span>
              </div>
              <div className="flex items-center gap-3">
                <GIcon name="search_off" size={18} />
                <span className="text-lg">
                  No time to monitor what is working
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-y-6">
            <div className="text-foreground flex items-center justify-center gap-3">
              <Image src="/logo-icon.png" alt="logo" width={22} height={22} />
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
                    Setup in minutes inside Shopify
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GIcon name="edit_note" size={18} />
                  <span className="text-lg">
                    Maps products to buyer intent keywords
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GIcon name="article" size={18} />
                  <span className="text-lg">
                    Generates product led posts you approve
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GIcon name="link" size={18} />
                  <span className="text-lg">
                    Publishes to your blog and links to the product page
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GIcon name="trending_up" size={18} />
                  <span className="text-lg">
                    Keeps consistent buyer intent content going
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
