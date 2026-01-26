export type KeywordCandidate = {
  id: number;
  keyword: string;
  volume: number;
  difficulty: number | null;
  intent: string | null;
};

export type SuggestedKeyword = KeywordCandidate & {
  recommended: boolean;
};
