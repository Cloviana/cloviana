import { OpenAIService } from "@/clients/openai/openai.service";
import type { UnclassifiedPromptRecord } from "./prompt-research.schemas";

const SIMILARITY_THRESHOLD = 0.85;

export async function deduplicatePrompts({
  openai,
  promptCandidates,
}: {
  openai: OpenAIService;
  promptCandidates: UnclassifiedPromptRecord[];
}): Promise<UnclassifiedPromptRecord[]> {
  if (promptCandidates.length <= 1) {
    return promptCandidates.map((c, i) => ({ ...c, promptId: i }));
  }

  const texts = promptCandidates.map((c) => c.prompt);
  const embeddings = await openai.embed(texts);

  return deduplicateByGreedy(
    embeddings,
    promptCandidates,
    SIMILARITY_THRESHOLD,
  );
}

export function deduplicateByGreedy(
  embeddings: number[][],
  candidates: UnclassifiedPromptRecord[],
  threshold: number,
): UnclassifiedPromptRecord[] {
  const kept: { embedding: number[]; candidate: UnclassifiedPromptRecord }[] =
    [];

  for (let i = 0; i < candidates.length; i++) {
    const isTooSimilar = kept.some(
      (k) => cosineSimilarity(k.embedding, embeddings[i]) >= threshold,
    );

    if (!isTooSimilar) {
      kept.push({ embedding: embeddings[i], candidate: candidates[i] });
    }
  }

  return kept.map((k, newId) => ({ ...k.candidate, promptId: newId }));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
