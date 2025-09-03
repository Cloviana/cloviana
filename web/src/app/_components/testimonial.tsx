import { FC } from 'react';

import { cn } from '@/utils/cn';

interface TestimonialProps {
  className?: string;
}

export const Testimonial: FC<TestimonialProps> = ({ className }) => {
  return (
    <section
      className={cn(
        'padding-global padding-section-medium h-[70vh] bg-white',
        className,
      )}
    >
      <div className="container grid w-full grid-cols-3 items-start justify-center gap-6">
        <div className="col-span-1 overflow-hidden rounded">
          <img
            fetchPriority="high"
            src="/person/person-001.png"
            alt="Avatar"
            className="w-full object-cover"
          />
        </div>

        <div className="relative col-span-2 flex h-full flex-col gap-5">
          <img
            src="/logos/New Scientist_idGmamynOX_1.svg"
            className="w-36"
            alt="Testimonial Logo"
          />
          <blockquote className="relative max-w-4xl text-left">
            <p className="font-gambarino text-3xl leading-tight before:content-[open-quote] after:content-[close-quote] md:text-[36px]">
              Our agents are dramatically more efficient when using Copilot. In
              testing, agents using Copilot were able to close 31% more customer
              conversations daily, compared to agents not using Copilot.
            </p>
          </blockquote>
          <div className="relative flex flex-1 flex-col justify-end">
            <h5 className="font-medium">Tom Gray</h5>
            <p className="font-light">E-commerce Manager, New Scientist Shop</p>
          </div>
        </div>
      </div>
    </section>
  );
};
