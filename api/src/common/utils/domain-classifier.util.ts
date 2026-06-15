import { DomainType } from "@prisma/client";

export function classifyDomain(domain: string): DomainType {
  const cleanDomain = domain.toLowerCase().trim().replace(/^www\./, "");

  // 1. Institutional
  if (
    cleanDomain.endsWith(".edu") ||
    cleanDomain.endsWith(".gov") ||
    cleanDomain.endsWith(".mil") ||
    cleanDomain.endsWith(".gov.br") ||
    cleanDomain.endsWith(".edu.br") ||
    cleanDomain.endsWith(".gov.uk") ||
    cleanDomain.endsWith(".ac.uk")
  ) {
    return DomainType.INSTITUTIONAL;
  }

  // 2. Reference / Docs
  if (
    cleanDomain.startsWith("docs.") ||
    cleanDomain.startsWith("help.") ||
    cleanDomain.startsWith("support.") ||
    cleanDomain.startsWith("developer.") ||
    cleanDomain.startsWith("api.") ||
    cleanDomain.startsWith("wiki.") ||
    cleanDomain.includes("wikipedia.org") ||
    cleanDomain.includes("wiktionary.org") ||
    cleanDomain.includes("britannica.com") ||
    cleanDomain.includes("dictionary.com") ||
    cleanDomain.includes("gitbook.io") ||
    cleanDomain.includes("readme.io")
  ) {
    return DomainType.REFERENCE;
  }

  // 3. UGC (User Generated Content)
  if (
    cleanDomain === "youtube.com" ||
    cleanDomain === "youtu.be" ||
    cleanDomain === "quora.com" ||
    cleanDomain === "reddit.com" ||
    cleanDomain === "tripadvisor.com" ||
    cleanDomain === "tripadvisor.in" ||
    cleanDomain === "yelp.com" ||
    cleanDomain === "facebook.com" ||
    cleanDomain === "twitter.com" ||
    cleanDomain === "x.com" ||
    cleanDomain === "instagram.com" ||
    cleanDomain === "linkedin.com" ||
    cleanDomain === "medium.com" ||
    cleanDomain === "github.com" ||
    cleanDomain === "g2.com" ||
    cleanDomain === "capterra.com" ||
    cleanDomain === "trustpilot.com" ||
    cleanDomain === "producthunt.com" ||
    cleanDomain === "pinterest.com" ||
    cleanDomain === "vimeo.com" ||
    cleanDomain === "dev.to" ||
    cleanDomain === "stackoverflow.com"
  ) {
    return DomainType.UGC;
  }

  // 4. Corporate (B2B SaaS / Company Websites)
  const corporateKeywords = [
    "cloviana.com",
    "surferseo.com",
    "semrush.com",
    "ahrefs.com",
    "clearscope.io",
    "marketmuse.com",
    "shopify.com",
    "bigcommerce.com",
    "zapier.com",
    "writesonic.com",
    "neuronwriter.com",
    "seranking.com",
    "oracle.com",
    "salesforce.com",
    "hubspot.com",
    "activecampaign.com",
    "mailchimp.com",
    "stripe.com",
    "intercom.com",
    "slack.com",
    "optimizely.com",
    "hotjar.com",
    "vwo.com",
    "mixpanel.com",
    "amplitude.com",
    "segment.com",
  ];
  if (corporateKeywords.some(keyword => cleanDomain.includes(keyword))) {
    return DomainType.CORPORATE;
  }

  // 5. Editorial (Blogs, Publications, Digital Marketing sites, news)
  if (
    cleanDomain.includes("news") ||
    cleanDomain.includes("blog") ||
    cleanDomain.includes("digest") ||
    cleanDomain.includes("magazine") ||
    cleanDomain.includes("institute") ||
    cleanDomain.includes("academy") ||
    cleanDomain.includes("journal") ||
    cleanDomain.includes("review") ||
    cleanDomain.includes("times") ||
    cleanDomain.includes("post") ||
    cleanDomain.includes("daily") ||
    cleanDomain.includes("herald") ||
    cleanDomain.includes("weekly") ||
    cleanDomain.includes("monthly") ||
    cleanDomain.includes("quarterly") ||
    cleanDomain.includes("report") ||
    cleanDomain.includes("guide") ||
    cleanDomain.includes("reforge.com") ||
    cleanDomain.includes("rankability.com") ||
    cleanDomain.includes("searchengineland.com") ||
    cleanDomain.includes("search-engine-land") ||
    cleanDomain.includes("searchenginejournal.com") ||
    cleanDomain.includes("backlinko.com") ||
    cleanDomain.includes("neilpatel.com") ||
    cleanDomain.includes("moz.com") ||
    cleanDomain.includes("marketing")
  ) {
    return DomainType.EDITORIAL;
  }

  // Default fallback based on whether it seems like a company page or editorial page
  // Let's assume standard .com / .io domains that are not matched by other rules are CORPORATE (since Cloviana targets B2B SaaS niche)
  if (
    cleanDomain.endsWith(".com") ||
    cleanDomain.endsWith(".io") ||
    cleanDomain.endsWith(".co") ||
    cleanDomain.endsWith(".net") ||
    cleanDomain.endsWith(".ai") ||
    cleanDomain.endsWith(".saas") ||
    cleanDomain.endsWith(".app") ||
    cleanDomain.endsWith(".tech")
  ) {
    return DomainType.CORPORATE;
  }

  return DomainType.OTHER;
}
