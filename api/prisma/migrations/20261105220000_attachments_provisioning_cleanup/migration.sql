-- Agent attachments own their file instead of pointing at the media library.
-- Existing dev rows have no object key to carry over, so clear them.
DELETE FROM "agent_attachments";

ALTER TABLE "agent_attachments" DROP CONSTRAINT IF EXISTS "agent_attachments_marketplaceId_mediaAssetId_fkey";
ALTER TABLE "agent_attachments" DROP COLUMN "kind",
DROP COLUMN "mediaAssetId",
ADD COLUMN     "objectStorageKey" TEXT NOT NULL;
DROP TYPE "AgentAttachmentKind";

-- themes.repositoryStatus -> provisioningStatus, without the duplicate ARCHIVED value.
UPDATE "themes" SET "repositoryStatus" = 'READY' WHERE "repositoryStatus"::text = 'ARCHIVED';
ALTER TABLE "themes" ALTER COLUMN "repositoryStatus" DROP DEFAULT;
ALTER TABLE "themes" RENAME COLUMN "repositoryStatus" TO "provisioningStatus";
CREATE TYPE "ThemeProvisioningStatus" AS ENUM ('PROVISIONING', 'READY', 'FAILED');
ALTER TABLE "themes" ALTER COLUMN "provisioningStatus" TYPE "ThemeProvisioningStatus" USING ("provisioningStatus"::text::"ThemeProvisioningStatus");
ALTER TABLE "themes" ALTER COLUMN "provisioningStatus" SET DEFAULT 'PROVISIONING';
DROP TYPE "ThemeRepositoryStatus";

-- One active sandbox per theme is enforced by a partial unique index, so no fencing counter.
DROP INDEX IF EXISTS "theme_sandboxes_themeId_generation_key";
ALTER TABLE "theme_sandboxes" DROP COLUMN "generation";

-- Revisions are immutable.
ALTER TABLE "theme_revisions" DROP COLUMN "updatedAt";
