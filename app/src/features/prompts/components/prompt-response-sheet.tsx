'use client';

import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Info,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, badgeVariants } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetPromptResponse } from '@/features/prompts/api/get-prompt-response';
import { DomainAvatar } from '@/features/prompts/components/avatar-stack';
import { ScoreBar } from '@/features/prompts/components/score-bar';
import { getEngineOption } from '@/features/prompts/options';
import type { PromptResponseDetail } from '@/features/prompts/types';
import { cn } from '@/utils/cn';
import { getFaviconUrl, normalizeDomain } from '@/utils/domain';

type PromptResponseSheetProps = {
  businessId: string;
  responseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CitationSource = PromptResponseDetail['sources'][number];

type Mention = PromptResponseDetail['mentions'][number];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isHttpUrl = (href: string) => /^https?:/i.test(href);

/* -------------------------------------------------------------------------- */
/*  Source pills                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Answers cite their sources as ordinary markdown links, so a link is matched
 * back to the stored citation by URL. Links the engine returned outside the
 * citation list still render as a pill, built from the URL's own host.
 */
function createSourceResolver(sources: CitationSource[]) {
  const byUrl = new Map(sources.map((source) => [source.url, source]));

  return (href: string): CitationSource => {
    const known = byUrl.get(href);
    if (known) return known;

    let domain = href;
    try {
      domain = new URL(href).hostname;
    } catch {
      /* keep the raw href — DomainAvatar falls back to initials. */
    }

    return { id: href, url: href, domain, title: null };
  };
}

/**
 * `DomainAvatar` tooltips itself with the domain, which is pure noise on a pill
 * that already spells the domain out beside it.
 */
function PillFavicon({
  domain,
  label,
  className,
}: {
  domain: string;
  label: string;
  className?: string;
}) {
  return (
    <Avatar
      className={cn('bg-surface size-3.5 shrink-0 rounded-full', className)}
    >
      <AvatarImage src={getFaviconUrl(domain)} alt="" />
      <AvatarFallback className="rounded-full text-[8px] font-medium">
        {label.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** Shared inline geometry: pills sit in running prose, so they align to it. */
const INLINE_PILL =
  'mx-0.5 max-w-56 translate-y-[0.1em] gap-1.5 align-baseline';

function SourcePill({ sources }: { sources: CitationSource[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lead] = sources;
  if (!lead) return null;

  const active = sources[Math.min(index, sources.length - 1)] ?? lead;
  const domain = normalizeDomain(lead.domain);
  const extra = sources.length - 1;

  const cancelClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const showPreview = () => {
    cancelClose();
    setOpen(true);
  };

  const schedulePreviewClose = () => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setIndex(0);
    }, 100);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setIndex(0);
      }}
    >
      <PopoverTrigger asChild>
        <a
          href={lead.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open source: ${lead.title ?? domain}`}
          onMouseEnter={showPreview}
          onMouseLeave={schedulePreviewClose}
          className={cn(
            badgeVariants({ variant: 'muted', size: 'sm' }),
            INLINE_PILL,
            'cursor-pointer transition-colors',
            open
              ? 'bg-foreground text-background'
              : 'hover:bg-muted-foreground/15',
          )}
        >
          <PillFavicon domain={domain} label={domain} />
          <span className="truncate">{domain}</span>
          {extra > 0 && <span className="opacity-60">+{extra}</span>}
        </a>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-0"
        onMouseEnter={cancelClose}
        onMouseLeave={schedulePreviewClose}
      >
        {sources.length > 1 && (
          <div className="border-border flex items-center justify-between border-b px-2 py-1.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Previous source"
                disabled={index === 0}
                onClick={() => setIndex((current) => current - 1)}
                className="hover:bg-muted rounded-md p-1 transition-colors disabled:opacity-30"
              >
                <ArrowLeft className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next source"
                disabled={index >= sources.length - 1}
                onClick={() => setIndex((current) => current + 1)}
                className="hover:bg-muted rounded-md p-1 transition-colors disabled:opacity-30"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
            <span className="text-muted-foreground text-[11px] tabular-nums">
              {index + 1}/{sources.length}
            </span>
          </div>
        )}

        <a
          href={active.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-muted/50 block px-4 py-3 transition-colors"
        >
          <div className="flex items-center gap-2">
            <PillFavicon
              domain={normalizeDomain(active.domain)}
              label={normalizeDomain(active.domain)}
              className="size-4"
            />
            <span className="truncate text-xs font-medium">
              {normalizeDomain(active.domain)}
            </span>
          </div>
          {active.title && (
            <div className="mt-2 text-sm font-semibold">{active.title}</div>
          )}
          <div className="text-muted-foreground mt-1 truncate text-xs">
            {active.url}
          </div>
        </a>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A citation is spotted by its `href`, not by the component react-markdown maps
 * it to. React renders parents before children, so when a block runs its walk
 * the link is still an unrendered element typed as the `a` component — matching
 * on the rendered output would never fire.
 */
const isCitationAnchor = (
  node: ReactNode,
): node is React.ReactElement<{ href: string }> =>
  isValidElement<{ href?: string }>(node) &&
  typeof node.props.href === 'string' &&
  isHttpUrl(node.props.href);

/**
 * Whether a node can sit between two citation links without ending the run.
 * Engines separate consecutive citations with a space, and occasionally a comma
 * or bracket — but never with words, so anything longer stays a boundary.
 */
const isCitationSeparator = (node: ReactNode) =>
  typeof node === 'string' &&
  (node.trim() === '' ||
    (node.trim().length <= 3 && /^[\s,;·|/()[\]–—-]+$/.test(node)));

/* -------------------------------------------------------------------------- */
/*  Brand mention highlighting                                                 */
/* -------------------------------------------------------------------------- */

type MentionHighlight = { phrase: string; mention: Mention };

/** Every spelling of every mentioned brand, longest first. */
function buildMentionHighlights(mentions: Mention[]): MentionHighlight[] {
  const entries = mentions.flatMap((mention) =>
    [mention.name, ...mention.aliases]
      .map((alias) => alias.trim())
      .filter((phrase) => phrase.length > 1)
      .map((phrase) => ({ phrase, mention })),
  );

  // "Zoho Expense" must win over a bare "Zoho", so the longer spelling is kept
  // when two brands share a prefix.
  const byPhrase = new Map<string, MentionHighlight>();
  for (const entry of entries.sort(
    (a, b) => b.phrase.length - a.phrase.length,
  )) {
    const key = entry.phrase.toLowerCase();
    if (!byPhrase.has(key)) byPhrase.set(key, entry);
  }

  return [...byPhrase.values()];
}

/**
 * Replaces the matched alias with the brand's canonical name, so an answer that
 * says "Supabase Inc." and one that says "supabase" read identically.
 */
function MentionPill({ mention }: { mention: Mention }) {
  return (
    <span
      className={cn(
        badgeVariants({ variant: 'primary', size: 'sm' }),
        INLINE_PILL,
      )}
    >
      <PillFavicon
        domain={normalizeDomain(mention.domain)}
        label={mention.name}
      />
      <span className="truncate">{mention.name}</span>
    </span>
  );
}

type MentionMatcher = (text: string, path: string) => ReactNode;

function createMentionMatcher(highlights: MentionHighlight[]): MentionMatcher {
  if (highlights.length === 0) return (text) => text;

  const lookup = new Map(
    highlights.map((highlight) => [highlight.phrase.toLowerCase(), highlight]),
  );
  const pattern = new RegExp(
    `(${highlights.map(({ phrase }) => escapeRegExp(phrase)).join('|')})`,
    'gi',
  );

  return (text, path) => {
    const parts = text.split(pattern);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      const highlight = lookup.get(part.toLowerCase());
      if (!highlight) return part;

      return (
        <MentionPill key={`${path}-${index}`} mention={highlight.mention} />
      );
    });
  };
}

/* -------------------------------------------------------------------------- */
/*  Markdown rendering                                                         */
/* -------------------------------------------------------------------------- */

type InlineRenderer = (children: ReactNode) => ReactNode;

/**
 * Walks a block's whole inline tree in one pass: bundles every run of adjacent
 * citation links into a single pill, so a sentence backed by four sources reads
 * as `reddit.com +3`, and swaps brand aliases for mention pills.
 *
 * The walk has to recurse. Links sitting inside emphasis are not siblings of the
 * block's other children, and scanning only the top level left them to render
 * themselves one chip at a time.
 */
function createInlineRenderer(
  matchMentions: MentionMatcher,
  resolve: (href: string) => CitationSource,
): InlineRenderer {
  const render = (children: ReactNode, path: string): ReactNode => {
    const nodes = Children.toArray(children);
    const rendered: ReactNode[] = [];
    let index = 0;

    while (index < nodes.length) {
      const node = nodes[index];

      if (isCitationAnchor(node)) {
        const byUrl = new Map<string, CitationSource>();
        let cursor = index;
        let lastAnchor = index;

        while (cursor < nodes.length) {
          const candidate = nodes[cursor];

          if (isCitationAnchor(candidate)) {
            // The same URL cited twice in a row is one source, not two.
            const { href } = candidate.props;
            if (!byUrl.has(href)) byUrl.set(href, resolve(href));
            lastAnchor = cursor;
          } else if (!isCitationSeparator(candidate)) {
            break;
          }

          cursor += 1;
        }

        rendered.push(
          <SourcePill
            key={`pill-${path}-${index}`}
            sources={[...byUrl.values()]}
          />,
        );
        index = lastAnchor + 1;
        continue;
      }

      if (typeof node === 'string') {
        rendered.push(
          <Fragment key={`text-${path}-${index}`}>
            {matchMentions(node, `${path}-${index}`)}
          </Fragment>,
        );
        index += 1;
        continue;
      }

      if (
        isValidElement<{ children?: ReactNode }>(node) &&
        node.props.children != null &&
        node.type !== MentionPill &&
        node.type !== SourcePill
      ) {
        rendered.push(
          cloneElement(
            node,
            undefined,
            render(node.props.children, `${path}-${index}`),
          ),
        );
        index += 1;
        continue;
      }

      rendered.push(node);
      index += 1;
    }

    return rendered;
  };

  return (children) => render(children, 'i');
}

function createMarkdownComponents(
  renderInline: InlineRenderer,
  resolve: (href: string) => CitationSource,
): Components {
  return {
    h1: ({ children }) => (
      <h1 className="mt-5 mb-2 text-[15px] font-semibold first:mt-0">
        {renderInline(children)}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-5 mb-2 text-sm font-semibold first:mt-0">
        {renderInline(children)}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-4 mb-2 text-sm font-semibold first:mt-0">
        {renderInline(children)}
      </h3>
    ),
    p: ({ children }) => (
      <p className="my-2.5 leading-6 first:mt-0 last:mb-0">
        {renderInline(children)}
      </p>
    ),
    // Left raw on purpose: the enclosing block's walk recurses into it. Calling
    // renderInline here too would process the same text twice.
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    // Fallback only: the block walk replaces citation links before they render,
    // so this fires for links it could not reach. The anchor text is dropped
    // because the pill already names the source.
    a: ({ children, href }) =>
      href && isHttpUrl(href) ? (
        <SourcePill sources={[resolve(href)]} />
      ) : (
        <>{children}</>
      ),
    ul: ({ children }) => (
      <ul className="my-3 ml-5 list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-3 ml-5 list-decimal space-y-1">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="leading-6">{renderInline(children)}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-muted-foreground/30 text-muted-foreground my-4 border-l-2 pl-4">
        {renderInline(children)}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="border-border my-5 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
          {children}
        </table>
      </div>
    ),
    tr: ({ children }) => (
      <tr className="border-border border-b last:border-b-0">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="bg-muted px-3.5 py-2.5 font-medium">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-3.5 py-2.5 align-top">{renderInline(children)}</td>
    ),
    pre: ({ children }) => (
      <pre className="border-border bg-muted/50 my-4 overflow-x-auto rounded-lg border p-4 text-xs">
        {children}
      </pre>
    ),
    code: ({ children, className }) => (
      <code
        className={
          className ?? 'bg-muted rounded px-1.5 py-0.5 font-mono text-[0.9em]'
        }
      >
        {children}
      </code>
    ),
    hr: () => <hr className="border-border my-6" />,
  };
}

/* -------------------------------------------------------------------------- */
/*  Sheet                                                                      */
/* -------------------------------------------------------------------------- */

/** Long citation lists bury the sections below them, so the rail shows a few. */
const SOURCE_PREVIEW_COUNT = 5;

function RailSection({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-1 flex items-center gap-2 px-2 text-xs font-medium">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {title}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`About ${title.toLowerCase()}`}
                className="hover:text-foreground -m-1 cursor-default p-1 transition-colors"
              >
                <Info className="size-3.5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
              {hint}
            </TooltipContent>
          </Tooltip>
        )}
      </h3>
      {children}
    </section>
  );
}

function RailEmpty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground px-2 text-xs">{children}</p>;
}

function ResponseContent({ response }: { response: PromptResponseDetail }) {
  const [showAllSources, setShowAllSources] = useState(false);
  const visibleSources = showAllSources
    ? response.sources
    : response.sources.slice(0, SOURCE_PREVIEW_COUNT);

  const matchMentions = useMemo(
    () => createMentionMatcher(buildMentionHighlights(response.mentions)),
    [response.mentions],
  );
  const resolveSource = useMemo(
    () => createSourceResolver(response.sources),
    [response.sources],
  );
  const markdownComponents = useMemo(
    () =>
      createMarkdownComponents(
        createInlineRenderer(matchMentions, resolveSource),
        resolveSource,
      ),
    [matchMentions, resolveSource],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <article className="min-w-0 flex-1 px-6 py-5 text-[13px] lg:min-h-0 lg:overflow-y-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {response.text ?? ''}
        </ReactMarkdown>
      </article>

      <aside className="border-border order-first shrink-0 space-y-6 border-b px-4 py-5 lg:order-none lg:min-h-0 lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-l">
        <RailSection
          icon={Building2}
          title="Brands"
          hint={
            <>
              Sentiment is scored only when the answer explicitly evaluates a
              brand. A dash means the brand was mentioned without a clearly
              positive or negative claim.
            </>
          }
        >
          {response.mentions.length === 0 ? (
            <RailEmpty>No tracked brands were named.</RailEmpty>
          ) : (
            <ul>
              {response.mentions.map((mention) => (
                <li
                  key={mention.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5"
                >
                  <PillFavicon
                    domain={normalizeDomain(mention.domain)}
                    label={mention.name}
                    className="size-4"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {mention.name}
                  </span>
                  {/* Null when the answer names the brand without evaluating
                      it — a listing is not sentiment. */}
                  {mention.sentiment === null ? (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      &ndash;
                    </span>
                  ) : (
                    <ScoreBar
                      value={mention.sentiment}
                      width={44}
                      label={`${mention.name} sentiment`}
                      className="shrink-0"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </RailSection>

        <RailSection
          icon={Waypoints}
          title="Query fan-outs"
          hint={
            <>
              The searches an engine ran behind your prompt. Some engines report
              theirs directly; where one doesn&rsquo;t, Cloviana derives them
              from the answer and its sources — those are marked{' '}
              <span className="font-medium">Inferred</span>.
            </>
          }
        >
          {response.fanOutQueries.length === 0 ? (
            <RailEmpty>This answer reported no fan-out queries.</RailEmpty>
          ) : (
            <ul>
              {response.fanOutQueries.map((fanOut) => (
                <li
                  key={fanOut.id}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 text-xs">{fanOut.query}</span>
                  {fanOut.inferred && (
                    <Badge variant="warning" size="xs" className="shrink-0">
                      Inferred
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </RailSection>

        <RailSection icon={Globe} title="Sources">
          {response.sources.length === 0 ? (
            <RailEmpty>This answer cited no sources.</RailEmpty>
          ) : (
            <>
              <ul>
                {visibleSources.map((source) => {
                  const domain = normalizeDomain(source.domain);

                  return (
                    <li key={source.id}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:bg-muted block rounded-md px-2 py-1.5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <PillFavicon
                            domain={domain}
                            label={source.title ?? domain}
                            className="size-4"
                          />
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">
                            {source.title ?? domain}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-0.5 pl-6 text-[11px] break-all">
                          {source.url.replace(/^https?:\/\/(www\.)?/i, '')}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
              {response.sources.length > SOURCE_PREVIEW_COUNT && (
                <button
                  type="button"
                  onClick={() => setShowAllSources((shown) => !shown)}
                  className="text-muted-foreground hover:text-foreground px-2 pt-1 text-xs transition-colors"
                >
                  {showAllSources
                    ? 'Show less'
                    : `View all ${response.sources.length}…`}
                </button>
              )}
            </>
          )}
        </RailSection>
      </aside>
    </div>
  );
}

export function PromptResponseSheet({
  businessId,
  responseId,
  open,
  onOpenChange,
}: PromptResponseSheetProps) {
  const responseQuery = useGetPromptResponse(
    { businessId, responseId: responseId ?? '' },
    { queryConfig: { enabled: open && Boolean(responseId) } },
  );
  const response = responseQuery.data;
  const engine = response ? getEngineOption(response.engine) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-6xl max-w-[95vw] gap-0"
        data-response-id={responseId ?? undefined}
      >
        <SheetHeader>
          <SheetTitle className="pr-8 text-sm leading-snug font-medium">
            {response?.promptText ?? 'Response Details'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details for the selected AI response.
          </SheetDescription>
          {response && engine && (
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              {engine.domain && (
                <DomainAvatar
                  item={{ domain: engine.domain }}
                  className="bg-surface size-4 rounded-full"
                />
              )}
              <span className="text-foreground font-medium">
                {engine.label}
              </span>
              {response.webSearch && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="size-3" aria-hidden />
                  Web search
                </span>
              )}
              <span>
                {format(new Date(response.createdAt), 'd MMM yyyy, HH:mm')}
              </span>
            </div>
          )}
        </SheetHeader>
        {responseQuery.isFetching && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Spinner variant="1" className="text-muted-foreground size-5" />
          </div>
        )}
        {!responseQuery.isFetching && response && (
          <ResponseContent key={response.id} response={response} />
        )}
      </SheetContent>
    </Sheet>
  );
}
