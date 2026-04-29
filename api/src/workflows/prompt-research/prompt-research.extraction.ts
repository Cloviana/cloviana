import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { CHUNK_SIZE, MAX_RETRIES } from "./prompt-research.constants";
import type {
  PromptResearchInput,
  ResearchDocument,
  Signal,
  SignalRecord,
} from "./prompt-research.schemas";
import {
  SignalQualificationsSchema,
  SignalsSchema,
} from "./prompt-research.schemas";
import { assertCoverage } from "./prompt-research.utils";

const EXTRACT_CONCURRENCY = 10;
const QUALIFY_CONCURRENCY = 5;

export async function extractSignals({
  groq,
  promptsBaseDir,
  businessContext,
  documents,
}: {
  groq: GroqService;
  promptsBaseDir: string;
  businessContext: PromptResearchInput;
  documents: ResearchDocument[];
}): Promise<Signal[]> {
  const [extractPrompt, qualifyPrompt] = await Promise.all([
    loadPromptHbs("extract-signals", {}, { baseDir: promptsBaseDir }),
    loadPromptHbs("qualify-signals", {}, { baseDir: promptsBaseDir }),
  ]);

  const extractLimit = pLimit(EXTRACT_CONCURRENCY);

  const extracted = await Promise.all(
    documents.map((document) =>
      extractLimit(() =>
        groq.parse({
          name: "extract-signals",
          schema: SignalsSchema,
          model: "openai/gpt-oss-120b",
          reasoning_effort: "low",
          temperature: 0,
          messages: [
            { role: "system", content: extractPrompt },
            {
              role: "user",
              content: JSON.stringify({ businessContext, document }),
            },
          ],
        }),
      ),
    ),
  );

  const signalRecords: SignalRecord[] = extracted
    .flatMap((result) => result.signals)
    .map((signal, signalId) => ({ ...signal, signalId }));

  if (signalRecords.length === 0) {
    return [];
  }

  const qualifiedRecords = await qualifySignalRecords({
    groq,
    qualifyPrompt,
    businessContext,
    signalRecords,
  });

  return qualifiedRecords.map(({ snippet, insight, url }) => ({
    snippet,
    insight,
    url,
  }));
}

async function qualifySignalRecords({
  groq,
  qualifyPrompt,
  businessContext,
  signalRecords,
}: {
  groq: GroqService;
  qualifyPrompt: string;
  businessContext: PromptResearchInput;
  signalRecords: SignalRecord[];
}): Promise<SignalRecord[]> {
  const qualifyLimit = pLimit(QUALIFY_CONCURRENCY);
  const chunks = Array.from(
    { length: Math.ceil(signalRecords.length / CHUNK_SIZE) },
    (_, index) =>
      signalRecords.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );

  const qualificationResults = await Promise.all(
    chunks.map((signals) =>
      qualifyLimit(() =>
        pRetry(
          async () => {
            const result = await groq.parse({
              name: "qualify-signals",
              schema: SignalQualificationsSchema,
              model: "openai/gpt-oss-20b",
              reasoning_effort: "low",
              temperature: 0,
              messages: [
                { role: "system", content: qualifyPrompt },
                {
                  role: "user",
                  content: JSON.stringify({ businessContext, signals }),
                },
              ],
            });

            assertCoverage(
              signals.map(({ signalId }) => signalId),
              result.qualifications.map(({ signalId }) => signalId),
              "qualify-signals",
            );

            return result.qualifications;
          },
          { retries: MAX_RETRIES - 1 },
        ),
      ),
    ),
  );

  const qualifiedIds = new Set(
    qualificationResults
      .flat()
      .filter(({ qualified }) => qualified)
      .map(({ signalId }) => signalId),
  );

  return signalRecords.filter(({ signalId }) => qualifiedIds.has(signalId));
}
