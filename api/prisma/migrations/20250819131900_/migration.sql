BEGIN;

CREATE TYPE "KeywordIntent_new" AS ENUM ('I','N','C','L');

ALTER TABLE "keywords"
  ADD COLUMN "intents" "KeywordIntent_new"[] NOT NULL DEFAULT ARRAY[]::"KeywordIntent_new"[],
  ADD COLUMN "historyTrend" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "keywords"
SET "intents" = ARRAY[
  CASE "intent"
    WHEN 'INFORMATIONAL' THEN 'I'::"KeywordIntent_new"
    WHEN 'NAVIGATIONAL'  THEN 'N'::"KeywordIntent_new"
    WHEN 'COMMERCIAL'    THEN 'C'::"KeywordIntent_new"
    WHEN 'TRANSACTIONAL' THEN 'L'::"KeywordIntent_new"
    ELSE NULL
  END
]
WHERE "intent" IS NOT NULL;

ALTER TABLE "keywords" DROP COLUMN "intent";

ALTER TYPE "KeywordIntent" RENAME TO "KeywordIntent_old";
ALTER TYPE "KeywordIntent_new" RENAME TO "KeywordIntent";
ALTER TABLE "keywords" ALTER COLUMN "intents" TYPE "KeywordIntent"[] USING "intents"::"KeywordIntent"[];
DROP TYPE "KeywordIntent_old";

WITH d AS (
  SELECT "storeId","keywordId",
         ROW_NUMBER() OVER (PARTITION BY "storeId","keywordId" ORDER BY "storeId") AS rn
  FROM "stores_keywords"
)
DELETE FROM "stores_keywords" sk
USING d
WHERE sk."storeId"=d."storeId" AND sk."keywordId"=d."keywordId" AND d.rn>1;

ALTER TABLE "stores_keywords" DROP CONSTRAINT "stores_keywords_pkey";
ALTER TABLE "stores_keywords" DROP COLUMN "type";
ALTER TABLE "stores_keywords" ADD CONSTRAINT "stores_keywords_pkey" PRIMARY KEY ("storeId","keywordId");

COMMIT;
