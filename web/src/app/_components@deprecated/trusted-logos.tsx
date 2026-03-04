import { FC } from 'react';

import { cn } from '@/utils/cn';

interface TrustedLogosProps {
  className?: string;
}

export const TrustedLogos: FC<TrustedLogosProps> = ({ className }) => {
  return (
    <section className={cn('relative bg-white', className)}>
      <div className="flex w-full justify-center">
        <div className="relative w-full max-w-7xl">
          <div className="relative px-2 sm:px-6">
            <div className="absolute top-[52px] bottom-0 left-0 hidden w-px bg-gray-200 lg:block" />
            <div className="absolute top-[52px] right-0 bottom-0 hidden w-px bg-gray-200 lg:block" />

            <p className="py-4 text-center text-sm text-gray-500">
              Trusted by hypergrowth startups
            </p>

            <div className="relative">
              <div className="absolute top-0 -right-2 -left-2 hidden h-px bg-gray-200 sm:-right-6 sm:-left-6 lg:block" />
              <div className="absolute -right-2 bottom-0 -left-2 hidden h-px bg-gray-200 sm:-right-6 sm:-left-6 lg:block" />

              <div className="grid grid-cols-3">
                {/* Instantly */}
                <div className="relative flex items-center justify-center border-r border-gray-200 py-6">
                  <div className="group relative flex items-center gap-2">
                    <div className="relative h-6 w-20 sm:w-24">
                      <img
                        alt="Instantly logo"
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain object-center opacity-80"
                        src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/instantly-logo.svg"
                      />
                    </div>
                    <div className="cursor-pointer rounded-sm bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-300">
                      Review
                    </div>
                    {/* Tooltip */}
                    <div className="invisible absolute top-full left-1/2 z-50 mt-3 w-72 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <div className="relative rounded-lg bg-gray-900 p-5 text-white shadow-xl">
                        <div className="mb-4">
                          <img
                            src="https://cdn.prod.website-files.com/61477f2c24a826836f969afe/69543b5ded6bbdf3beed1a00_quote.svg"
                            alt=""
                            className="h-5 w-5 opacity-60"
                          />
                        </div>
                        <p className="text-[13px] leading-relaxed text-gray-300">
                          We&apos;re working with Discovered Labs and have
                          achieved excellent results. Highly recommend the teams
                          delivery - they consistently put out a higher volume
                          of content than the norm.
                        </p>
                        <div className="my-4 border-t border-dotted border-gray-600" />
                        <div className="flex items-center gap-3">
                          <img
                            alt="Liam Collins"
                            loading="lazy"
                            width={36}
                            height={36}
                            className="rounded-lg object-cover"
                            src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/liam-collins-instantly.jpeg"
                          />
                          <div>
                            <div className="text-[13px] font-semibold text-white">
                              Liam Collins
                            </div>
                            <div className="text-[13px] text-gray-400">
                              Head of Performance
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* incident.io */}
                <div className="relative flex items-center justify-center border-r border-gray-200 py-6">
                  <div className="relative h-6 w-3/4">
                    <img
                      alt="incident.io logo"
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain object-center opacity-80"
                      src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/wordmark-colour-dark.svg"
                    />
                  </div>
                </div>

                {/* Passion.io */}
                <div className="relative flex items-center justify-center py-6">
                  <div className="relative h-6 w-3/4">
                    <img
                      alt="Passion.io logo"
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain object-center opacity-80"
                      src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/62260092822c4015dfc0a3b8_Passion.io%20Logo%20White%20text%201.svg"
                    />
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
