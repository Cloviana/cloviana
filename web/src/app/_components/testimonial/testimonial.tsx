'use client';

import React, { useRef } from 'react';
import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { useScrollControls } from './hooks/use-scroll-controlls';
import * as Avatar from '@radix-ui/react-avatar';
import { cva, VariantProps } from 'class-variance-authority';

const testimonialCardImgVariants = cva('size-full object-cover', {
  variants: {
    alignment: {
      top: 'object-top',
      center: 'object-center',
      bottom: 'object-bottom',
    },
  },
  defaultVariants: {
    alignment: 'center',
  },
});

type TestimonialCardImgVariants = VariantProps<
  typeof testimonialCardImgVariants
>;

interface Testimonial {
  avatar?: { url: string; alignment?: TestimonialCardImgVariants['alignment'] };
  displayName?: string;
  logo?: { url: string; height?: number | string };
  testimonial?: string;
  title?: string;
}

interface TestimonialProps extends React.HTMLAttributes<HTMLDivElement> {
  testimonials: Testimonial[];
}

interface ArrowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
}

function TestimonialCard({
  avatar,
  displayName,
  testimonial,
  title,
  logo,
}: Testimonial) {
  return (
    <div
      className={cn(
        'flex aspect-[5/4] w-[470px] flex-shrink-0 snap-start flex-col items-start gap-12 rounded-md border bg-surface-100/80 p-6 shadow transition-all hover:shadow-inner',
      )}
    >
      <img
        src={logo?.url}
        style={{ height: logo?.height ?? 24 }}
        alt={'logo'}
      />
      <div className="flex-1">
        <p className="text-[22px] font-medium">{testimonial}</p>
      </div>
      <div className="flex items-center gap-3">
        <Avatar.Root className="size-[48px] overflow-hidden rounded-full">
          <Avatar.Image
            fetchPriority="high"
            src={avatar?.url}
            alt={'Avatar'}
            className={cn(
              testimonialCardImgVariants({
                alignment: avatar?.alignment ?? undefined,
              }),
            )}
          />
          <Avatar.Fallback delayMs={0} />
        </Avatar.Root>
        <div className="flex flex-col gap-1">
          <h5 className="font-medium leading-tight text-foreground">
            {displayName}
          </h5>
          <p className="text-sm leading-tight text-foreground-light">{title}</p>
        </div>
      </div>
    </div>
  );
}

function ArrowButton({ icon, className, ...props }: ArrowButtonProps) {
  return (
    <button
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-md border text-foreground-light transition-all hover:bg-surface-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-70',
        className,
      )}
      {...props}
    >
      <GIcon name={icon} />
    </button>
  );
}

export function Testimonial({
  testimonials,
  className,
  ...props
}: TestimonialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canScrollLeft, canScrollRight, scrollBy } =
    useScrollControls(containerRef);

  return (
    <div className={cn('container', className)} {...props}>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-2">
          <h2 className="text-2xl font-medium md:text-3xl lg:text-4xl">
            How Shopify stores win with our AI SEO Agent (Beta)
          </h2>
          <p className="text-base text-foreground-light lg:text-lg">
            Solo founders and small teams in our beta program use our
            Shopify‑integrated AI SEO Agent to grow organic traffic and
            streamline SEO tasks.
          </p>
        </div>
        <div className="flex gap-3">
          <ArrowButton
            icon="arrow_back"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
          />
          <ArrowButton
            icon="arrow_forward"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
          />
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-hidden scroll-smooth"
      >
        {testimonials.map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
    </div>
  );
}
