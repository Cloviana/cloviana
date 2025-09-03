'use client';

import { FC, useState } from 'react';

import { Button } from '@/components/actions';
import { links } from '@/config/links';
import { cn } from '@/utils/cn';

import { HatchCard } from './hatch-card';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  const [email, setEmail] = useState('');

  const handleBookDemo = () => {
    if (!email) return;
    const calendlyUrl = `${links.demo}?email=${encodeURIComponent(email)}`;
    window.open(calendlyUrl, '_blank');
  };

  return (
    <section className={cn('relative w-full border-b', className)}>
      <div className="border-dashed-wide bg-background absolute top-0 right-0 left-0 z-0 h-[1.75rem] border-b" />
      <div className="border-dashed-wide bg-background absolute top-[1.75rem] right-0 left-0 z-0 h-[1.75rem] border-b" />
      <div className="border-dashed-wide bg-background absolute right-0 bottom-0 left-0 z-0 h-[1.75rem] border-t" />
      <div className="border-dashed-wide bg-background absolute right-0 bottom-[1.75rem] left-0 z-0 h-[1.75rem] border-t" />
      <div className="absolute inset-0 z-0 flex">
        <div className="h-full w-[11rem] border-r py-[3.5rem]">
          <HatchCard />
        </div>
        <div className="flex-1" />
        <div className="h-full w-[11rem] border-l py-[3.5rem]">
          <HatchCard />
        </div>
      </div>
      <div className="padding-global relative z-20 h-full">
        <div className="bg-background container h-full border-r border-l pt-[4rem]">
          <div className="mx-auto flex w-full flex-col items-center gap-6 text-center">
            <h1 className="max-w-[20ch] text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              The Modern Marketing Automation Platform
            </h1>
            <p className="max-w-[55ch] text-sm md:text-base">
              Conversion is the AI-native Marketing Automation Platform built
              for high-growth B2B businesses. Activate customer data, build
              custom journeys, and send beautiful emails to every single
              customer.
            </p>
            <div className="mt-5 flex w-full max-w-sm rounded-full border bg-white p-[2px] shadow-xs">
              <input
                className="flex-1 px-3 text-sm font-medium focus:outline-0"
                placeholder="What's your work email?"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleBookDemo}>Book a demo</Button>
            </div>
            <div className="mockup-window w-full !rounded-t-lg border">
              <div className="w-full border-t">
                <video
                  src="/hero-banner.mp4"
                  autoPlay
                  playsInline
                  muted
                  loop
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
