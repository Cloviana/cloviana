export type Brand = {
  name: string;
  domain: string;
  aliases?: string[];
};

export type ExtractedMention = {
  domain: string;
  position: number;
};

type AliasMatch = {
  domain: string;
  index: number;
  length: number;
};

function normalizeAlias(alias: string): string {
  return alias.trim().replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasPattern(alias: string): RegExp {
  const pattern = alias.split(" ").map(escapeRegExp).join("\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, "giu");
}

function visibleText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<https?:\/\/[^>]+>/giu, " ")
    .replace(/https?:\/\/[^\s)>\]]+/giu, " ")
    .replace(/`[^`]*`/g, " ");
}

function overlaps(match: AliasMatch, accepted: AliasMatch[]): boolean {
  const end = match.index + match.length;
  return accepted.some((other) => {
    const otherEnd = other.index + other.length;
    return match.index < otherEnd && end > other.index;
  });
}

export function extractMentions(
  text: string,
  brands: Brand[],
): ExtractedMention[] {
  if (!text || brands.length === 0) {
    return [];
  }

  const aliasOwners = new Map<
    string,
    { alias: string; domains: Set<string> }
  >();

  for (const brand of brands) {
    for (const rawAlias of [brand.name, ...(brand.aliases ?? [])]) {
      const alias = normalizeAlias(rawAlias);
      if (!alias) {
        continue;
      }

      const key = alias.toLocaleLowerCase();
      const existing = aliasOwners.get(key);
      if (existing) {
        existing.domains.add(brand.domain);
      } else {
        aliasOwners.set(key, {
          alias,
          domains: new Set([brand.domain]),
        });
      }
    }
  }

  const searchableText = visibleText(text);
  const matches: AliasMatch[] = [];

  for (const { alias, domains } of aliasOwners.values()) {
    if (domains.size !== 1) {
      continue;
    }

    const domain = domains.values().next().value;
    if (!domain) {
      continue;
    }

    for (const match of searchableText.matchAll(aliasPattern(alias))) {
      if (match.index === undefined) {
        continue;
      }
      matches.push({ domain, index: match.index, length: match[0].length });
    }
  }

  matches.sort((a, b) => a.index - b.index || b.length - a.length);

  const accepted: AliasMatch[] = [];
  const mentionedDomains = new Set<string>();
  for (const match of matches) {
    if (mentionedDomains.has(match.domain) || overlaps(match, accepted)) {
      continue;
    }
    accepted.push(match);
    mentionedDomains.add(match.domain);
  }

  return accepted.map((mention, index) => ({
    domain: mention.domain,
    position: index + 1,
  }));
}
