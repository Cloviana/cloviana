'use client';

import Image from 'next/image';
import { FC, useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

interface ProblemProps {
  className?: string;
}

interface NotificationProps {
  title: string;
  body: string;
  time?: string;
  className?: string;
}

const Notification: FC<NotificationProps> = ({
  title,
  body,
  time,
  className,
}) => (
  <div
    className={cn(
      'w-full rounded-2xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-md',
      'flex items-start gap-3 px-4 py-3 transition-all duration-500 ease-in-out will-change-transform',
      className,
    )}
  >
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100/30 p-2">
      <img src="/logo-icon.png" className="size-full" alt="Logo" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-medium">{title}</span>
        {time ? (
          <span className="text-foreground/50 text-sm font-normal">{time}</span>
        ) : null}
      </div>
      <p className="text-foreground/80 mt-0.5 line-clamp-1 text-[15px]">
        {body}
      </p>
    </div>
  </div>
);

export const Problem: FC<ProblemProps> = ({ className }) => {
  const [index, setIndex] = useState(0);

  const notifications = [
    {
      title: 'Cloviana',
      body: 'Published to Shopify Blog — “Top 10 Microscope Kits"',
      time: '11:23 AM',
    },
    {
      title: 'Cloviana',
      body: 'Internal links added to 12 product pages',
      time: '3:05 PM',
    },
    {
      title: 'Cloviana',
      body: 'Rank watch: 6 new top-10 positions this week',
      time: '7:20 PM',
    },
  ];

  useEffect(() => {
    const id = setInterval(
      () => setIndex((p) => (p + 1) % notifications.length),
      2000,
    );
    return () => clearInterval(id);
  }, [notifications.length]);

  return (
    <section
      className={cn(
        'padding-global padding-section-medium bg-white',
        className,
      )}
    >
      <div className="container flex flex-col gap-6 px-0 md:flex-row">
        <div className="relative aspect-[5/4] w-full flex-1 overflow-hidden rounded-lg md:max-w-[550px] md:min-w-[450px]">
          <Image
            src="https://cloviana-assets.azureedge.net/assets/problem-banner.png"
            alt="Problem Banner"
            width={1200}
            height={960}
            placeholder="blur"
            blurDataURL="data:image/webp;base64,UklGRqYAAABXRUJQVlA4WAoAAAAQAAAACQAABwAAQUxQSBcAAAABF9D/iAgoaBsFuhfwrxoJEf1P4vAgAgBWUDggaAAAAPABAJ0BKgoACAABQCYliAJ0AQ56pqAgAAD+56//bqeIP3P9zPpfv0x2bsuPZlAu0UVNG6L8/cUOt8029+D+AV7XPQ4J/jZWJUdV1KAN73N3Wp+8T2I/IOH7Gom71hgcZ1tTT7e3LAAA"
            className="h-full w-full rounded-lg object-cover"
            sizes="(max-width: 768px) 100vw, 550px"
          />

          <div className="pointer-events-none absolute inset-0 flex items-end justify-start p-3 sm:p-4">
            <div className="relative h-[172px] w-[420px] max-w-full origin-bottom-left">
              {notifications.map((n, i) => {
                const pos =
                  (i - index + notifications.length) % notifications.length;
                return (
                  <Notification
                    key={i}
                    {...n}
                    className={cn(
                      'absolute right-0 bottom-0 left-0 mx-auto transition-all duration-500',
                      pos === 0 && 'z-30 translate-y-0 scale-100 opacity-100',
                      pos === 1 &&
                        'z-20 -translate-y-[15%] scale-95 opacity-95',
                      pos === 2 &&
                        'z-10 -translate-y-[30%] scale-90 opacity-90',
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4">
          <h2 className="text-2xl font-medium">
            SEO feels expensive — and unclear
          </h2>
          <p className="text-base font-light">
            Merchants pay big retainers and wait months for vague reports and
            slow content, with little link to sales. Search is changing fast:
            SEO still matters, but now you must show up in AI answers (AEO) and
            generative engines (GEO). Cloviana makes it simple—we plan, write,
            and publish so you see wins in search and LLM answers, without
            chasing agencies.{' '}
          </p>
        </div>
      </div>
    </section>
  );
};
