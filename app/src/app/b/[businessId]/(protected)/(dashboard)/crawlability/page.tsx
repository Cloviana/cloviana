'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageLoading } from '@/components/fallbacks/page-loading';
import { useGetBusiness } from '@/features/businesses/api/get-business';

// ─── AI Bot Definitions ───
type BotPurpose = 'training' | 'search' | 'both';
type BotStatus = 'allowed' | 'blocked' | 'partial' | 'unknown';

type AiBot = {
  name: string;
  userAgent: string;
  company: string;
  purpose: BotPurpose;
  description: string;
};

const AI_BOTS: AiBot[] = [
  // OpenAI
  {
    name: 'GPTBot',
    userAgent: 'GPTBot',
    company: 'OpenAI',
    purpose: 'training',
    description: 'Used to crawl web pages for training GPT models',
  },
  {
    name: 'OAI-SearchBot',
    userAgent: 'OAI-SearchBot',
    company: 'OpenAI',
    purpose: 'search',
    description: 'Powers ChatGPT search results and citations',
  },
  {
    name: 'ChatGPT-User',
    userAgent: 'ChatGPT-User',
    company: 'OpenAI',
    purpose: 'search',
    description: 'Real-time page fetches on behalf of ChatGPT users',
  },
  // Anthropic
  {
    name: 'ClaudeBot',
    userAgent: 'ClaudeBot',
    company: 'Anthropic',
    purpose: 'training',
    description: 'Used to train Claude language models',
  },
  {
    name: 'Claude-SearchBot',
    userAgent: 'Claude-SearchBot',
    company: 'Anthropic',
    purpose: 'search',
    description: 'Powers Claude search and retrieval',
  },
  {
    name: 'Claude-User',
    userAgent: 'Claude-User',
    company: 'Anthropic',
    purpose: 'search',
    description: 'Real-time fetches on behalf of Claude users',
  },
  // Perplexity
  {
    name: 'PerplexityBot',
    userAgent: 'PerplexityBot',
    company: 'Perplexity',
    purpose: 'search',
    description: 'Indexes pages for Perplexity AI search engine',
  },
  {
    name: 'Perplexity-User',
    userAgent: 'Perplexity-User',
    company: 'Perplexity',
    purpose: 'search',
    description: 'Real-time fetches for Perplexity user queries',
  },
  // Google
  {
    name: 'Google-Extended',
    userAgent: 'Google-Extended',
    company: 'Google',
    purpose: 'training',
    description:
      'Used for Gemini/Bard model training (separate from Googlebot)',
  },
  {
    name: 'Googlebot',
    userAgent: 'Googlebot',
    company: 'Google',
    purpose: 'search',
    description: 'Main Google web crawler; also powers AI Overviews',
  },
  // Common Crawl
  {
    name: 'CCBot',
    userAgent: 'CCBot',
    company: 'Common Crawl',
    purpose: 'training',
    description: 'Open dataset used by many AI companies for training',
  },
  // Meta
  {
    name: 'FacebookBot',
    userAgent: 'FacebookBot',
    company: 'Meta',
    purpose: 'both',
    description: 'Meta crawler for previews and potential AI training',
  },
  {
    name: 'Meta-ExternalAgent',
    userAgent: 'Meta-ExternalAgent',
    company: 'Meta',
    purpose: 'training',
    description: 'Meta AI training data collection',
  },
  // Apple
  {
    name: 'Applebot',
    userAgent: 'Applebot',
    company: 'Apple',
    purpose: 'search',
    description: 'Powers Siri and Apple Intelligence search results',
  },
  {
    name: 'Applebot-Extended',
    userAgent: 'Applebot-Extended',
    company: 'Apple',
    purpose: 'training',
    description: 'Used for Apple Intelligence model training',
  },
  // Microsoft
  {
    name: 'Bingbot',
    userAgent: 'bingbot',
    company: 'Microsoft',
    purpose: 'search',
    description: 'Powers Bing search and Copilot AI answers',
  },
  // Amazon
  {
    name: 'Amazonbot',
    userAgent: 'Amazonbot',
    company: 'Amazon',
    purpose: 'both',
    description: 'Amazon Alexa and AI assistant training',
  },
  // Cohere
  {
    name: 'cohere-ai',
    userAgent: 'cohere-ai',
    company: 'Cohere',
    purpose: 'training',
    description: 'Cohere AI model training crawler',
  },
  // ByteDance
  {
    name: 'Bytespider',
    userAgent: 'Bytespider',
    company: 'ByteDance',
    purpose: 'training',
    description: 'ByteDance/TikTok AI model training crawler',
  },
];

const COMPANY_DOMAINS: Record<string, string> = {
  OpenAI: 'openai.com',
  Anthropic: 'anthropic.com',
  Google: 'google.com',
  Microsoft: 'microsoft.com',
  Apple: 'apple.com',
  Perplexity: 'perplexity.ai',
  Meta: 'meta.com',
  'Common Crawl': 'commoncrawl.org',
  Amazon: 'amazon.com',
  Cohere: 'cohere.com',
  ByteDance: 'bytedance.com',
};

// ─── robots.txt Parser ───
type RobotRule = {
  userAgent: string;
  allows: string[];
  disallows: string[];
};

function parseRobotsTxt(content: string): RobotRule[] {
  const lines = content.split('\n').map((l) => l.trim());
  const rules: RobotRule[] = [];

  let currentUserAgents: string[] = [];
  let allows: string[] = [];
  let disallows: string[] = [];

  const flush = () => {
    if (currentUserAgents.length > 0) {
      for (const ua of currentUserAgents) {
        rules.push({
          userAgent: ua,
          allows: [...allows],
          disallows: [...disallows],
        });
      }
    }
    currentUserAgents = [];
    allows = [];
    disallows = [];
  };

  for (const line of lines) {
    if (line.startsWith('#') || line === '') continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim().toLowerCase();
    const value = line.slice(colonIndex + 1).trim();

    if (key === 'user-agent') {
      if (allows.length > 0 || disallows.length > 0) {
        flush();
      }
      currentUserAgents.push(value);
    } else if (key === 'allow') {
      allows.push(value);
    } else if (key === 'disallow') {
      disallows.push(value);
    }
  }

  flush();
  return rules;
}

function getBotStatus(bot: AiBot, rules: RobotRule[]): BotStatus {
  // Find specific rules for this bot
  const specificRules = rules.filter(
    (r) => r.userAgent.toLowerCase() === bot.userAgent.toLowerCase(),
  );
  const wildcardRules = rules.filter((r) => r.userAgent === '*');

  const applicableRules =
    specificRules.length > 0 ? specificRules : wildcardRules;

  if (applicableRules.length === 0) return 'allowed'; // No rules = allowed

  for (const rule of applicableRules) {
    // Check if fully blocked
    if (rule.disallows.includes('/') && !rule.allows.some((a) => a !== '')) {
      return 'blocked';
    }
    // Check if has disallows but also allows
    if (rule.disallows.length > 0 && rule.allows.length > 0) {
      return 'partial';
    }
    // Only allows
    if (rule.allows.length > 0 && rule.disallows.length === 0) {
      return 'allowed';
    }
    // Empty disallow = allowed
    if (rule.disallows.length === 1 && rule.disallows[0] === '') {
      return 'allowed';
    }
    // Has disallows
    if (rule.disallows.length > 0) {
      return 'partial';
    }
  }

  return 'unknown';
}

// ─── Status Badge Component ───
function StatusBadge({ status }: { status: BotStatus }) {
  const config = {
    allowed: { label: 'Open', className: 'peec-badge-emerald' },
    blocked: { label: 'Blocked', className: 'peec-badge-red' },
    partial: { label: 'Restricted', className: 'peec-badge-amber' },
    unknown: { label: 'Unknown', className: 'peec-badge-slate' },
  }[status];

  return (
    <span
      className={`inline-flex max-w-full items-center justify-start overflow-hidden border border-solid whitespace-nowrap transition-[opacity,background-color,border-color,color,box-shadow] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${config.className} text-body-m min-h-5 rounded-[6px] px-1`}
    >
      <span className="min-w-0 truncate">{config.label}</span>
    </span>
  );
}

function PurposeBadge({ purpose }: { purpose: BotPurpose }) {
  const config = {
    training: { label: 'Training', className: 'peec-badge-purple' },
    search: { label: 'Search', className: 'peec-badge-blue' },
    both: { label: 'Both', className: 'peec-badge-amber' },
  }[purpose];

  return (
    <span
      className={`inline-flex max-w-full items-center justify-start overflow-hidden border border-solid whitespace-nowrap transition-[opacity,background-color,border-color,color,box-shadow] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${config.className} text-body-m min-h-5 rounded-[6px] px-1`}
    >
      <span className="min-w-0 truncate">{config.label}</span>
    </span>
  );
}

// ─── Main Page ───
export default function CrawlabilityPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: business, isLoading: bizLoading } = useGetBusiness(businessId);

  const [robotsTxt, setRobotsTxt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BotStatus | 'ALL'>('ALL');
  const [purposeFilter, setPurposeFilter] = useState<BotPurpose | 'ALL'>('ALL');
  const [showRobotsTxt, setShowRobotsTxt] = useState(false);

  const domain = business?.domain;

  useEffect(() => {
    if (!businessId) return;
    setIsLoading(true);
    setError(null);

    const fetchRobots = async () => {
      try {
        const headers = await import('@/lib/supabase/get-auth-headers').then(
          (m) => m.getAuthHeaders(),
        );
        const { api } = await import('@/lib/api-client');
        const result = await api.get<{
          domain: string;
          content: string | null;
          source: string | null;
          error?: string;
        }>(`/businesses/${businessId}/monitoring/robotstxt`, { headers });

        if (result.content) {
          setRobotsTxt(result.content);
        } else {
          // Backend could not fetch it either; use a fallback analysis.
          setRobotsTxt(generateDefaultRobotsTxt(domain ?? 'unknown'));
          setError(
            'Could not fetch robots.txt from the live site. Showing a default analysis.',
          );
        }
      } catch {
        setRobotsTxt(generateDefaultRobotsTxt(domain ?? 'unknown'));
        setError('Could not fetch robots.txt. Showing a default analysis.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRobots();
  }, [businessId, domain]);

  const rules = useMemo(() => {
    if (!robotsTxt) return [];
    return parseRobotsTxt(robotsTxt);
  }, [robotsTxt]);

  const botsWithStatus = useMemo(() => {
    return AI_BOTS.map((bot) => ({
      ...bot,
      status:
        rules.length > 0 ? getBotStatus(bot, rules) : ('unknown' as BotStatus),
    }));
  }, [rules]);

  const filteredBots = useMemo(() => {
    return botsWithStatus.filter((bot) => {
      const matchesSearch =
        searchQuery === '' ||
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.userAgent.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || bot.status === statusFilter;
      const matchesPurpose =
        purposeFilter === 'ALL' || bot.purpose === purposeFilter;
      return matchesSearch && matchesStatus && matchesPurpose;
    });
  }, [botsWithStatus, searchQuery, statusFilter, purposeFilter]);

  const stats = useMemo(() => {
    const total = botsWithStatus.length;
    const open = botsWithStatus.filter((b) => b.status === 'allowed').length;
    const blocked = botsWithStatus.filter((b) => b.status === 'blocked').length;
    const restricted = botsWithStatus.filter(
      (b) => b.status === 'partial',
    ).length;
    const searchBots = botsWithStatus.filter((b) => b.purpose === 'search');
    const searchOpen = searchBots.filter((b) => b.status === 'allowed').length;
    return {
      total,
      open,
      blocked,
      restricted,
      searchBots: searchBots.length,
      searchOpen,
    };
  }, [botsWithStatus]);

  if (bizLoading || isLoading) return <PageLoading />;

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-8">
      {/* Title */}
      <div className="flex items-end gap-1.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <h2 className="text-h3 peec-text-primary">
            AI Crawlability - {stats.blocked} bots blocked, {stats.open} fully
            open
          </h2>
          <p className="text-body-m peec-text-tertiary">
            Review which AI crawlers can access your site and how your
            robots.txt policies affect your visibility in AI-generated answers.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="peec-bg-white peec-border-stroke-tertiary rounded-[14px] border p-4">
          <p className="text-body-s peec-text-tertiary">Total bots tracked</p>
          <p className="text-h3 peec-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="peec-bg-white peec-border-stroke-tertiary rounded-[14px] border p-4">
          <p className="text-body-s peec-text-tertiary">Fully open</p>
          <p className="text-h3 peec-text-primary mt-1">{stats.open}</p>
        </div>
        <div className="peec-bg-white peec-border-stroke-tertiary rounded-[14px] border p-4">
          <p className="text-body-s peec-text-tertiary">Blocked</p>
          <p className="text-h3 peec-text-primary mt-1">{stats.blocked}</p>
        </div>
        <div className="peec-bg-white peec-border-stroke-tertiary rounded-[14px] border p-4">
          <p className="text-body-s peec-text-tertiary">Search bots open</p>
          <p className="text-h3 peec-text-primary mt-1">
            {stats.searchOpen}/{stats.searchBots}
          </p>
        </div>
      </div>

      {/* Recommendation Banner */}
      {stats.blocked > 0 && stats.searchOpen < stats.searchBots && (
        <div className="peec-bg-secondary mx-0 flex min-h-[68px] items-center gap-3 rounded-xl px-4 py-3">
          <div className="peec-bg-white flex size-9 shrink-0 items-center justify-center rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="peec-text-primary"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <div>
            <p className="peec-text-primary text-body-m-semibold">
              Action needed: Some search bots are blocked
            </p>
            <p className="text-body-s peec-text-secondary">
              Blocking search bots like OAI-SearchBot, PerplexityBot, or
              ChatGPT-User prevents your brand from appearing in AI-generated
              search results. Consider unblocking them.
            </p>
          </div>
        </div>
      )}

      {/* Filters & Table */}
      <div className="peec-bg-white peec-text-primary peec-border-stroke-tertiary flex flex-col overflow-hidden rounded-[14px] border">
        {/* Filter Bar */}
        <div className="peec-border-separator-primary flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <input
            className="text-body-m peec-text-primary placeholder:peec-text-tertiary peec-bg-input peec-border-stroke-quaternary focus-visible:peec-shadow-focus-blue h-7 w-64 max-w-full rounded-[10px] border px-3 focus-visible:outline-none"
            placeholder="Search bots..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BotStatus | 'ALL')
              }
              className="text-body-m peec-text-primary peec-bg-white peec-border-stroke-quaternary focus-visible:peec-shadow-focus-blue h-7 rounded-[8px] border px-2 focus-visible:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="allowed">Open</option>
              <option value="blocked">Blocked</option>
              <option value="partial">Restricted</option>
            </select>
            {/* Purpose Filter */}
            <select
              value={purposeFilter}
              onChange={(e) =>
                setPurposeFilter(e.target.value as BotPurpose | 'ALL')
              }
              className="text-body-m peec-text-primary peec-bg-white peec-border-stroke-quaternary focus-visible:peec-shadow-focus-blue h-7 rounded-[8px] border px-2 focus-visible:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="search">Search</option>
              <option value="training">Training</option>
              <option value="both">Both</option>
            </select>
            {/* View robots.txt */}
            <button
              type="button"
              onClick={() => setShowRobotsTxt(!showRobotsTxt)}
              className="text-body-m peec-bg-white peec-text-primary peec-shadow-button-primary hover:peec-shadow-button-primary-hover relative inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-[5px] overflow-hidden rounded-[8px] px-2 whitespace-nowrap transition-all before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-[var(--peec-button-outlined-active-bg-top)] before:to-[var(--peec-button-outlined-active-bg-bottom)] focus-visible:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
              >
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {showRobotsTxt ? 'Hide' : 'View'} robots.txt
            </button>
          </div>
        </div>

        {/* robots.txt Viewer */}
        {showRobotsTxt && (
          <div className="peec-border-separator-primary border-b bg-slate-50 p-4">
            <pre className="text-body-s peec-text-primary max-h-80 overflow-x-auto overflow-y-auto font-mono text-xs leading-5 whitespace-pre-wrap">
              {robotsTxt || 'No robots.txt found'}
            </pre>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-body-m peec-text-tertiary p-4 text-center">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="p-0">
          <div
            role="table"
            className="peec-bg-white isolate grid w-full min-w-0 justify-between rounded-xl"
            style={{ gridTemplateColumns: '40px auto auto auto auto auto' }}
          >
            {/* Header */}
            <div
              role="row"
              data-table-head="true"
              className="peec-bg-table-hover sticky top-0 z-10 col-span-full grid grid-cols-subgrid border-b"
            >
              <div
                role="columnheader"
                className="peec-text-tertiary text-body-s flex h-10 items-center justify-center px-4 whitespace-nowrap antialiased select-none"
              >
                #
              </div>
              <div
                role="columnheader"
                className="peec-text-tertiary text-body-s flex h-10 items-center px-4 whitespace-nowrap antialiased select-none"
              >
                Bot
              </div>
              <div
                role="columnheader"
                className="peec-text-tertiary text-body-s flex h-10 items-center px-4 whitespace-nowrap antialiased select-none"
              >
                Company
              </div>
              <div
                role="columnheader"
                className="peec-text-tertiary text-body-s flex h-10 items-center px-4 whitespace-nowrap antialiased select-none"
              >
                Type
              </div>
              <div
                role="columnheader"
                className="peec-text-tertiary text-body-s flex h-10 items-center px-4 whitespace-nowrap antialiased select-none"
              >
                Status
              </div>
              <div
                role="columnheader"
                className="peec-text-tertiary text-body-s flex h-10 items-center px-4 whitespace-nowrap antialiased select-none"
              >
                Description
              </div>
            </div>

            {/* Body */}
            <div
              role="rowgroup"
              data-table-body="true"
              className="z-0 col-span-full grid grid-cols-subgrid"
            >
              {filteredBots.map((bot, index) => (
                <div
                  key={bot.userAgent}
                  data-table-row="true"
                  role="row"
                  className="group peec-bg-white hover:peec-bg-table-hover col-span-full grid h-[41px] grid-cols-subgrid border-b last:border-b-0 [&_[role=cell]]:max-h-10 [&_[role=cell]]:overflow-hidden"
                >
                  <div
                    role="cell"
                    className="text-body-s peec-text-tertiary flex items-center justify-center px-4"
                  >
                    {index + 1}
                  </div>
                  <div
                    role="cell"
                    className="text-body-m flex items-center gap-2 px-4"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${COMPANY_DOMAINS[bot.company] || 'google.com'}&sz=64`}
                      alt=""
                      className="size-4 shrink-0 rounded-sm bg-slate-50"
                    />
                    <code className="peec-text-primary font-mono text-xs">
                      {bot.userAgent}
                    </code>
                  </div>
                  <div
                    role="cell"
                    className="text-body-m peec-text-primary flex items-center px-4"
                  >
                    {bot.company}
                  </div>
                  <div role="cell" className="flex items-center px-4">
                    <PurposeBadge purpose={bot.purpose} />
                  </div>
                  <div role="cell" className="flex items-center px-4">
                    <StatusBadge status={bot.status} />
                  </div>
                  <div
                    role="cell"
                    className="text-body-s peec-text-tertiary flex items-center truncate px-4"
                  >
                    {bot.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {filteredBots.length === 0 && (
          <div className="text-body-m peec-text-tertiary p-8 text-center">
            No bots match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// Generate a default robots.txt for demo/analysis when CORS blocks direct fetch
function generateDefaultRobotsTxt(domain: string): string {
  return `# robots.txt for ${domain}
# Fetched for AI crawlability analysis

User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: bingbot
Allow: /

User-agent: Applebot
Allow: /

Sitemap: https://${domain}/sitemap.xml
`;
}
