import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../keyword-discovery.state";
import { RunnableConfig } from "@langchain/core/runnables";
import { SerpIntent } from "@/modules/integrations/seranking/seranking.types";

function toInt(v: unknown, def = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.round(n);
}

function toFloat(v: unknown, def = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return n;
}

function cleanIntents(v: unknown): SerpIntent[] {
  if (!Array.isArray(v)) return [];
  const set = new Set<SerpIntent>(['I','N','C','L']);
  return (v as unknown[]).map(String).filter((x): x is SerpIntent => set.has(x as SerpIntent));
}

export async function saveKeywords(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");
  const storeId = state?._storeId 
  const items = state._keywords

  await prisma.$transaction(async (tx) => {
    const keywordIds: string[] = [];
    for (const k of items) {
      const phrase = k.keyword;
      const volume = toInt(k.volume, 0);
      const cpc = toInt(k.cpc, 0);
      const difficulty = toInt(k.difficulty, 0);
      const competition = toFloat(k.competition, 0);
      const intents = cleanIntents(k.intents ?? []);
      const historyTrend = k.history_trend ?? {}
      const res = await tx.keyword.upsert({
        where: { phrase },
        create: {
          phrase,
          volume,
          cpc,
          difficulty,
          competition,
          intents,
          historyTrend
        },
        update: {
          volume,
          cpc,
          difficulty,
          competition,
          intents,
          historyTrend
        },
        select: { id: true }
      });
      keywordIds.push(res.id);
    }

    await tx.storeKeyword.deleteMany({ where: { storeId } });
    if (keywordIds.length > 0) {
      await tx.storeKeyword.createMany({
        skipDuplicates: true,
        data: keywordIds.map((keywordId) => ({ storeId, keywordId }))
      });
    }

    return keywordIds;
  }, { timeout: 120_000, maxWait: 30_000 });

  return { };
}
