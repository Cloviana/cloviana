import "dotenv/config";
import {
  type CrawlabilityFinding,
  buildFindings,
  checkHtmlContent,
  checkRobots,
  checkSitemap,
} from "@/common/crawlability";

const domain = "https://rexi.finance";

const keyPages = [
  "https://rexi.finance/",
  "https://rexi.finance/blog/speed-as-a-time-bomb.html",
];

function severityRank(finding: CrawlabilityFinding): number {
  switch (finding.severity) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
  }
}

function printFindings(findings: CrawlabilityFinding[]) {
  if (findings.length === 0) {
    console.log("No crawlability findings.");
    return;
  }

  console.log("Findings:");

  for (const finding of findings.sort(
    (a, b) => severityRank(a) - severityRank(b),
  )) {
    console.log(`\n[${finding.severity.toUpperCase()}] ${finding.title}`);
    console.log(`Check: ${finding.check}`);
    if (finding.pageUrl) {
      console.log(`Page: ${finding.pageUrl}`);
    }
    console.log(`Evidence: ${finding.evidence}`);
    console.log(`Recommendation: ${finding.recommendation}`);
  }
}

async function main() {
  console.log("Running crawlability checks:");
  console.log(JSON.stringify({ domain, keyPages }, null, 2));

  const robotsResult = await checkRobots(domain, keyPages);
  const htmlContentResults = await Promise.all(keyPages.map(checkHtmlContent));
  const sitemapResult = await checkSitemap(
    domain,
    keyPages,
    robotsResult.raw.sitemapUrls,
  );
  const results = [...htmlContentResults, robotsResult, sitemapResult];
  const findings = buildFindings(results);

  console.log("");
  printFindings(findings);

  console.log("\nFull crawlability results:");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
