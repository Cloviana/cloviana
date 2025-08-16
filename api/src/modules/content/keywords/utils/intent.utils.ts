import { KeywordIntent } from "@prisma/client";

export function mapIntentCode(code: number): KeywordIntent {
  switch (code) {
    case 0:
      return KeywordIntent.COMMERCIAL;
    case 1:
      return KeywordIntent.INFORMATIONAL;
    case 2:
      return KeywordIntent.NAVIGATIONAL;
    case 3:
      return KeywordIntent.TRANSACTIONAL;
    default:
      return KeywordIntent.INFORMATIONAL;
  }
}
