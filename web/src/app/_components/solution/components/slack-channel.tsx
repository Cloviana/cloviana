'use client';

import Image from 'next/image';

const visitors = [
  {
    name: 'Marcus Lee',
    company: 'Northstar CRM',
    title: 'Head of Growth',
    location: 'San Francisco',
    intent: 'High intent',
    avatar: '/images/avatars/avatar-1.jpg',
  },
  {
    name: 'James Miller',
    company: 'Pilotbase',
    title: 'Founder',
    location: 'Austin',
    intent: 'New visitor',
    avatar: '/images/avatars/avatar-4.jpg',
  },
  {
    name: 'Priya Shah',
    company: 'Ledgerwise',
    title: 'Marketing Lead',
    location: 'New York',
    intent: 'Returned',
    avatar: '/images/avatars/avatar-3.jpg',
  },
  {
    name: 'Elena Torres',
    company: 'Beacon AI',
    title: 'Demand Gen',
    location: 'Toronto',
    intent: 'High intent',
    avatar: '/images/avatars/avatar-2.jpg',
  },
  {
    name: 'David Kim',
    company: 'OpsLayer',
    title: 'VP Revenue',
    location: 'London',
    intent: 'New visitor',
    avatar: '/images/avatars/avatar-5.jpg',
  },
];

export const SlackChannel = () => {
  return (
    <div className="border-border relative flex h-full w-full flex-col overflow-hidden rounded-tl-xl border-t border-l bg-white">
      <div className="border-border flex h-7 shrink-0 items-center gap-1.5 border-b bg-[#f6f6f4] px-3 sm:h-8">
        <span className="size-2.5 rounded-full bg-[#e0e0dc] sm:size-3" />
        <span className="size-2.5 rounded-full bg-[#e0e0dc] sm:size-3" />
        <span className="size-2.5 rounded-full bg-[#e0e0dc] sm:size-3" />
      </div>
      <div className="min-h-0 flex-1 bg-[#fbfbfa]">
        <div className="text-foreground flex h-full flex-col overflow-hidden text-[10px] sm:text-[11px]">
          <div className="border-border flex items-center gap-2 border-b bg-white px-3 py-2.5 sm:px-4 sm:py-3">
            <span className="text-foreground truncate text-[11px] font-semibold sm:text-xs">
              # inbound-visitors
            </span>
            <span className="bg-muted text-foreground-light rounded px-1.5 py-0.5 text-[9px] font-medium">
              Slack
            </span>
          </div>

          <div className="relative flex-1 overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="border-border flex size-7 shrink-0 items-center justify-center rounded-lg border bg-white sm:size-8">
                <Image src="/logo-icon.png" alt="" width={18} height={18} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
                  <p className="text-foreground truncate font-semibold">
                    Cloviana Visitor Intel
                  </p>
                  <span className="bg-muted text-foreground-light rounded px-1 py-0.5 text-[9px] font-medium">
                    APP
                  </span>
                  <span className="text-foreground-lighter shrink-0 text-[9px] sm:text-[10px]">
                    9:42 AM
                  </span>
                </div>

                <p className="text-foreground-light mt-1 line-clamp-2 text-[10px] leading-4 sm:text-[11px]">
                  5 new visitors matched your ideal customer profile.
                </p>

                <div className="visitor-signal-list relative mt-2.5 space-y-1.5 sm:mt-3 sm:space-y-2">
                  {visitors.map((visitor, index) => (
                    <div
                      key={visitor.name}
                      className={`visitor-signal-row visitor-signal-row-${index + 1}`}
                    >
                      <div className="visitor-signal-card border-border flex items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5">
                        <div className="visitor-anonymous-state absolute inset-x-2.5 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:inset-x-3 sm:gap-2.5">
                          <span className="size-6 shrink-0 rounded-full bg-[#ececea] sm:size-7" />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <span className="block h-2.5 w-20 rounded-full bg-[#e3e3df] sm:h-3 sm:w-24" />
                            <span className="block h-2 w-28 max-w-full rounded-full bg-[#ededeb] sm:h-2.5 sm:w-36" />
                            <span className="block h-2 w-16 rounded-full bg-[#f1f1ef] sm:h-2.5 sm:w-20" />
                          </div>
                        </div>

                        <div className="visitor-revealed-state absolute inset-x-2.5 top-1/2 flex -translate-y-1/2 items-center justify-between gap-2 sm:inset-x-3 sm:gap-3">
                          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                            <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-[#f7f7f5] sm:size-7">
                              <Image
                                src={visitor.avatar}
                                alt=""
                                fill
                                sizes="(min-width: 640px) 28px, 24px"
                                className="object-cover object-top"
                              />
                            </span>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                                <p className="text-foreground truncate font-medium">
                                  {visitor.name}
                                </p>
                              </div>
                              <p className="text-foreground-light mt-0.5 truncate">
                                {visitor.title} at {visitor.company}
                              </p>
                              <p className="text-foreground-lighter mt-0.5 truncate text-[10px]">
                                {visitor.location}
                              </p>
                            </div>
                          </div>

                          <button
                            tabIndex={-1}
                            className="border-border text-foreground flex shrink-0 items-center gap-1.5 rounded-[3px] border bg-white px-1.5 py-1 text-[9px] font-medium sm:px-2 sm:text-[10px]"
                          >
                            <span className="whitespace-nowrap">
                              Connect on LinkedIn
                            </span>
                            <Image
                              src="/logos/linkedin-logo.svg"
                              alt=""
                              width={13}
                              height={13}
                              className="rounded-[2px]"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#fbfbfa] to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};
