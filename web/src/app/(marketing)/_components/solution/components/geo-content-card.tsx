'use client';

import { useEffect, useState } from 'react';

const SEGMENTS: { text: string; citable: boolean }[] = [
  { text: 'Payment reconciliation software', citable: false },
  {
    text: ' automates the matching of transaction records across banking systems, payment processors, and internal ledgers',
    citable: true,
  },
  {
    text: '. Finance teams use it to identify discrepancies, close books faster, and reduce manual spreadsheet work. ',
    citable: false,
  },
  {
    text: 'The software ingests data from multiple sources and applies rules to surface unmatched transactions',
    citable: true,
  },
  {
    text: '. It is commonly used by payment companies, neobanks, marketplaces, and finance teams operating at scale. ',
    citable: false,
  },
  {
    text: 'Real-time reconciliation helps teams catch revenue leakage before it reaches month-end reporting',
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
    <div className="w-full max-w-[550px] overflow-y-auto rounded-[4px] border bg-white p-3 sm:p-[26px]">
      {/* Badge */}
      <div className="mb-5 flex items-center gap-2">
        <div className="h-2.5 w-2.5" style={{ backgroundColor: '#7A7368' }} />
        <span
          className="text-[10px] font-semibold tracking-widest uppercase sm:text-[13px]"
          style={{ color: '#7A7368', fontFamily: 'ABCDiatype, sans-serif' }}
        >
          {activeCount} / {CITABLE_COUNT} citable statements
        </span>
      </div>

      {/* Title */}
      <h4
        className="mb-1.5 text-[1.1rem] leading-[1.2] text-black sm:text-[1.5rem]"
        style={{ fontFamily: 'Iowan, serif' }}
      >
        What is Payment Reconciliation Software?
      </h4>

      {/* Body */}
      <p
        className="text-[12px] leading-normal sm:text-[15px]"
        style={{ color: '#675E56', fontFamily: 'Iowan, serif' }}
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
                backgroundImage:
                  'linear-gradient(rgba(168, 211, 240, 0.55), rgba(168, 211, 240, 0.55))',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
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
