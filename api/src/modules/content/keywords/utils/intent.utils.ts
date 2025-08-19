import { KeywordIntent } from "@prisma/client";

export function mapIntentCode(code: number): KeywordIntent {
  switch (code) {
    case 0:
      return KeywordIntent.C;
    case 1:
      return KeywordIntent.I;
    case 2:
      return KeywordIntent.N;
    case 3:
      return KeywordIntent.L;
    default:
      return KeywordIntent.I;
  }
}
