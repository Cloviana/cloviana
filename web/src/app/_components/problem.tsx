'use client';

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
      <p className="text-foreground/80 mt-0.5 text-[15px]">{body}</p>
    </div>
  </div>
);

export const Problem: FC<ProblemProps> = ({ className }) => {
  const [index, setIndex] = useState(0);

  const notifications = [
    {
      title: 'Cloviana',
      body: '+6 from Reminders, Notes, and Mail',
      time: '9:41 AM',
    },
    { title: 'Cloviana', body: 'You’ve a new message' },
    {
      title: 'Cloviana',
      body: 'Your account has been updated, go and check!',
      time: '9:41 AM',
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
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-lg md:w-[600px]">
          <img
            alt="Problem Banner"
            src="/problem-banner.png"
            className="h-full w-full object-cover"
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
                      'absolute right-0 bottom-0 left-0 mx-auto',
                      pos === 0 && 'z-30 translate-y-0 scale-100 opacity-100',
                      pos === 1 && 'z-20 -translate-y-4 scale-90 opacity-95',
                      pos === 2 && 'z-10 -translate-y-8 scale-85 opacity-90',
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4">
          <h2 className="text-2xl font-medium">
            Powering the world’s best product teams
          </h2>
          <p className="text-base font-light">
            Conversion is the AI-native Marketing Automation Platform built for
            high-growth B2B businesses. Activate customer data, build custom
            journeys, and send beautiful emails to every single customer.
          </p>
        </div>
      </div>
    </section>
  );
};
