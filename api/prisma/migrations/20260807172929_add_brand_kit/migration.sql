-- CreateEnum
CREATE TYPE "SampleKind" AS ENUM ('URL', 'TEXT');

-- CreateEnum
CREATE TYPE "RuleScope" AS ENUM ('GLOBAL', 'AUDIENCE', 'REGION', 'CONTENT_TYPE');

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "detail" TEXT;

-- DropEnum
DROP TYPE "public"."BusinessSetupStatus";

-- DropEnum
DROP TYPE "public"."BusinessSetupStep";

-- CreateTable
CREATE TABLE "brand_kits" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "publishedVersionId" UUID,
    "about" TEXT,
    "voice" TEXT,
    "writerPersona" TEXT,
    "draftRevision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_kit_versions" (
    "id" UUID NOT NULL,
    "brandKitId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "sourceRevision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_kit_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "brandKitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "positioning" TEXT,
    "idealCustomer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_types" (
    "id" UUID NOT NULL,
    "brandKitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "outline" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audiences" (
    "id" UUID NOT NULL,
    "brandKitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "brandKitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_variables" (
    "id" UUID NOT NULL,
    "brandKitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" UUID NOT NULL,
    "brandKitId" UUID NOT NULL,
    "scope" "RuleScope" NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "audienceId" UUID,
    "regionId" UUID,
    "contentTypeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "samples" (
    "id" UUID NOT NULL,
    "contentTypeId" UUID NOT NULL,
    "audienceId" UUID,
    "regionId" UUID,
    "kind" "SampleKind" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductCompetitors" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ProductCompetitors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_kits_businessId_key" ON "brand_kits"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_kits_publishedVersionId_key" ON "brand_kits"("publishedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_kit_versions_brandKitId_number_key" ON "brand_kit_versions"("brandKitId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "products_brandKitId_name_key" ON "products"("brandKitId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "content_types_brandKitId_name_key" ON "content_types"("brandKitId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "audiences_brandKitId_name_key" ON "audiences"("brandKitId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "regions_brandKitId_name_key" ON "regions"("brandKitId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "custom_variables_brandKitId_key_key" ON "custom_variables"("brandKitId", "key");

-- CreateIndex
CREATE INDEX "rules_brandKitId_scope_idx" ON "rules"("brandKitId", "scope");

-- CreateIndex
CREATE INDEX "rules_audienceId_idx" ON "rules"("audienceId");

-- CreateIndex
CREATE INDEX "rules_regionId_idx" ON "rules"("regionId");

-- CreateIndex
CREATE INDEX "rules_contentTypeId_idx" ON "rules"("contentTypeId");

-- CreateIndex
CREATE INDEX "samples_contentTypeId_idx" ON "samples"("contentTypeId");

-- CreateIndex
CREATE INDEX "samples_audienceId_idx" ON "samples"("audienceId");

-- CreateIndex
CREATE INDEX "samples_regionId_idx" ON "samples"("regionId");

-- CreateIndex
CREATE INDEX "_ProductCompetitors_B_index" ON "_ProductCompetitors"("B");

-- AddForeignKey
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "brand_kit_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_kit_versions" ADD CONSTRAINT "brand_kit_versions_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_types" ADD CONSTRAINT "content_types_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiences" ADD CONSTRAINT "audiences_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_variables" ADD CONSTRAINT "custom_variables_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "content_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "content_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCompetitors" ADD CONSTRAINT "_ProductCompetitors_A_fkey" FOREIGN KEY ("A") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCompetitors" ADD CONSTRAINT "_ProductCompetitors_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
