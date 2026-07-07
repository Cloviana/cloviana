// Maps between our internal engine ids ("chatgpt", "claude", ...) used
// throughout the graph and Prisma's AiEngine enum used in the database.
import { AiEngine } from "@prisma/client";
import type { MonitoringEngine } from "../monitoring.types";

const AI_ENGINE_BY_MONITORING_ENGINE: Record<MonitoringEngine, AiEngine> = {
  "google-aio": AiEngine.AI_OVERVIEWS,
  perplexity: AiEngine.PERPLEXITY,
  claude: AiEngine.CLAUDE,
  chatgpt: AiEngine.CHATGPT,
};

export function toAiEngine(engine: MonitoringEngine): AiEngine {
  return AI_ENGINE_BY_MONITORING_ENGINE[engine];
}

export function normalizeAiEngine(
  engine: MonitoringEngine | AiEngine,
): AiEngine {
  return engine in AI_ENGINE_BY_MONITORING_ENGINE
    ? toAiEngine(engine as MonitoringEngine)
    : (engine as AiEngine);
}
