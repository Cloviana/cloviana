import { FC } from 'react';

import { cn } from '@/utils/cn';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  return (
    <section
      className={cn(
        'relative flex min-h-[70vh] items-center overflow-hidden bg-white pt-20 pb-8 sm:min-h-[80vh] sm:pt-32 sm:pb-16',
        className,
      )}
    >
      <div className="flex w-full justify-center">
        <div className="relative w-full max-w-7xl">
          <div className="relative px-2 sm:px-6">
            <div
              className="absolute inset-0 hidden bg-no-repeat sm:block"
              style={{
                backgroundImage:
                  'url(https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Frame%202147230013.svg)',
                backgroundPosition: 'center top',
                backgroundSize: 'cover',
              }}
            />
            <div
              className="absolute inset-0 bg-no-repeat sm:hidden"
              style={{
                backgroundImage:
                  'url(https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Frame%202147230013.svg)',
                backgroundPosition: 'center center',
                backgroundSize: '200% 140%',
              }}
            />
            <div
              className="absolute top-0 left-0 z-10 hidden w-px bg-gray-200 lg:block"
              style={{ height: 'calc(100% - 100px)' }}
            />
            <div
              className="absolute top-0 right-0 z-10 hidden w-px bg-gray-200 lg:block"
              style={{ height: 'calc(100% - 100px)' }}
            />
            <div className="absolute top-0 right-0 left-0 z-10 hidden h-px bg-gray-200 lg:block" />

            <div className="relative z-20 mx-auto max-w-4xl px-4 py-8 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
              <h1 className="mb-4 text-[1.8rem] leading-[1.15] font-bold tracking-tight text-white sm:mb-6 sm:text-[3.25rem] sm:leading-[1.1] lg:text-[3.75rem]">
                Organic search agency built for the AI era. Trusted by
                hypergrowth B2B companies.
              </h1>
              <p className="mx-auto mb-6 max-w-3xl px-2 text-sm leading-6 text-white/90 sm:mb-8 sm:px-0 sm:text-lg sm:leading-7 lg:text-xl">
                We combine SEO and AEO with a tested methodology, proprietary
                tools, and content structured for LLM retrieval.
              </p>
              <div className="mb-6 sm:mb-10">
                <a
                  href="https://calendly.com/liam-discoveredlabs/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-block cursor-pointer overflow-hidden rounded-sm border border-gray-300 bg-white px-6 py-3 font-mono text-xs tracking-wide text-gray-900 uppercase shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-lg sm:px-8 sm:py-4 sm:text-sm"
                >
                  <span className="absolute inset-0 h-full w-full">
                    <span className="absolute inset-0 h-full w-0 -skew-x-12 bg-gradient-to-r from-transparent via-orange-400/30 to-transparent transition-all duration-700 ease-out group-hover:w-full" />
                  </span>
                  <span className="relative flex items-center gap-2">
                    Speak with team
                  </span>
                </a>
              </div>

              <div>
                <p className="mb-3 font-mono text-[10px] font-semibold tracking-widest text-white/70 uppercase sm:mb-4 sm:text-xs">
                  Get mentioned in
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Group%201321316117%20(1).png"
                    alt="ChatGPT"
                    className="h-6 w-auto cursor-pointer drop-shadow-md transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:drop-shadow-lg sm:h-8"
                  />
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20385.png"
                    alt="Perplexity"
                    className="h-6 w-auto cursor-pointer drop-shadow-md transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:drop-shadow-lg sm:h-8"
                  />
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20386.png"
                    alt="Google"
                    className="h-6 w-auto cursor-pointer drop-shadow-md transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:drop-shadow-lg sm:h-8"
                  />
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20387.png"
                    alt="Claude"
                    className="h-6 w-auto cursor-pointer drop-shadow-md transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:drop-shadow-lg sm:h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
