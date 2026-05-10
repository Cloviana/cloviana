export type CrawlabilityCheckName =
  | "crawlability"
  | "robots"
  | "sitemap"
  | "core_web_vitals";

export type CrawlabilitySeverity = "critical" | "high" | "medium" | "low";

export type CrawlabilityFinding = {
  check: CrawlabilityCheckName;
  severity: CrawlabilitySeverity;
  pageUrl?: string;
  title: string;
  evidence: string;
  recommendation: string;
};

export type CrawlabilityCheckResult<TDetails = unknown> = {
  check: CrawlabilityCheckName;
  pass: boolean;
  evidence: string;
  recommendation: string;
  issues: string[];
  pageUrl?: string;
  raw: TDetails;
};

export type HtmlSnapshot = {
  url: string;
  finalUrl: string;
  status: number;
  redirected: boolean;
  title: string;
  metaDescription: string;
  h1: string;
  headings: string[];
  bodyTextLength: number;
  firstWords: string;
  linkCount: number;
  internalLinkCount: number;
  jsonLdCount: number;
  emptyElementRatio: number;
};

export type HtmlContentDetails = {
  raw: HtmlSnapshot | null;
  rendered: HtmlSnapshot | null;
  renderedError?: string;
  comparison: {
    renderedBodyTextDelta: number;
    renderedToRawTextRatio: number | null;
    renderedInternalLinkDelta: number;
    renderedJsonLdDelta: number;
  };
};

export type RobotsBotResult = {
  allowed: boolean;
  blocked: boolean;
  checkedUrls: { url: string; allowed: boolean; lineNumber: number }[];
};

export type RobotsSnapshot = {
  url: string;
  status: number;
  exists: boolean;
  blockedBots: string[];
  botResults: Record<string, RobotsBotResult>;
  sitemapUrls: string[];
  hasSitemapReference: boolean;
  content: string;
};

export type RobotsDetails = RobotsSnapshot;

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

export type SitemapUrlHealth = {
  url: string;
  status: number | null;
  redirected: boolean;
  finalUrl?: string;
  error?: string;
};

export type SitemapSnapshot = {
  candidates: string[];
  selectedCandidate?: string;
  foundSitemaps: string[];
  entries: SitemapEntry[];
  malformedSitemaps: string[];
};

export type SitemapDetails = SitemapSnapshot & {
  urlCount: number;
  missingPages: string[];
  missingLastmodPages: string[];
  staleLastmodPages: string[];
  checkedUrlHealth: SitemapUrlHealth[];
};

export type PageSpeedDetails = {
  url: string;
  status: number;
  metrics: {
    performanceScore: number | null;
    lcp: number | null;
    cls: number | null;
    inp: number | null;
    ttfb: number | null;
  };
};
