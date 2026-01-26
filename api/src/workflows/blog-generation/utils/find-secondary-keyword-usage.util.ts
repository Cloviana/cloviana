export type SecondaryKeywordUsage = {
  keyword: string;
  count: number;
};

export function findSecondaryKeywordUsage(
  outline: unknown,
  secondaryKeywords: string[],
): SecondaryKeywordUsage[] {
  const counts = new Map<string, number>();

  for (const kw of secondaryKeywords) counts.set(kw, 0);

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    if (!node || typeof node !== "object") return;

    for (const [key, value] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (key === "keywords" && Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === "string" && counts.has(v)) {
            counts.set(v, (counts.get(v) ?? 0) + 1);
          }
        }
      } else {
        walk(value);
      }
    }
  };

  walk(outline);

  return Array.from(counts.entries()).map(([keyword, count]) => ({
    keyword,
    count,
  }));
}
