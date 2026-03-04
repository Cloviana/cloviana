import { FC } from 'react';

import { cn } from '@/utils/cn';

interface TrustedLogosProps {
  className?: string;
}

export const TrustedLogos: FC<TrustedLogosProps> = ({ className }) => {
  return (
    <section className={cn('relative bg-white', className)}>
      <div className="w-full flex justify-center">
        <div className="max-w-7xl w-full relative">
          <div className="px-2 sm:px-6 relative">
            <div className="hidden lg:block absolute left-0 top-[52px] bottom-0 w-px bg-gray-200" />
            <div className="hidden lg:block absolute right-0 top-[52px] bottom-0 w-px bg-gray-200" />

            <p className="text-sm text-gray-500 text-center py-4">
              Trusted by hypergrowth startups
            </p>

            <div className="relative">
              <div className="hidden lg:block absolute -left-2 sm:-left-6 -right-2 sm:-right-6 top-0 h-px bg-gray-200" />
              <div className="hidden lg:block absolute -left-2 sm:-left-6 -right-2 sm:-right-6 bottom-0 h-px bg-gray-200" />

              <div className="grid grid-cols-3">
                {/* Instantly */}
                <div className="relative flex items-center justify-center py-6 border-r border-gray-200">
                  <div className="group relative flex items-center gap-2">
                    <div className="relative h-6 w-20 sm:w-24">
                      <img
                        alt="Instantly logo"
                        loading="lazy"
                        className="object-contain object-center opacity-80 absolute inset-0 w-full h-full"
                        src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/instantly-logo.svg"
                      />
                    </div>
                    <div className="bg-gray-200 text-gray-700 text-[9px] font-medium px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-gray-300 transition-colors whitespace-nowrap">
                      Review
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="relative bg-gray-900 text-white rounded-lg p-5 shadow-xl">
                        <div className="mb-4">
                          <img
                            src="https://cdn.prod.website-files.com/61477f2c24a826836f969afe/69543b5ded6bbdf3beed1a00_quote.svg"
                            alt=""
                            className="w-5 h-5 opacity-60"
                          />
                        </div>
                        <p className="text-[13px] text-gray-300 leading-relaxed">
                          We&apos;re working with Discovered Labs and have
                          achieved excellent results. Highly recommend the teams
                          delivery - they consistently put out a higher volume of
                          content than the norm.
                        </p>
                        <div className="border-t border-dotted border-gray-600 my-4" />
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
                <div className="relative flex items-center justify-center py-6 border-r border-gray-200">
                  <div className="relative h-6 w-3/4">
                    <img
                      alt="incident.io logo"
                      loading="lazy"
                      className="object-contain object-center opacity-80 absolute inset-0 w-full h-full"
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
                      className="object-contain object-center opacity-80 absolute inset-0 w-full h-full"
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
