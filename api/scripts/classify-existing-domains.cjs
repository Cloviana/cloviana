const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function classifyDomain(domain) {
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
    return 'INSTITUTIONAL';
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
    return 'REFERENCE';
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
    return 'UGC';
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
    return 'CORPORATE';
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
    return 'EDITORIAL';
  }

  // Default fallback based on whether it seems like a company page or editorial page
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
    return 'CORPORATE';
  }

  return 'OTHER';
}

async function main() {
  console.log('Fetching all unique domains from database...');
  
  // Get all unique domains from Citation
  const citationDomains = await prisma.citation.findMany({
    select: { domain: true },
    distinct: ['domain'],
  });
  
  // Get all unique domains from Mention
  const mentionDomains = await prisma.mention.findMany({
    select: { domain: true },
    distinct: ['domain'],
  });
  
  const domainsSet = new Set();
  citationDomains.forEach(c => domainsSet.add(c.domain));
  mentionDomains.forEach(m => domainsSet.add(m.domain));
  
  console.log(`Found ${domainsSet.size} unique domains.`);
  
  // Prepare data for batch insert
  const data = Array.from(domainsSet).map(domain => ({
    domain,
    type: classifyDomain(domain)
  }));
  
  console.log('Inserting domains in batch...');
  
  // Delete existing to avoid conflicts and do a clean bulk insert
  await prisma.domainInfo.deleteMany({});
  
  const result = await prisma.domainInfo.createMany({
    data,
    skipDuplicates: true
  });
  
  console.log(`Successfully classified and seeded ${result.count} domains.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
