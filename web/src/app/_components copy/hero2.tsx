import { FC } from 'react';

import { cn } from '@/utils/cn';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  return (
    <section
      className={cn(
        'relative min-h-[70vh] sm:min-h-[80vh] flex items-center overflow-hidden pt-20 sm:pt-32 pb-8 sm:pb-16 bg-white',
        className,
      )}
    >
      <div className="w-full flex justify-center">
        <div className="max-w-7xl w-full relative">
          <div className="px-2 sm:px-6 relative">
            <div
              className="hidden sm:block absolute inset-0 bg-no-repeat"
              style={{
                backgroundImage:
                  'url(https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Frame%202147230013.svg)',
                backgroundPosition: 'center top',
                backgroundSize: 'cover',
              }}
            />
            <div
              className="sm:hidden absolute inset-0 bg-no-repeat"
              style={{
                backgroundImage:
                  'url(https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Frame%202147230013.svg)',
                backgroundPosition: 'center center',
                backgroundSize: '200% 140%',
              }}
            />
            <div
              className="hidden lg:block absolute left-0 top-0 w-px bg-gray-200 z-10"
              style={{ height: 'calc(100% - 100px)' }}
            />
            <div
              className="hidden lg:block absolute right-0 top-0 w-px bg-gray-200 z-10"
              style={{ height: 'calc(100% - 100px)' }}
            />
            <div className="hidden lg:block absolute left-0 right-0 h-px bg-gray-200 top-0 z-10" />

            <div className="relative z-20 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20 text-center">
              <h1 className="text-[1.8rem] sm:text-[3.25rem] lg:text-[3.75rem] font-bold tracking-tight text-white leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-6">
                Organic search agency built for the AI era. Trusted by
                hypergrowth B2B companies.
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl leading-6 sm:leading-7 text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto px-2 sm:px-0">
                We combine SEO and AEO with a tested methodology, proprietary
                tools, and content structured for LLM retrieval.
              </p>
              <div className="mb-6 sm:mb-10">
                <a
                  href="https://calendly.com/liam-discoveredlabs/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative font-mono rounded-sm border px-6 sm:px-8 py-3 sm:py-4 inline-block transition-all duration-200 cursor-pointer bg-white border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-gray-900 text-xs sm:text-sm uppercase tracking-wide shadow-sm hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full">
                    <span className="absolute inset-0 w-0 h-full bg-gradient-to-r from-transparent via-orange-400/30 to-transparent group-hover:w-full transition-all duration-700 ease-out -skew-x-12" />
                  </span>
                  <span className="relative flex items-center gap-2">
                    Speak with team
                  </span>
                </a>
              </div>

              <div>
                <p className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-widest text-white/70 mb-3 sm:mb-4">
                  Get mentioned in
                </p>
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/Group%201321316117%20(1).png"
                    alt="ChatGPT"
                    className="h-6 sm:h-8 w-auto drop-shadow-md transition-all duration-300 hover:-translate-y-1 hover:translate-x-1 hover:drop-shadow-lg cursor-pointer"
                  />
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20385.png"
                    alt="Perplexity"
                    className="h-6 sm:h-8 w-auto drop-shadow-md transition-all duration-300 hover:-translate-y-1 hover:translate-x-1 hover:drop-shadow-lg cursor-pointer"
                  />
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20386.png"
                    alt="Google"
                    className="h-6 sm:h-8 w-auto drop-shadow-md transition-all duration-300 hover:-translate-y-1 hover:translate-x-1 hover:drop-shadow-lg cursor-pointer"
                  />
                  <img
                    src="https://glimps-marketing.lon1.cdn.digitaloceanspaces.com/blog-images/image%20387.png"
                    alt="Claude"
                    className="h-6 sm:h-8 w-auto drop-shadow-md transition-all duration-300 hover:-translate-y-1 hover:translate-x-1 hover:drop-shadow-lg cursor-pointer"
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
