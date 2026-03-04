import { FC } from 'react';

import { cn } from '@/utils/cn';

interface TeamEmbedProps {
  className?: string;
}

export const TeamEmbed: FC<TeamEmbedProps> = ({ className }) => {
  return (
    <section className={cn('relative -mt-px bg-white', className)}>
      <div className="flex w-full justify-center">
        <div className="relative w-full max-w-7xl">
          <div className="relative px-2 pb-12 sm:px-6 sm:pb-16 lg:pb-20">
            <div className="absolute top-0 bottom-0 left-0 hidden w-px bg-gray-200 lg:block" />
            <div className="absolute top-0 right-0 bottom-0 hidden w-px bg-gray-200 lg:block" />
            <div className="absolute right-0 bottom-0 left-0 hidden h-px bg-gray-200 lg:block" />

            <div className="grid grid-cols-1 gap-8 px-4 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-12 lg:px-12 lg:pt-20">
              {/* Left: headline + avatars */}
              <div className="flex items-center">
                <div>
                  <h2 className="mb-6 text-2xl leading-tight font-bold text-gray-900 sm:text-3xl lg:text-4xl">
                    We embed into your team to own SEO and AEO growth.
                  </h2>
                  <p className="mb-6 text-gray-600">
                    Work directly with an AI researcher who&apos;s built systems
                    using LLMs and a growth marketer that&apos;s helped grow B2B
                    companies to over $20m in ARR.
                  </p>
                  <div className="flex items-center gap-2">
                    <img
                      alt="Liam Dunne"
                      loading="lazy"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      src="/images/people/liam-dunne.png"
                    />
                    <img
                      alt="Ben Moore"
                      loading="lazy"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover grayscale transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      src="/images/people/ben-moore.png"
                    />
                    <div className="text-xs text-gray-500">
                      <div className="font-medium text-gray-700">
                        Liam &amp; Ben
                      </div>
                      <div>Co-founders</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: quote card */}
              <div className="relative rounded-sm border border-gray-200 bg-gray-50 p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-4">
                  <img
                    alt="Passion.io"
                    loading="lazy"
                    width={120}
                    height={28}
                    className="h-7 w-auto object-contain"
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/62260092822c4015dfc0a3b8_Passion.io%20Logo%20White%20text%201.svg"
                  />
                  <div className="h-8 w-px bg-gray-300" />
                </div>
                <div className="mb-6">
                  <p className="font-mono text-sm text-gray-500">
                    / Creator monetization platform
                  </p>
                </div>
                <div className="mb-6">
                  <p className="leading-relaxed text-gray-700">
                    &ldquo;99% of agencies suck... But you guys do not.{' '}
                    <span className="bg-orange-100 px-1 font-medium text-gray-900">
                      1 month of working with you, and our referrals from
                      ChatGPT are up 29%
                    </span>
                    &rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    alt="Dan Harvey"
                    loading="lazy"
                    width={48}
                    height={48}
                    className="flex-shrink-0 rounded-full"
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/1751645913287%20(1).jpeg"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Dan Harvey
                    </div>
                    <div className="text-sm tracking-wide text-gray-500 uppercase">
                      Co-founder
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
