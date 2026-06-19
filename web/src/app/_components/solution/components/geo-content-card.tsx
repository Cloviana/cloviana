'use client';

import { useEffect, useState } from 'react';

const SEGMENTS: { text: string; citable: boolean }[] = [
  { text: 'Payment reconciliation software', citable: false },
  {
    text: ' automates the matching of transaction records across banking systems, payment processors, and internal ledgers',
    citable: true,
  },
  {
    text: '. Finance teams relying on manual processes spend between 40 and 80 hours per month reconciling accounts. ',
    citable: false,
  },
  {
    text: 'Automated reconciliation reduces month-end close time by up to 60% while improving accuracy across all payment types',
    citable: true,
  },
  {
    text: '. The software ingests data from multiple sources, then applies rule-based matching to surface discrepancies. ',
    citable: false,
  },
  {
    text: 'Unresolved discrepancies represent a direct revenue leakage risk for payment companies and neobanks',
    citable: true,
  },
  {
    text: '. Companies operating at scale process millions of transactions daily, making ',
    citable: false,
  },
  {
    text: 'real-time reconciliation a critical operational requirement for finance teams',
    citable: true,
  },
  { text: '.', citable: false },
];

const CITABLE_COUNT = SEGMENTS.filter((s) => s.citable).length;

const STEP_DELAY = 1300;
const PAUSE_DELAY = 2400;
const START_DELAY = 800;
const RESET_DELAY = 500;

export default function GEOContentCard() {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const advance = (count: number) => {
      setActiveCount(count);
      const next = count < CITABLE_COUNT ? count + 1 : 0;
      const delay =
        count === CITABLE_COUNT
          ? PAUSE_DELAY
          : count === 0
            ? RESET_DELAY
            : STEP_DELAY;
      timeoutId = setTimeout(() => advance(next), delay);
    };

    timeoutId = setTimeout(() => advance(1), START_DELAY);
    return () => clearTimeout(timeoutId);
  }, []);

  let citableIdx = 0;

  return (
    <div className="border-border w-full rounded-[4px] border bg-white p-6 lg:p-7">
      {/* Badge */}
      <div className="mb-4 flex items-center gap-1.5">
        <div className="h-2 w-2 flex-shrink-0 bg-[#4a8ab5]" />
        <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#4a8ab5] uppercase">
          {activeCount} / {CITABLE_COUNT} citable statements
        </span>
      </div>

      {/* Title */}
      <h4
        className="mb-3 text-[17px] leading-snug font-normal text-black"
        style={{ fontFamily: 'Georgia, Iowan, serif' }}
      >
        What is Payment Reconciliation Software?
      </h4>

      {/* Body */}
      <p
        className="m-0 text-[13.5px] leading-[1.75]"
        style={{ color: '#675E56', fontFamily: 'Georgia, Iowan, serif' }}
      >
        {SEGMENTS.map((seg, i) => {
          if (!seg.citable) return <span key={i}>{seg.text}</span>;

          citableIdx++;
          const isActive = citableIdx <= activeCount;

          return (
            <span
              key={i}
              style={{
                borderRadius: 2,
                backgroundImage: 'linear-gradient(#d0e7f7, #d0e7f7)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left center',
                backgroundSize: isActive ? '100% 100%' : '0% 100%',
                transition: 'background-size 420ms ease-out',
                padding: '0.05em 0.15em',
                margin: '0 -0.15em',
                WebkitBoxDecorationBreak: 'clone',
                boxDecorationBreak: 'clone' as never,
              }}
            >
              {seg.text}
            </span>
          );
        })}
      </p>
    </div>
  );
}
