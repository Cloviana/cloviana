-- Unused tables; clear rows that would break the new NOT NULL column / constraint below.
TRUNCATE TABLE "theme_workspace_leases";
DELETE FROM "agent_attachments" WHERE "mediaAssetId" IS NULL;

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_baseRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_resultRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_runId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_themeId_baseRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_themeId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_themeId_resultRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_themeId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "agent_run_targets" DROP CONSTRAINT IF EXISTS "agent_run_targets_marketplaceId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "agent_tool_calls" DROP CONSTRAINT IF EXISTS "agent_tool_calls_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "agent_tool_calls" DROP CONSTRAINT IF EXISTS "agent_tool_calls_marketplaceId_runId_fkey";

-- DropForeignKey
ALTER TABLE "background_jobs" DROP CONSTRAINT IF EXISTS "background_jobs_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "storefront_publications" DROP CONSTRAINT IF EXISTS "storefront_publications_marketplaceId_desiredDeploymentId_fkey";

-- DropForeignKey
ALTER TABLE "storefront_publications" DROP CONSTRAINT IF EXISTS "storefront_publications_marketplaceId_observedDeploymentId_fkey";

-- DropForeignKey
ALTER TABLE "theme_checkpoints" DROP CONSTRAINT IF EXISTS "theme_checkpoints_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_checkpoints" DROP CONSTRAINT IF EXISTS "theme_checkpoints_marketplaceId_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "theme_checkpoints" DROP CONSTRAINT IF EXISTS "theme_checkpoints_marketplaceId_themeId_fkey";

-- DropForeignKey
ALTER TABLE "theme_checkpoints" DROP CONSTRAINT IF EXISTS "theme_checkpoints_marketplaceId_themeId_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "theme_checkpoints" DROP CONSTRAINT IF EXISTS "theme_checkpoints_marketplaceId_themeId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_checkpoints" DROP CONSTRAINT IF EXISTS "theme_checkpoints_marketplaceId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_configuration_versions" DROP CONSTRAINT IF EXISTS "theme_configuration_versions_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_configuration_versions" DROP CONSTRAINT IF EXISTS "theme_configuration_versions_marketplaceId_themeId_fkey";

-- DropForeignKey
ALTER TABLE "theme_deployment_runtimes" DROP CONSTRAINT IF EXISTS "theme_deployment_runtimes_marketplaceId_deploymentId_fkey";

-- DropForeignKey
ALTER TABLE "theme_deployment_runtimes" DROP CONSTRAINT IF EXISTS "theme_deployment_runtimes_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_deployments" DROP CONSTRAINT IF EXISTS "theme_deployments_marketplaceId_configurationVersionId_fkey";

-- DropForeignKey
ALTER TABLE "theme_deployments" DROP CONSTRAINT IF EXISTS "theme_deployments_marketplaceId_themeId_configurationVersi_fkey";

-- DropForeignKey
ALTER TABLE "theme_preview_sessions" DROP CONSTRAINT IF EXISTS "theme_preview_sessions_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_preview_sessions" DROP CONSTRAINT IF EXISTS "theme_preview_sessions_marketplaceId_sandboxId_fkey";

-- DropForeignKey
ALTER TABLE "theme_preview_sessions" DROP CONSTRAINT IF EXISTS "theme_preview_sessions_marketplaceId_themeId_fkey";

-- DropForeignKey
ALTER TABLE "theme_preview_sessions" DROP CONSTRAINT IF EXISTS "theme_preview_sessions_marketplaceId_themeId_workspaceId_s_fkey";

-- DropForeignKey
ALTER TABLE "theme_preview_sessions" DROP CONSTRAINT IF EXISTS "theme_preview_sessions_marketplaceId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_repositories" DROP CONSTRAINT IF EXISTS "theme_repositories_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_repositories" DROP CONSTRAINT IF EXISTS "theme_repositories_marketplaceId_themeId_fkey";

-- DropForeignKey
ALTER TABLE "theme_revisions" DROP CONSTRAINT IF EXISTS "theme_revisions_marketplaceId_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "theme_revisions" DROP CONSTRAINT IF EXISTS "theme_revisions_marketplaceId_themeId_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "theme_sandboxes" DROP CONSTRAINT IF EXISTS "theme_sandboxes_marketplaceId_themeId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_sandboxes" DROP CONSTRAINT IF EXISTS "theme_sandboxes_marketplaceId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_workspace_leases" DROP CONSTRAINT IF EXISTS "theme_workspace_leases_marketplaceId_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_workspaces" DROP CONSTRAINT IF EXISTS "theme_workspaces_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "theme_workspaces" DROP CONSTRAINT IF EXISTS "theme_workspaces_marketplaceId_headRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "theme_workspaces" DROP CONSTRAINT IF EXISTS "theme_workspaces_marketplaceId_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "theme_workspaces" DROP CONSTRAINT IF EXISTS "theme_workspaces_marketplaceId_themeId_fkey";

-- DropForeignKey
ALTER TABLE "theme_workspaces" DROP CONSTRAINT IF EXISTS "theme_workspaces_marketplaceId_themeId_headRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "theme_workspaces" DROP CONSTRAINT IF EXISTS "theme_workspaces_marketplaceId_themeId_repositoryId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "storefront_publication_events_marketplaceId_generation_key";

-- DropIndex
DROP INDEX IF EXISTS "theme_revisions_repositoryId_commitSha_key";

-- DropConstraint (a unique constraint, not a plain index, so DROP INDEX is rejected)
ALTER TABLE "theme_sandboxes" DROP CONSTRAINT IF EXISTS "theme_sandboxes_marketplaceId_themeId_workspaceId_id_genera_key";

-- DropIndex
DROP INDEX IF EXISTS "theme_sandboxes_marketplaceId_workspaceId_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "theme_sandboxes_workspaceId_generation_key";

-- DropIndex
DROP INDEX IF EXISTS "theme_workspace_leases_marketplaceId_workspaceId_key";

-- AlterTable
ALTER TABLE "agent_attachments" DROP COLUMN IF EXISTS "objectStorageKey",
ALTER COLUMN "mediaAssetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "agent_messages" DROP COLUMN IF EXISTS "updatedAt";

-- AlterTable
ALTER TABLE "agent_run_events" DROP COLUMN IF EXISTS "updatedAt";

-- AlterTable
ALTER TABLE "agent_runs" ADD COLUMN     "baseRevisionId" UUID,
ADD COLUMN     "resultRevisionId" UUID,
ADD COLUMN     "themeId" UUID;

-- AlterTable
ALTER TABLE "agent_usages" DROP COLUMN IF EXISTS "updatedAt";

-- AlterTable
ALTER TABLE "code_themes" ADD COLUMN     "externalRepositoryId" TEXT,
ADD COLUMN     "headGeneration" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "headRevisionId" UUID,
ADD COLUMN     "lastErrorCode" TEXT,
ADD COLUMN     "lastSnapshotAt" TIMESTAMPTZ(3),
ADD COLUMN     "redoRevisionId" UUID,
ADD COLUMN     "repositoryProvider" "ThemeRepositoryProvider" NOT NULL DEFAULT 'INTERNAL_GIT',
ADD COLUMN     "repositoryStatus" "ThemeRepositoryStatus" NOT NULL DEFAULT 'PROVISIONING',
ADD COLUMN     "snapshotVersion" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "storageKey" TEXT;

-- AlterTable
ALTER TABLE "storefront_publication_events" DROP COLUMN IF EXISTS "generation",
DROP COLUMN IF EXISTS "updatedAt";

-- AlterTable
ALTER TABLE "storefront_publications" DROP COLUMN IF EXISTS "desiredDeploymentId",
DROP COLUMN IF EXISTS "desiredGeneration",
DROP COLUMN IF EXISTS "observedDeploymentId",
DROP COLUMN IF EXISTS "observedGeneration",
ADD COLUMN     "externalProjectId" TEXT,
ADD COLUMN     "liveDeploymentId" UUID;

-- AlterTable
ALTER TABLE "theme_deployment_attempts" DROP COLUMN IF EXISTS "artifactDigest",
DROP COLUMN IF EXISTS "artifactStorageKey",
DROP COLUMN IF EXISTS "logStorageKey",
DROP COLUMN IF EXISTS "providerOperationId";

-- AlterTable
ALTER TABLE "theme_deployments" DROP COLUMN IF EXISTS "configurationVersionId",
DROP COLUMN IF EXISTS "runtime",
ADD COLUMN     "externalDeploymentId" TEXT,
ADD COLUMN     "externalProjectId" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'VERCEL',
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "theme_revisions" DROP COLUMN IF EXISTS "repositoryId",
DROP COLUMN IF EXISTS "treeSha",
ADD COLUMN     "label" TEXT,
ADD COLUMN     "parentRevisionId" UUID,
ADD COLUMN     "restoredFromRevisionId" UUID;

-- AlterTable
ALTER TABLE "theme_sandboxes" DROP COLUMN IF EXISTS "workspaceId";

-- AlterTable
ALTER TABLE "theme_workspace_leases" DROP COLUMN IF EXISTS "workspaceId",
ADD COLUMN     "themeId" UUID NOT NULL;

-- DropTable
DROP TABLE IF EXISTS "agent_run_targets";

-- DropTable
DROP TABLE IF EXISTS "agent_tool_calls";

-- DropTable
DROP TABLE IF EXISTS "background_jobs";

-- DropTable
DROP TABLE IF EXISTS "theme_checkpoints";

-- DropTable
DROP TABLE IF EXISTS "theme_configuration_versions";

-- DropTable
DROP TABLE IF EXISTS "theme_deployment_runtimes";

-- DropTable
DROP TABLE IF EXISTS "theme_preview_sessions";

-- DropTable
DROP TABLE IF EXISTS "theme_repositories";

-- DropTable
DROP TABLE IF EXISTS "theme_workspaces";

-- DropEnum
DROP TYPE IF EXISTS "AgentToolCallStatus";

-- DropEnum
DROP TYPE IF EXISTS "BackgroundJobStatus";

-- DropEnum
DROP TYPE IF EXISTS "ThemeCheckpointReason";

-- DropEnum
DROP TYPE IF EXISTS "ThemePreviewStatus";

-- DropEnum
DROP TYPE IF EXISTS "ThemeWorkspaceStatus";

-- CreateIndex
CREATE INDEX "agent_runs_marketplaceId_themeId_idx" ON "agent_runs"("marketplaceId", "themeId");

-- CreateIndex
CREATE UNIQUE INDEX "code_themes_repositoryProvider_externalRepositoryId_key" ON "code_themes"("repositoryProvider", "externalRepositoryId");

-- CreateIndex
CREATE INDEX "storefront_publication_events_marketplaceId_createdAt_idx" ON "storefront_publication_events"("marketplaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "theme_deployments_provider_externalDeploymentId_key" ON "theme_deployments"("provider", "externalDeploymentId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_revisions_themeId_commitSha_key" ON "theme_revisions"("themeId", "commitSha");

-- CreateIndex
CREATE INDEX "theme_sandboxes_marketplaceId_themeId_status_idx" ON "theme_sandboxes"("marketplaceId", "themeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "theme_sandboxes_themeId_generation_key" ON "theme_sandboxes"("themeId", "generation");

-- CreateIndex
CREATE UNIQUE INDEX "theme_workspace_leases_marketplaceId_themeId_key" ON "theme_workspace_leases"("marketplaceId", "themeId");

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_marketplaceId_baseRevisionId_fkey" FOREIGN KEY ("marketplaceId", "baseRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_marketplaceId_resultRevisionId_fkey" FOREIGN KEY ("marketplaceId", "resultRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_themes" ADD CONSTRAINT "code_themes_marketplaceId_thumbnailId_fkey" FOREIGN KEY ("marketplaceId", "thumbnailId") REFERENCES "media_assets"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_themes" ADD CONSTRAINT "code_themes_marketplaceId_headRevisionId_fkey" FOREIGN KEY ("marketplaceId", "headRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_themes" ADD CONSTRAINT "code_themes_marketplaceId_redoRevisionId_fkey" FOREIGN KEY ("marketplaceId", "redoRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_revisions" ADD CONSTRAINT "theme_revisions_marketplaceId_parentRevisionId_fkey" FOREIGN KEY ("marketplaceId", "parentRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_revisions" ADD CONSTRAINT "theme_revisions_marketplaceId_restoredFromRevisionId_fkey" FOREIGN KEY ("marketplaceId", "restoredFromRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_workspace_leases" ADD CONSTRAINT "theme_workspace_leases_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_publications" ADD CONSTRAINT "storefront_publications_marketplaceId_liveDeploymentId_fkey" FOREIGN KEY ("marketplaceId", "liveDeploymentId") REFERENCES "theme_deployments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- At most one non-terminal sandbox per theme (Prisma cannot express partial unique indexes).
CREATE UNIQUE INDEX "theme_sandboxes_one_active_per_theme_key" ON "theme_sandboxes"("themeId") WHERE "status" IN ('REQUESTED', 'STARTING', 'RUNNING', 'STOPPING');

-- A theme's head/redo revision and a run's base/result revision must belong to that same theme
-- (uses the existing unique index on theme_revisions(marketplaceId, themeId, id)).
ALTER TABLE "code_themes" ADD CONSTRAINT "code_themes_head_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "id", "headRevisionId") REFERENCES "theme_revisions"("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "code_themes" ADD CONSTRAINT "code_themes_redo_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "id", "redoRevisionId") REFERENCES "theme_revisions"("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_base_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "themeId", "baseRevisionId") REFERENCES "theme_revisions"("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_result_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "themeId", "resultRevisionId") REFERENCES "theme_revisions"("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

