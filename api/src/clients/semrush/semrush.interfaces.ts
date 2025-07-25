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
