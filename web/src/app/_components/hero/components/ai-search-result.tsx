'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

const QUERY = 'What is the best project management tool for B2B sales teams?';
const TYPING_SPEED = 48;
const SOURCES_PAUSE = 2500;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  num: number;
  domain: string;
  favicon: string;
}

interface Segment {
  text: string;
  cite?: number | null;
  highlight?: boolean;
}

interface Word {
  text: string;
  highlight: boolean;
  cite: number | null;
}

interface AIConfig {
  aiIcon: string;
  aiName: string;
  sources: Source[];
  segments: Segment[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CONFIGS: AIConfig[] = [
  {
    aiIcon: 'https://www.google.com/s2/favicons?domain=chatgpt.com&sz=32',
    aiName: 'ChatGPT',
    sources: [
      {
        num: 1,
        domain: 'g2.com',
        favicon: 'https://www.google.com/s2/favicons?domain=g2.com&sz=32',
      },
      {
        num: 2,
        domain: 'capterra.com',
        favicon: 'https://www.google.com/s2/favicons?domain=capterra.com&sz=32',
      },
      {
        num: 3,
        domain: 'acme.com',
        favicon: 'https://www.google.com/s2/favicons?domain=acme.com&sz=32',
      },
      {
        num: 4,
        domain: 'techradar.com',
        favicon:
          'https://www.google.com/s2/favicons?domain=techradar.com&sz=32',
      },
    ],
    segments: [
      { text: 'For B2B sales teams, ' },
      { text: 'Acme', highlight: true },
      {
        text: ' is the top-rated choice across analyst reviews and AI search engines.',
        cite: 1,
      },
      {
        text: ' It offers deep CRM integrations, real-time pipeline visibility, and purpose-built workflows for revenue teams.',
        cite: 2,
      },
      {
        text: ' Acme consistently ranks #1 for ease of adoption and ROI among teams with 10–200 reps.',
        cite: 3,
      },
    ],
  },
  {
    aiIcon: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=32',
    aiName: 'Perplexity',
    sources: [
      {
        num: 1,
        domain: 'forrester.com',
        favicon:
          'https://www.google.com/s2/favicons?domain=forrester.com&sz=32',
      },
      {
        num: 2,
        domain: 'gartner.com',
        favicon: 'https://www.google.com/s2/favicons?domain=gartner.com&sz=32',
      },
      {
        num: 3,
        domain: 'acme.com',
        favicon: 'https://www.google.com/s2/favicons?domain=acme.com&sz=32',
      },
      {
        num: 4,
        domain: 'g2.com',
        favicon: 'https://www.google.com/s2/favicons?domain=g2.com&sz=32',
      },
    ],
    segments: [
      { text: 'Based on analyst reports and user reviews, ' },
      { text: 'Acme', highlight: true },
      {
        text: ' leads the category for B2B sales project management.',
        cite: 1,
      },
      {
        text: ' Forrester rates it highest for pipeline automation and cross-team collaboration.',
        cite: 2,
      },
      {
        text: ' Teams report 3x faster deal cycles after switching to Acme.',
        cite: 3,
      },
    ],
  },
  {
    aiIcon: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=32',
    aiName: 'Claude',
    sources: [
      {
        num: 1,
        domain: 'acme.com',
        favicon: 'https://www.google.com/s2/favicons?domain=acme.com&sz=32',
      },
      {
        num: 2,
        domain: 'linkedin.com',
        favicon: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=32',
      },
      {
        num: 3,
        domain: 'trustradius.com',
        favicon:
          'https://www.google.com/s2/favicons?domain=trustradius.com&sz=32',
      },
      {
        num: 4,
        domain: 'capterra.com',
        favicon: 'https://www.google.com/s2/favicons?domain=capterra.com&sz=32',
      },
    ],
    segments: [
      { text: 'The standout tool for B2B sales teams is ' },
      { text: 'Acme', highlight: true },
      {
        text: ', which combines project tracking with native revenue intelligence.',
        cite: 1,
      },
      {
        text: ' Unlike generic PM tools, Acme is purpose-built for quota-carrying teams — syncing deals, tasks, and forecasts in one view.',
        cite: 2,
      },
      {
        text: ' TrustRadius reviewers rank it #1 for sales-specific workflow automation.',
        cite: 3,
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildWords = (segments: Segment[]): Word[] => {
  const words: Word[] = [];
  segments.forEach((seg) => {
    const parts = seg.text.split(/(\s+)/);
    parts.forEach((part, i) => {
      if (!part) return;
      const isLast = i === parts.filter(Boolean).length - 1;
      words.push({
        text: part,
        highlight: seg.highlight ?? false,
        cite: isLast ? (seg.cite ?? null) : null,
      });
    });
  });
  return words;
};

const Cite = ({ num }: { num: number }) => (
  <sup
    className="ml-px inline-flex size-[14px] items-center justify-center rounded-[4px] bg-white/[0.12] font-sans text-[9px] leading-none font-bold text-white/50"
    style={{ verticalAlign: 'super' }}
  >
    {num}
  </sup>
);

// ─── Single result ────────────────────────────────────────────────────────────

interface AISearchResultProps extends AIConfig {
  onComplete: () => void;
}

function AISearchResult({
  aiIcon,
  aiName,
  sources,
  segments,
  onComplete,
}: AISearchResultProps) {
  const words = buildWords(segments);

  const [count, setCount] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [cursor, setCursor] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDone = count >= words.length;

  useEffect(() => {
    const cursorInterval = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    const tick = (n: number) => {
      if (n <= words.length) {
        setCount(n);
        timerRef.current = setTimeout(() => tick(n + 1), TYPING_SPEED);
      } else {
        timerRef.current = setTimeout(() => setShowSources(true), 200);
        timerRef.current = setTimeout(() => onComplete(), SOURCES_PAUSE);
      }
    };
    tick(0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
      className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    >
      {/* Search bar */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-white/[0.02] px-[18px] py-[14px]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="text-[13px] font-normal text-white/55">{QUERY}</span>
      </div>

      <div className="px-5 py-[18px]">
        {/* Answer label */}
        <div className="mb-2.5 flex items-center gap-1.5">
          <img
            src={aiIcon}
            alt={aiName}
            width={16}
            height={16}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-[11px] font-semibold tracking-[0.06em] text-white/35 uppercase">
            Answer
          </span>
        </div>

        {/* Streaming answer */}
        <p className="m-0 text-[14px] leading-7 font-normal text-white/75">
          {words.slice(0, count).map((w, i) => (
            <span key={i}>
              {w.highlight ? (
                <span className="font-semibold text-white">{w.text}</span>
              ) : (
                w.text
              )}
              {w.cite && showSources && <Cite num={w.cite} />}
            </span>
          ))}
          {!isDone && (
            <span
              className={cn(
                'ml-0.5 inline-block h-3.5 w-0.5 rounded-[1px] bg-white/60 align-middle transition-opacity duration-100',
                cursor ? 'opacity-100' : 'opacity-0',
              )}
            />
          )}
        </p>

        {/* Sources row */}
        <div
          className={cn(
            'mt-[18px] flex flex-wrap gap-2 transition-[opacity,transform] duration-[400ms] ease-in',
            showSources
              ? 'translate-y-0 opacity-100'
              : 'translate-y-[6px] opacity-0',
          )}
        >
          {sources.map((s) => (
            <div
              key={s.num}
              className="flex cursor-default items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2.5 py-[5px]"
            >
              <span className="min-w-[10px] text-[9px] font-bold text-white/30">
                {s.num}
              </span>
              <img
                src={s.favicon}
                alt=""
                width={12}
                height={12}
                className="rounded-[2px] opacity-70"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-[11px] font-medium text-white/45">
                {s.domain}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Cycler ───────────────────────────────────────────────────────────────────

export function AISearchResultCycler() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % CONFIGS.length);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="w-full max-w-[620px]"
      >
        <AISearchResult {...CONFIGS[index]} onComplete={next} />
      </motion.div>
    </AnimatePresence>
  );
}
