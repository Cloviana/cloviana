-- CreateTable
CREATE TABLE "_PromptToTopic" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PromptToTopic_AB_pkey" PRIMARY KEY ("A", "B")
);

-- Preserve existing prompt-topic assignments
INSERT INTO "_PromptToTopic" ("A", "B")
SELECT "id", "topicId"
FROM "prompts"
WHERE "topicId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE INDEX "_PromptToTopic_B_index" ON "_PromptToTopic"("B");

-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_topicId_fkey";

-- DropIndex
DROP INDEX "prompts_topicId_idx";

-- AlterTable
ALTER TABLE "prompts" DROP COLUMN "topicId";

-- CreateIndex
CREATE INDEX "prompts_businessId_createdAt_id_idx" ON "prompts"("businessId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "_PromptToTopic" ADD CONSTRAINT "_PromptToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromptToTopic" ADD CONSTRAINT "_PromptToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
