import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import type {
  DataForSeoAiEngine,
  DataForSeoAiSource,
} from "@/integrations/dataforseo/dataforseo.types";
import { Injectable, Logger } from "@nestjs/common";
import { AiEngine } from "@prisma/client";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import type {
  MonitoringCitation,
  MonitoringEngineFailure,
  MonitoringEngineResponse,
  MonitoringRunInput,
} from "./monitoring.types";

interface MonitoringEngineConfig {
  engine: AiEngine;
  provider: DataForSeoAiEngine;
  displayName: string;
}

interface MonitoringEngineExecutionResult {
  engineResponses: MonitoringEngineResponse[];
  engineFailures: MonitoringEngineFailure[];
}

const MONITORING_ENGINES: MonitoringEngineConfig[] = [
  {
    engine: AiEngine.AI_OVERVIEWS,
    provider: "google-ai-overview",
    displayName: "Google AI Overview",
  },
  {
    engine: AiEngine.PERPLEXITY,
    provider: "perplexity",
    displayName: "Perplexity",
  },
  {
    engine: AiEngine.CLAUDE,
    provider: "claude",
    displayName: "Claude",
  },
  {
    engine: AiEngine.CHATGPT,
    provider: "chatgpt",
    displayName: "ChatGPT",
  },
];

const MAX_EXCERPT_CHARACTERS = 1_200;
const MAX_PAGE_BYTES = 2_000_000;
const PAGE_FETCH_TIMEOUT_MS = 10_000;
const pageFetchLimit = pLimit(5);
const pageExcerptRequests = new Map<string, Promise<string | null>>();

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function downloadPageExcerpt(url: string): Promise<string | null> {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    const response = await fetch(parsedUrl, {
      headers: {
        Accept: "text/html, text/plain;q=0.9",
        "User-Agent": "Mozilla/5.0 (compatible; ClovianaBot/1.0)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (
      (!contentType.includes("text/html") &&
        !contentType.includes("text/plain")) ||
      contentLength > MAX_PAGE_BYTES
    ) {
      return null;
    }

    const responseBody = await response.text();
    if (Buffer.byteLength(responseBody) > MAX_PAGE_BYTES) {
      return null;
    }
    if (contentType.includes("text/plain")) {
      return (
        normalizeText(responseBody).slice(0, MAX_EXCERPT_CHARACTERS) || null
      );
    }

    const page = cheerio.load(responseBody);
    page(
      "script, style, noscript, svg, nav, footer, header, aside, form",
    ).remove();
    const paragraphs = page("article p, main p, [role='main'] p, p")
      .toArray()
      .map((element) => normalizeText(page(element).text()))
      .filter((text) => text.length >= 80)
      .slice(0, 3);
    const pageText =
      paragraphs.join(" ") ||
      normalizeText(page("article, main, [role='main'], body").first().text());

    return pageText.slice(0, MAX_EXCERPT_CHARACTERS) || null;
  } catch {
    return null;
  }
}

function getPageExcerpt(url: string): Promise<string | null> {
  const existingRequest = pageExcerptRequests.get(url);
  if (existingRequest) {
    return existingRequest;
  }

  const excerptRequest = pageFetchLimit(() => downloadPageExcerpt(url)).finally(
    () => {
      if (pageExcerptRequests.get(url) === excerptRequest) {
        pageExcerptRequests.delete(url);
      }
    },
  );
  pageExcerptRequests.set(url, excerptRequest);
  return excerptRequest;
}

async function enrichSources(
  sources: DataForSeoAiSource[],
): Promise<MonitoringCitation[]> {
  return Promise.all(
    sources.map(async (source) => {
      const title = normalizeText(source.title);
      const excerpt =
        normalizeText(source.excerpt ?? "") ||
        (await getPageExcerpt(source.url)) ||
        title ||
        source.url;

      return { url: source.url, title, excerpt };
    }),
  );
}

@Injectable()
export class MonitoringEngineService {
  private readonly logger = new Logger(MonitoringEngineService.name);

  constructor(private readonly dataForSeoService: DataForSeoService) {}

  async executeEngines(
    input: MonitoringRunInput,
  ): Promise<MonitoringEngineExecutionResult> {
    const engineResults = await Promise.all(
      MONITORING_ENGINES.map((engine) => this.executeEngine(input, engine)),
    );

    return {
      engineResponses: engineResults.flatMap(
        (result) => result.engineResponses,
      ),
      engineFailures: engineResults.flatMap((result) => result.engineFailures),
    };
  }

  private async executeEngine(
    input: MonitoringRunInput,
    engineConfig: MonitoringEngineConfig,
  ): Promise<MonitoringEngineExecutionResult> {
    const promptResults = await Promise.all(
      input.prompts.map(
        async (
          prompt,
        ): Promise<MonitoringEngineResponse | MonitoringEngineFailure> => {
          try {
            const answer = await this.dataForSeoService.getAiAnswer({
              engine: engineConfig.provider,
              prompt: prompt.text,
            });
            const citations = await enrichSources(answer.citations);
            const searchSources =
              answer.searchSources === answer.citations
                ? citations
                : await enrichSources(answer.searchSources);

            if (!answer.content) {
              this.logger.warn(
                `[${input.businessId}] ${engineConfig.displayName} returned empty content promptId=${prompt.id}`,
              );
            }

            return {
              responseKey: `${engineConfig.engine}:${prompt.id}`,
              engine: engineConfig.engine,
              promptId: prompt.id,
              content: answer.content,
              citations,
              inferenceSources:
                searchSources.length > 0 ? searchSources : citations,
              mentions: [],
              fanOutQueries: answer.fanOutQueries.map((query) => ({
                query,
                inferred: false,
              })),
            };
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            this.logger.error(
              `[${input.businessId}] ${engineConfig.displayName} request failed promptId=${prompt.id}: ${errorMessage}`,
            );
            return {
              engine: engineConfig.engine,
              promptId: prompt.id,
              errorMessage,
            };
          }
        },
      ),
    );

    return {
      engineResponses: promptResults.filter(
        (result): result is MonitoringEngineResponse => "content" in result,
      ),
      engineFailures: promptResults.filter(
        (result): result is MonitoringEngineFailure => "errorMessage" in result,
      ),
    };
  }
}
