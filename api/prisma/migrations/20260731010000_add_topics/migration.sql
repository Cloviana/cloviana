-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "prompts" ADD COLUMN "topicId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "topics_businessId_name_key" ON "topics"("businessId", "name");

-- CreateIndex
CREATE INDEX "topics_businessId_idx" ON "topics"("businessId");

-- CreateIndex
CREATE INDEX "prompts_topicId_idx" ON "prompts"("topicId");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
