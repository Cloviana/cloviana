import { FC } from 'react';

import { cn } from '@/utils/cn';

interface TestimonialProps {
  className?: string;
}

export const Testimonial: FC<TestimonialProps> = ({ className }) => {
  return (
    <section
      className={cn(
        'padding-global padding-section-medium bg-white pt-0',
        className,
      )}
    >
      <div className="container flex w-full flex-col items-stretch gap-6 md:flex-row">
        <div className="aspect-[3/4] overflow-hidden rounded md:aspect-auto md:w-1/3">
          <img
            fetchPriority="high"
            src="/person/person-001.png"
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col gap-5">
          <img
            src="/logos/New Scientist_idGmamynOX_1.svg"
            className="w-36"
            alt="Testimonial Logo"
          />
          <blockquote className="relative max-w-4xl text-left">
            <p className="font-gambarino text-xl leading-tight before:content-[open-quote] after:content-[close-quote] md:text-3xl md:text-[36px]">
              Cloviana helps us publish faster and rank for the terms that
              matter. Setup was quick, the tone is on brand, and we can see the
              lift in organic traffic.
            </p>
          </blockquote>
          <div className="relative mt-auto">
            <h5 className="font-medium">Tom Gray</h5>
            <p className="font-light">E-commerce Manager, New Scientist Shop</p>
          </div>
        </div>
      </div>
    </section>
  );
};
