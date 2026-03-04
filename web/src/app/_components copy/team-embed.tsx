import { FC } from 'react';

import { cn } from '@/utils/cn';

interface TeamEmbedProps {
  className?: string;
}

export const TeamEmbed: FC<TeamEmbedProps> = ({ className }) => {
  return (
    <section className={cn('relative bg-white -mt-px', className)}>
      <div className="w-full flex justify-center">
        <div className="max-w-7xl w-full relative">
          <div className="px-2 sm:px-6 relative pb-12 sm:pb-16 lg:pb-20">
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px bg-gray-200" />
            <div className="hidden lg:block absolute left-0 right-0 bottom-0 h-px bg-gray-200" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16 lg:pt-20">
              {/* Left: headline + avatars */}
              <div className="flex items-center">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
                    We embed into your team to own SEO and AEO growth.
                  </h2>
                  <p className="text-gray-600 mb-6">
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
                      className="rounded-full w-9 h-9 object-cover transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      src="/images/people/liam-dunne.png"
                    />
                    <img
                      alt="Ben Moore"
                      loading="lazy"
                      width={36}
                      height={36}
                      className="rounded-full w-9 h-9 object-cover grayscale transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
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
              <div className="bg-gray-50 rounded-sm p-6 sm:p-8 border border-gray-200 relative">
                <div className="flex items-center gap-4 mb-4">
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
                  <p className="text-sm text-gray-500 font-mono">
                    / Creator monetization platform
                  </p>
                </div>
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    &ldquo;99% of agencies suck... But you guys do not.{' '}
                    <span className="bg-orange-100 text-gray-900 px-1 font-medium">
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
                    className="rounded-full flex-shrink-0"
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/1751645913287%20(1).jpeg"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Dan Harvey
                    </div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide">
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
