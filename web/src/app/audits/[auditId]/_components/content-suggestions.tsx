import Link from 'next/dist/client/link';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { links } from '@/config/links';
import { Audit, ContentType } from '@/features/audit';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentAudit = Pick<Audit, 'domain' | 'brandName' | 'contentSuggestions'>;

type ContentProps = {
  className?: string;
  auditId: string;
  audit: ContentAudit;
};

type SuggestionItemProps = {
  suggestion: NonNullable<ContentAudit['contentSuggestions']>[number];
  index: number;
  isLocked: boolean;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  problem_solution: 'Problem Solution',
  comparison: 'Comparison',
  how_to_guide: 'How-to Guide',
  listicle: 'Listicle',
  case_study: 'Case Study',
  faq: 'FAQ',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SuggestionItem = ({
  suggestion,
  index,
  isLocked,
}: SuggestionItemProps) => (
  <Fragment key={index}>
    <Item
      style={
        isLocked
          ? {
              filter: 'blur(5px)',
              opacity: 0.3,
              pointerEvents: 'none',
              userSelect: 'none',
            }
          : undefined
      }
    >
      <span className="text-foreground-lighter w-8 shrink-0 text-2xl tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <ItemContent>
        <span className="text-foreground-lighter text-sm">
          {CONTENT_TYPE_LABEL[suggestion.contentType]}
        </span>
        <ItemTitle className="text-lg">{suggestion.title}</ItemTitle>
        <ItemDescription>{suggestion.overview}</ItemDescription>
      </ItemContent>
    </Item>
    {!isLocked && <ItemSeparator />}
  </Fragment>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ContentSuggestions = ({
  className,
  auditId,
  audit,
}: ContentProps) => {
  const suggestions = audit.contentSuggestions ?? [];

  if (!suggestions.length) return null;

  const lockedCount = Math.max(0, suggestions.length - 1);

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <h2 className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl">
            What to publish to get cited
          </h2>
          <p className="text-foreground-light w-full lg:w-1/2 lg:max-w-[50ch] lg:pt-2 lg:text-lg">
            Based on what AI actually cites in your category, here&apos;s the
            content most likely to move your score.
          </p>
        </div>

        {/* List */}
        <div className="relative flex flex-col">
          {suggestions.map((suggestion, i) => (
            <SuggestionItem
              key={i}
              suggestion={suggestion}
              index={i}
              isLocked={i > 0}
            />
          ))}

          {/* CTA overlay */}
          {lockedCount > 0 && (
            <div className="absolute right-0 bottom-0 left-0 flex h-32 items-center justify-center">
              <Button
                onClick={() =>
                  gaEvent('book_demo', {
                    location: 'content_suggestions',
                    audit_id: auditId,
                  })
                }
                variant="outline"
                size="lg"
              >
                <Link href={links.demo}>
                  Get {lockedCount} more content ideas
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
