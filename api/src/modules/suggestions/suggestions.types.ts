import { SerpIntent } from "@/modules/seranking/seranking.types";

export type KeywordSuggestion = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: SerpIntent;
  recommended: boolean;
};
