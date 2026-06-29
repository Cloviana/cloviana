CREATE TYPE "DocumentTag" AS ENUM ('business', 'domain');

CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "tag" "DocumentTag" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_businessId_idx" ON "documents"("businessId");

ALTER TABLE "documents"
ADD CONSTRAINT "documents_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
