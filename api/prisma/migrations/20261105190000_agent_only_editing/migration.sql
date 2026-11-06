-- Only the agent edits a theme: no human edits, no GitHub sync, no edit lock.

-- Revisions can no longer be HUMAN or IMPORT; fold any existing ones into SYSTEM.
UPDATE "theme_revisions" SET "origin" = 'SYSTEM' WHERE "origin"::text IN ('HUMAN', 'IMPORT');

-- AlterEnum
BEGIN;
CREATE TYPE "ThemeRevisionOrigin_new" AS ENUM ('AGENT', 'RESTORE', 'SYSTEM');
ALTER TABLE "theme_revisions" ALTER COLUMN "origin" TYPE "ThemeRevisionOrigin_new" USING ("origin"::text::"ThemeRevisionOrigin_new");
ALTER TYPE "ThemeRevisionOrigin" RENAME TO "ThemeRevisionOrigin_old";
ALTER TYPE "ThemeRevisionOrigin_new" RENAME TO "ThemeRevisionOrigin";
DROP TYPE "public"."ThemeRevisionOrigin_old";
COMMIT;

-- DropTable (its foreign keys and RLS policy go with it)
DROP TABLE "theme_workspace_leases";

-- DropIndex
DROP INDEX "themes_repositoryProvider_externalRepositoryId_key";

-- AlterTable
ALTER TABLE "themes" DROP COLUMN "externalRepositoryId",
DROP COLUMN "headGeneration",
DROP COLUMN "repositoryProvider";

-- DropEnum
DROP TYPE "ThemeRepositoryProvider";

-- DropEnum
DROP TYPE "WorkspaceLeaseHolder";

-- One active agent run per theme replaces the edit lock (Prisma cannot express partial unique indexes).
CREATE UNIQUE INDEX "agent_runs_one_active_per_theme_key" ON "agent_runs"("themeId") WHERE "status" IN ('QUEUED', 'RUNNING') AND "themeId" IS NOT NULL;
