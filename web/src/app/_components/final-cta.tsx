'use client';

import { FC, useState } from 'react';

import { Button } from '@/components/actions';
import { useBookDemo } from '@/hooks/use-book-demo';
import { cn } from '@/utils/cn';

interface FinalCTAProps {
  className?: string;
}

export const FinalCTA: FC<FinalCTAProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const bookDemo = useBookDemo();

  return (
    <section
      className={cn(
        className,
        "bg-[#21201c] bg-[url('https://cloviana-assets.azureedge.net/assets/dots-pattern.svg')] bg-center bg-repeat",
      )}
    >
      <div className="padding-global padding-section-medium">
        <div className="container flex h-[400px] items-center justify-center">
          <div className="mx-auto flex w-full flex-col items-center gap-6 text-center">
            <h1 className="max-w-[20ch] text-3xl text-white sm:text-5xl">
              Grow your traffic while you sleep
            </h1>
            <p className="max-w-[55ch] text-sm text-white">
              Turn keywords into customers with zero lift. Cloviana plans,
              writes, and publishes for you.
            </p>
            <div className="mt-5 flex w-full max-w-sm items-center gap-2 rounded-full border bg-white p-[2px] shadow">
              <input
                className="w-0 min-w-0 flex-1 truncate bg-transparent px-3 py-2 text-sm font-medium text-black outline-none placeholder:text-neutral-500"
                placeholder="What's your work email?"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="shrink-0 rounded-full"
                size="sm"
                onClick={() => bookDemo(email)}
              >
                Book a demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
