-- DropColumn
ALTER TABLE "rules" DROP COLUMN "name";

-- AlterTable: samples gets the same GLOBAL/AUDIENCE/REGION/CONTENT_TYPE scope
-- rules already has; every existing row was implicitly CONTENT_TYPE-scoped.
ALTER TABLE "samples" ADD COLUMN "scope" "RuleScope" NOT NULL DEFAULT 'CONTENT_TYPE';
ALTER TABLE "samples" ALTER COLUMN "scope" DROP DEFAULT;

-- AlterTable
ALTER TABLE "samples" ALTER COLUMN "contentTypeId" DROP NOT NULL;

-- DropIndex
DROP INDEX "samples_brandKitId_idx";

-- CreateIndex
CREATE INDEX "samples_brandKitId_scope_idx" ON "samples"("brandKitId", "scope");
