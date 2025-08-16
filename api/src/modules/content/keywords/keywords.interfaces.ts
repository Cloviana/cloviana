import { KeywordIntent } from "@prisma/client";

export interface KeywordSummary {
  phrase: string; // Ph
  searchVolume: number; // Nq
  cpc: number; // Cp
  competition: number; // Co
  numberOfResults: number; // Nr
  trend: string; // Td
  intent: number; // In  (0=Commercial, 1=Informational, 2=Navigational, 3=Transactional)
  difficulty: number; // Kd
}

export interface PaginatedKeywords {
  data: Array<{
    phrase: string;
    volume: number;
    cpc: number;
    competition: number;
    intent: KeywordIntent;
    difficulty: number;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
