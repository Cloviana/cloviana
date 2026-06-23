'use client';

import { Check, Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import { Audit, SentimentClaim } from '@/features/audit';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type SentimentAudit = Pick<Audit, 'domain' | 'brandName' | 'sentiment'>;

type SentimentProps = {
  className?: string;
  audit: SentimentAudit;
};

type ClaimGroupProps = {
  claims: SentimentClaim[];
  percent: number;
  selectedClaim: SentimentClaim | null;
  onSelect: (claim: SentimentClaim) => void;
};

type ResponsePanelProps = {
  response:
    | NonNullable<SentimentAudit['sentiment']>['responses'][number]
    | undefined;
  processedText: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  'chatgpt' | 'google_aio',
  { label: string; icon: string }
> = {
  chatgpt: { label: 'ChatGPT', icon: '/logos/chatgpt-icon.svg' },
  google_aio: { label: 'Google AIO', icon: '/logos/google-aio-icon.svg' },
};

const BLUR_PX = [0, 2, 4, 6];
const BLUR_OPACITY = [1, 0.7, 0.4, 0.2];
const VISIBLE_THRESHOLD = 3;

const MARKDOWN_COMPONENTS: React.ComponentProps<
  typeof ReactMarkdown
>['components'] = {
  mark: ({ children, className }) => (
    <mark
      className={cn(
        'rounded px-0.5 text-stone-900',
        className === 'negative' ? 'bg-red-200/60' : 'bg-green-200/60',
      )}
    >
      {children}
    </mark>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-[14px] leading-7 text-stone-600">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 font-semibold text-stone-800">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 font-semibold text-stone-800">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-sm font-semibold text-stone-800">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-stone-600">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-stone-600">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-stone-800">{children}</strong>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSentimentLevel(positivePercent: number): string {
  if (positivePercent >= 70) return 'good';
  if (positivePercent >= 40) return 'mixed';
  return 'bad';
}

function injectHighlight(
  text: string,
  sourceText: string,
  sentiment: 'positive' | 'negative',
): string {
  if (!sourceText.trim()) return text;
  const escaped = sourceText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(escaped),
    `<mark class="${sentiment}">${sourceText}</mark>`,
  );
}

function claimKey(claim: SentimentClaim): string {
  return claim.responseId + claim.label;
}

function isSameClaim(a: SentimentClaim | null, b: SentimentClaim): boolean {
  return a?.responseId === b.responseId && a?.label === b.label;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ClaimCardProps = {
  claim: SentimentClaim;
  index: number;
  isSelected: boolean;
  onClick: () => void;
};

const ClaimCard = ({ claim, index, isSelected, onClick }: ClaimCardProps) => {
  const isNegative = claim.sentiment === 'negative';
  const lvl = Math.min(Math.max(0, index - VISIBLE_THRESHOLD + 1), 3);

  return (
    <button
      onClick={onClick}
      style={
        lvl > 0
          ? { filter: `blur(${BLUR_PX[lvl]}px)`, opacity: BLUR_OPACITY[lvl] }
          : undefined
      }
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-left text-sm transition-all',
        isSelected ? 'ring-foreground ring-1' : 'hover:border-foreground/40',
      )}
    >
      {isNegative ? (
        <X strokeWidth={3} size={13} className="text-destructive shrink-0" />
      ) : (
        <Check strokeWidth={3} size={13} className="text-success shrink-0" />
      )}
      <span
        className={cn(isSelected ? 'text-foreground' : 'text-foreground-light')}
      >
        {claim.label}
      </span>
    </button>
  );
};

const ClaimGroup = ({
  claims,
  percent,
  selectedClaim,
  onSelect,
}: ClaimGroupProps) => {
  if (!claims.length) return null;

  const isNegative = claims[0].sentiment === 'negative';

  return (
    <div className="space-y-3">
      <p
        className={cn(
          'font-medium',
          isNegative ? 'text-destructive' : 'text-success',
        )}
      >
        {percent.toFixed(0)}% {isNegative ? 'Negative' : 'Positive'}
      </p>
      <div className="flex flex-wrap gap-2">
        {claims.map((claim, i) => (
          <ClaimCard
            key={claimKey(claim)}
            claim={claim}
            index={i}
            isSelected={isSameClaim(selectedClaim, claim)}
            onClick={() => onSelect(claim)}
          />
        ))}
      </div>
    </div>
  );
};

const ResponsePanel = ({
  response,
  processedText,
  panelRef,
}: ResponsePanelProps) => {
  const platform = response?.platform
    ? PLATFORM_CONFIG[response.platform]
    : null;

  if (!response) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-tl-2xl border border-stone-200 bg-stone-50">
        <p className="text-[13px] text-stone-400">
          Select a claim to view the response
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[380px] flex-col overflow-hidden rounded-tl-2xl border border-r-0 border-b-0 border-stone-200 bg-stone-50">
      {/* Search bar */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-stone-200 bg-stone-100/50 px-[18px] py-[14px]">
        <Search size={14} className="shrink-0 text-stone-400" />
        <span className="line-clamp-1 text-[13px] text-stone-600">
          {response.prompt}
        </span>
      </div>

      {/* Scrollable answer */}
      <div ref={panelRef} className="flex-1 overflow-y-auto px-5 py-[18px]">
        {platform && (
          <div className="mb-2.5 flex items-center gap-1.5">
            {}
            <img
              src={platform.icon}
              alt={platform.label}
              width={16}
              height={16}
            />
            <span className="text-[11px] font-semibold tracking-[0.06em] text-stone-400 uppercase">
              Answer
            </span>
          </div>
        )}
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={MARKDOWN_COMPONENTS}
        >
          {processedText}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Sentiment = ({ className, audit }: SentimentProps) => {
  const { brandName, sentiment } = audit;

  const claims = sentiment?.claims ?? [];
  const responses = sentiment?.responses ?? [];
  const positivePercent = sentiment?.positivePercent ?? 0;
  const negativePercent = sentiment?.negativePercent ?? 0;

  const negativeClaims = claims.filter((c) => c.sentiment === 'negative');
  const positiveClaims = claims.filter((c) => c.sentiment === 'positive');

  const [selectedClaim, setSelectedClaim] = useState<SentimentClaim | null>(
    claims[0] ?? null,
  );
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedResponse = responses.find(
    (r) => r.id === selectedClaim?.responseId,
  );
  const sentimentLevel = getSentimentLevel(positivePercent);

  const processedText =
    selectedResponse && selectedClaim?.sourceText
      ? injectHighlight(
          selectedResponse.text,
          selectedClaim.sourceText,
          selectedClaim.sentiment,
        )
      : (selectedResponse?.text ?? '');

  useEffect(() => {
    const panel = panelRef.current;
    const mark = panel?.querySelector('mark');
    if (!panel || !mark) return;
    const panelRect = panel.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    panel.scrollBy({
      top:
        markRect.top -
        panelRect.top -
        panel.clientHeight / 2 +
        mark.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [selectedClaim]);

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <h2 className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl">
            What AI says when it mentions you
          </h2>
          <p className="text-foreground-light w-fit lg:max-w-[50ch] lg:pt-2 lg:text-lg">
            Getting mentioned isn't enough. How AI frames {brandName} shapes
            whether buyers follow through.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Claims */}
          <div className="w-full space-y-8 lg:w-1/2">
            <h3 className="text-lg font-medium">
              {brandName} has {sentimentLevel} sentiment
            </h3>
            <div className="space-y-6">
              <ClaimGroup
                claims={negativeClaims}
                percent={negativePercent}
                selectedClaim={selectedClaim}
                onSelect={setSelectedClaim}
              />
              <ClaimGroup
                claims={positiveClaims}
                percent={positivePercent}
                selectedClaim={selectedClaim}
                onSelect={setSelectedClaim}
              />
            </div>
          </div>

          {/* Response panel */}
          <div className="bg-surface border-stone-150 w-full overflow-hidden rounded-2xl border p-8 pr-0 pb-0 lg:w-1/2">
            <ResponsePanel
              response={selectedResponse}
              processedText={processedText}
              panelRef={panelRef}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
