export function normalizePrompt(prompt: string): string {
  return prompt
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function assertCoverage(
  expectedIds: number[],
  actualIds: number[],
  label: string,
): void {
  const expected = new Set(expectedIds);
  const seen = new Set<number>();

  for (const id of actualIds) {
    if (!expected.has(id)) {
      throw new Error(`[${label}] Unexpected id in response: ${id}`);
    }

    if (seen.has(id)) {
      throw new Error(`[${label}] Item covered multiple times: ${id}`);
    }

    seen.add(id);
  }

  if (seen.size !== expected.size) {
    throw new Error(`[${label}] Response did not cover all items`);
  }
}
