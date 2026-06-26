'use client';

import { motion } from 'motion/react';
import { FC, useEffect, useRef, useState } from 'react';

type Notification = {
  id: number;
  message: string;
};

const NOTIFICATION_MESSAGES = [
  "Brand mentioned in G2's top CRM comparison thread.",
  'Guest post accepted by Capterra on CRM data hygiene.',
  'Contributed to r/CRM pipeline discussion. Top answer.',
  'Quora CRM buyer question answered and published.',
];

export const BrandMentionAlertPreview: FC = () => {
  const nextIdRef = useRef(1);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 0, message: NOTIFICATION_MESSAGES[0] },
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNotifications((currentNotifications) => {
        const nextId = nextIdRef.current;
        nextIdRef.current += 1;

        return [
          ...currentNotifications,
          {
            id: nextId,
            message:
              NOTIFICATION_MESSAGES[nextId % NOTIFICATION_MESSAGES.length],
          },
        ].slice(-3);
      });
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  const visibleNotifications = notifications.slice(-3);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute bottom-3 left-0 h-[180px] w-full overflow-visible">
        {visibleNotifications.map((notification, index) => {
          const stackPosition = visibleNotifications.length - index - 1;

          return (
            <div
              key={notification.id}
              className="absolute bottom-1.5 left-1/2 w-[calc(100%-0.75rem)] max-w-72 -translate-x-1/2"
              style={{ zIndex: 10 - stackPosition }}
            >
              <motion.div
                className="origin-bottom"
                initial={false}
                animate={{
                  y: stackPosition * -18,
                  scale: 1 - stackPosition * 0.07,
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <SlackNotification message={notification.message} />
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SlackNotification: FC<{ message: string }> = ({ message }) => (
  <div className="w-full overflow-hidden rounded-3xl bg-white shadow-[0_18px_44px_rgba(24,24,27,0.16)] ring-1 ring-zinc-950/8 outline-none">
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.85),rgba(244,244,245,0.42)_45%,rgba(255,255,255,0.72))]" />

      <div className="relative flex items-start gap-2.5 px-3 py-2.5">
        <img
          alt="Slack"
          className="pointer-events-none size-7 shrink-0 object-contain"
          src="/logos/Slack_Symbol_0.svg"
        />

        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-[13px] leading-none font-semibold tracking-[-0.015em] text-zinc-950">
            Cloviana
          </p>
          <p className="text-xs leading-snug font-medium text-zinc-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  </div>
);
