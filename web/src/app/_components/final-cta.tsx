'use client';

import { FC, useState } from 'react';

import { Button } from '@/components/actions';
import { links } from '@/config/links';
import { cn } from '@/utils/cn';

interface FinalCTAProps {
  className?: string;
}

export const FinalCTA: FC<FinalCTAProps> = ({ className }) => {
  const [email, setEmail] = useState('');

  const handleBookDemo = () => {
    if (!email) return;
    const calendlyUrl = `${links.demo}?email=${encodeURIComponent(email)}`;
    window.open(calendlyUrl, '_blank');
  };

  return (
    <section
      className={cn(
        className,
        "bg-[#21201c] bg-[url('/patterns/dots-pattern.svg')] bg-center bg-repeat",
      )}
    >
      <div className="padding-global padding-section-medium">
        <div className="container flex h-[400px] items-center justify-center">
          <div className="mx-auto flex w-full flex-col items-center gap-6 text-center">
            <h1 className="max-w-[20ch] text-3xl text-white sm:text-5xl">
              Turn Every Form Fill-Out Into Your Next Customer
            </h1>
            <p className="max-w-[55ch] text-sm text-white">
              Trigger personalized emails and actions based on real-time
              behavior, not static lists.
            </p>
            <div className="mt-5 flex w-full max-w-sm rounded-full border bg-white p-[2px] shadow">
              <input
                className="flex-1 px-3 text-sm font-medium focus:outline-0"
                placeholder="What's your work email?"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleBookDemo}>Book a demo</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
