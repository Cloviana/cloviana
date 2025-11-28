import { SerpIntent } from "@/integrations/seranking/seranking.types";

export type KeywordSuggestion = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: SerpIntent;
  recommended: boolean;
};
