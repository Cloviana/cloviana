CREATE TYPE "PromptAwarenessStage_new" AS ENUM (
  'AWARENESS',
  'CONSIDERATION',
  'EVALUATE',
  'DECIDE'
);

ALTER TABLE "prompts"
ALTER COLUMN "awarenessStage" TYPE "PromptAwarenessStage_new"
USING (
  CASE
    WHEN "awarenessStage"::text = 'EXPLORE' THEN 'AWARENESS'
    ELSE "awarenessStage"::text
  END
)::"PromptAwarenessStage_new";

DROP TYPE "PromptAwarenessStage";

ALTER TYPE "PromptAwarenessStage_new" RENAME TO "PromptAwarenessStage";
