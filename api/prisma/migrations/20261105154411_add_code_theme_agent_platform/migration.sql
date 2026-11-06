-- CreateEnum
CREATE TYPE "CodeThemeStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ThemeRepositoryProvider" AS ENUM ('INTERNAL_GIT', 'GITHUB');

-- CreateEnum
CREATE TYPE "ThemeRepositoryStatus" AS ENUM ('PROVISIONING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ThemeWorkspaceStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ThemeRevisionOrigin" AS ENUM ('AGENT', 'HUMAN', 'RESTORE', 'IMPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ThemeCheckpointReason" AS ENUM ('USER', 'AGENT_COMPLETED', 'BEFORE_RESTORE', 'BEFORE_PUBLISH');

-- CreateEnum
CREATE TYPE "ThemeSandboxStatus" AS ENUM ('REQUESTED', 'STARTING', 'RUNNING', 'STOPPING', 'STOPPED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "ThemePreviewStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AgentConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgentMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_FOR_INPUT', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AgentToolCallStatus" AS ENUM ('REQUESTED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AgentAttachmentKind" AS ENUM ('IMAGE', 'FILE', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkspaceLeaseHolder" AS ENUM ('AGENT_RUN', 'HUMAN_EDIT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BackgroundJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ThemeDeploymentStatus" AS ENUM ('QUEUED', 'BUILDING', 'DEPLOYING', 'READY', 'FAILED', 'CANCELLED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ThemeDeploymentAttemptStatus" AS ENUM ('QUEUED', 'BUILDING', 'UPLOADING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PublicationRoutingStatus" AS ENUM ('PENDING', 'ACTIVE', 'FAILED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "PublicationAction" AS ENUM ('PUBLISH', 'ROLLBACK', 'UNPUBLISH');

-- CreateEnum
CREATE TYPE "PublicationEventStatus" AS ENUM ('REQUESTED', 'APPLIED', 'FAILED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ThemeEnvironment" AS ENUM ('PREVIEW', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "ThemeVariableKind" AS ENUM ('PUBLIC', 'SECRET');

-- CreateTable
CREATE TABLE "code_themes" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailId" UUID,
    "status" "CodeThemeStatus" NOT NULL DEFAULT 'ACTIVE',
    "templateKey" TEXT,
    "templateVersion" TEXT,
    "createdBy" UUID,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "code_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_repositories" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "provider" "ThemeRepositoryProvider" NOT NULL,
    "externalRepositoryId" TEXT,
    "repositoryLocator" TEXT,
    "defaultBranch" TEXT NOT NULL,
    "status" "ThemeRepositoryStatus" NOT NULL DEFAULT 'PROVISIONING',
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_workspaces" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "status" "ThemeWorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "headRevisionId" UUID,
    "headGeneration" BIGINT NOT NULL DEFAULT 0,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_revisions" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "commitSha" TEXT NOT NULL,
    "treeSha" TEXT,
    "message" TEXT,
    "origin" "ThemeRevisionOrigin" NOT NULL,
    "createdBy" UUID,
    "agentRunId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_checkpoints" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "revisionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "reason" "ThemeCheckpointReason" NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_sandboxes" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'DAYTONA',
    "providerSandboxId" TEXT,
    "generation" BIGINT NOT NULL,
    "status" "ThemeSandboxStatus" NOT NULL DEFAULT 'REQUESTED',
    "restoredRevisionId" UUID,
    "devServerPort" INTEGER,
    "lastHeartbeatAt" TIMESTAMPTZ(3),
    "lastActivityAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_sandboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_preview_sessions" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "sandboxId" UUID NOT NULL,
    "sandboxGeneration" BIGINT NOT NULL,
    "createdBy" UUID,
    "status" "ThemePreviewStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_preview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_conversations" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "title" TEXT,
    "status" "AgentConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "sequence" BIGINT NOT NULL,
    "role" "AgentMessageRole" NOT NULL,
    "content" JSONB NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "triggerMessageId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "modelProvider" TEXT,
    "modelName" TEXT,
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "cancelRequestedAt" TIMESTAMPTZ(3),
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_run_targets" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "baseRevisionId" UUID,
    "resultRevisionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_run_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_run_events" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "sequence" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_run_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tool_calls" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "eventSequence" BIGINT,
    "toolCallId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "status" "AgentToolCallStatus" NOT NULL DEFAULT 'REQUESTED',
    "inputSummary" JSONB,
    "outputSummary" JSONB,
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_attachments" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "mediaAssetId" UUID,
    "objectStorageKey" TEXT,
    "kind" "AgentAttachmentKind" NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_usages" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" BIGINT NOT NULL,
    "outputTokens" BIGINT NOT NULL,
    "cachedInputTokens" BIGINT,
    "costMicros" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_workspace_leases" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "holderType" "WorkspaceLeaseHolder" NOT NULL,
    "holderId" UUID NOT NULL,
    "fencingToken" BIGINT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "heartbeatAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_workspace_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMPTZ(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_deployments" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "revisionId" UUID NOT NULL,
    "configurationVersionId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "status" "ThemeDeploymentStatus" NOT NULL DEFAULT 'QUEUED',
    "runtime" TEXT NOT NULL DEFAULT 'CLOUDFLARE_WORKERS',
    "buildConfigVersion" TEXT NOT NULL,
    "readyAt" TIMESTAMPTZ(3),
    "retiredAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_deployment_attempts" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "deploymentId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "ThemeDeploymentAttemptStatus" NOT NULL DEFAULT 'QUEUED',
    "buildStartedAt" TIMESTAMPTZ(3),
    "buildFinishedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "artifactDigest" TEXT,
    "artifactStorageKey" TEXT,
    "logStorageKey" TEXT,
    "providerOperationId" TEXT,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_deployment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_deployment_runtimes" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "deploymentId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CLOUDFLARE',
    "dispatchNamespace" TEXT NOT NULL,
    "scriptName" TEXT NOT NULL,
    "providerVersionId" TEXT,
    "artifactDigest" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_deployment_runtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storefront_publications" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "desiredDeploymentId" UUID,
    "desiredGeneration" BIGINT NOT NULL DEFAULT 0,
    "routingStatus" "PublicationRoutingStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "observedDeploymentId" UUID,
    "observedGeneration" BIGINT,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "storefront_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storefront_publication_events" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "generation" BIGINT NOT NULL,
    "action" "PublicationAction" NOT NULL,
    "previousDeploymentId" UUID,
    "requestedDeploymentId" UUID,
    "requestedBy" UUID NOT NULL,
    "status" "PublicationEventStatus" NOT NULL DEFAULT 'REQUESTED',
    "errorCode" TEXT,
    "appliedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "storefront_publication_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_environment_variables" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "environment" "ThemeEnvironment" NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ThemeVariableKind" NOT NULL,
    "publicValue" TEXT,
    "secretReference" TEXT,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_environment_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_configuration_versions" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "environment" "ThemeEnvironment" NOT NULL,
    "version" INTEGER NOT NULL,
    "manifestReference" TEXT NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "theme_configuration_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "code_themes_marketplaceId_status_idx" ON "code_themes"("marketplaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "code_themes_marketplaceId_id_key" ON "code_themes"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_repositories_marketplaceId_id_key" ON "theme_repositories"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_repositories_marketplaceId_themeId_key" ON "theme_repositories"("marketplaceId", "themeId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_repositories_provider_externalRepositoryId_key" ON "theme_repositories"("provider", "externalRepositoryId");

-- CreateIndex
CREATE INDEX "theme_workspaces_marketplaceId_themeId_status_idx" ON "theme_workspaces"("marketplaceId", "themeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "theme_workspaces_marketplaceId_id_key" ON "theme_workspaces"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_workspaces_repositoryId_branchName_key" ON "theme_workspaces"("repositoryId", "branchName");

-- CreateIndex
CREATE INDEX "theme_revisions_marketplaceId_themeId_createdAt_idx" ON "theme_revisions"("marketplaceId", "themeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "theme_revisions_marketplaceId_id_key" ON "theme_revisions"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_revisions_repositoryId_commitSha_key" ON "theme_revisions"("repositoryId", "commitSha");

-- CreateIndex
CREATE INDEX "theme_checkpoints_marketplaceId_workspaceId_createdAt_idx" ON "theme_checkpoints"("marketplaceId", "workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "theme_checkpoints_marketplaceId_id_key" ON "theme_checkpoints"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "theme_sandboxes_marketplaceId_workspaceId_status_idx" ON "theme_sandboxes"("marketplaceId", "workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "theme_sandboxes_marketplaceId_id_key" ON "theme_sandboxes"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_sandboxes_provider_providerSandboxId_key" ON "theme_sandboxes"("provider", "providerSandboxId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_sandboxes_workspaceId_generation_key" ON "theme_sandboxes"("workspaceId", "generation");

-- CreateIndex
CREATE INDEX "theme_preview_sessions_marketplaceId_workspaceId_status_idx" ON "theme_preview_sessions"("marketplaceId", "workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "theme_preview_sessions_marketplaceId_id_key" ON "theme_preview_sessions"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "agent_conversations_marketplaceId_updatedAt_idx" ON "agent_conversations"("marketplaceId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_conversations_marketplaceId_id_key" ON "agent_conversations"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_messages_marketplaceId_id_key" ON "agent_messages"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_messages_conversationId_sequence_key" ON "agent_messages"("conversationId", "sequence");

-- CreateIndex
CREATE INDEX "agent_runs_marketplaceId_conversationId_createdAt_idx" ON "agent_runs"("marketplaceId", "conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_runs_marketplaceId_id_key" ON "agent_runs"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_runs_marketplaceId_idempotencyKey_key" ON "agent_runs"("marketplaceId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "agent_run_targets_marketplaceId_id_key" ON "agent_run_targets"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_run_targets_marketplaceId_runId_key" ON "agent_run_targets"("marketplaceId", "runId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_run_events_marketplaceId_id_key" ON "agent_run_events"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_run_events_runId_sequence_key" ON "agent_run_events"("runId", "sequence");

-- CreateIndex
CREATE INDEX "agent_tool_calls_marketplaceId_runId_startedAt_idx" ON "agent_tool_calls"("marketplaceId", "runId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_tool_calls_marketplaceId_id_key" ON "agent_tool_calls"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_tool_calls_runId_toolCallId_key" ON "agent_tool_calls"("runId", "toolCallId");

-- CreateIndex
CREATE INDEX "agent_attachments_marketplaceId_messageId_idx" ON "agent_attachments"("marketplaceId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_attachments_marketplaceId_id_key" ON "agent_attachments"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "agent_usages_marketplaceId_runId_idx" ON "agent_usages"("marketplaceId", "runId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_usages_marketplaceId_id_key" ON "agent_usages"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_workspace_leases_marketplaceId_id_key" ON "theme_workspace_leases"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_workspace_leases_marketplaceId_workspaceId_key" ON "theme_workspace_leases"("marketplaceId", "workspaceId");

-- CreateIndex
CREATE INDEX "background_jobs_status_availableAt_idx" ON "background_jobs"("status", "availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "background_jobs_marketplaceId_id_key" ON "background_jobs"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "background_jobs_marketplaceId_idempotencyKey_key" ON "background_jobs"("marketplaceId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "outbox_events_publishedAt_createdAt_idx" ON "outbox_events"("publishedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_marketplaceId_id_key" ON "outbox_events"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "theme_deployments_marketplaceId_themeId_createdAt_idx" ON "theme_deployments"("marketplaceId", "themeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "theme_deployments_marketplaceId_id_key" ON "theme_deployments"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_deployment_attempts_marketplaceId_id_key" ON "theme_deployment_attempts"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_deployment_attempts_deploymentId_attemptNumber_key" ON "theme_deployment_attempts"("deploymentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "theme_deployment_runtimes_marketplaceId_id_key" ON "theme_deployment_runtimes"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_deployment_runtimes_marketplaceId_deploymentId_key" ON "theme_deployment_runtimes"("marketplaceId", "deploymentId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_deployment_runtimes_provider_dispatchNamespace_script_key" ON "theme_deployment_runtimes"("provider", "dispatchNamespace", "scriptName");

-- CreateIndex
CREATE UNIQUE INDEX "storefront_publications_marketplaceId_id_key" ON "storefront_publications"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "storefront_publications_marketplaceId_key" ON "storefront_publications"("marketplaceId");

-- CreateIndex
CREATE UNIQUE INDEX "storefront_publication_events_marketplaceId_id_key" ON "storefront_publication_events"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "storefront_publication_events_marketplaceId_generation_key" ON "storefront_publication_events"("marketplaceId", "generation");

-- CreateIndex
CREATE UNIQUE INDEX "theme_environment_variables_marketplaceId_id_key" ON "theme_environment_variables"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_environment_variables_themeId_environment_name_key" ON "theme_environment_variables"("themeId", "environment", "name");

-- CreateIndex
CREATE UNIQUE INDEX "theme_configuration_versions_marketplaceId_id_key" ON "theme_configuration_versions"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "theme_configuration_versions_themeId_environment_version_key" ON "theme_configuration_versions"("themeId", "environment", "version");

-- AddForeignKey
ALTER TABLE "code_themes" ADD CONSTRAINT "code_themes_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_repositories" ADD CONSTRAINT "theme_repositories_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_repositories" ADD CONSTRAINT "theme_repositories_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_workspaces" ADD CONSTRAINT "theme_workspaces_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_workspaces" ADD CONSTRAINT "theme_workspaces_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_workspaces" ADD CONSTRAINT "theme_workspaces_marketplaceId_repositoryId_fkey" FOREIGN KEY ("marketplaceId", "repositoryId") REFERENCES "theme_repositories"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_workspaces" ADD CONSTRAINT "theme_workspaces_marketplaceId_headRevisionId_fkey" FOREIGN KEY ("marketplaceId", "headRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_revisions" ADD CONSTRAINT "theme_revisions_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_revisions" ADD CONSTRAINT "theme_revisions_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_revisions" ADD CONSTRAINT "theme_revisions_marketplaceId_repositoryId_fkey" FOREIGN KEY ("marketplaceId", "repositoryId") REFERENCES "theme_repositories"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_revisions" ADD CONSTRAINT "theme_revisions_marketplaceId_agentRunId_fkey" FOREIGN KEY ("marketplaceId", "agentRunId") REFERENCES "agent_runs"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_checkpoints" ADD CONSTRAINT "theme_checkpoints_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_checkpoints" ADD CONSTRAINT "theme_checkpoints_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_checkpoints" ADD CONSTRAINT "theme_checkpoints_marketplaceId_workspaceId_fkey" FOREIGN KEY ("marketplaceId", "workspaceId") REFERENCES "theme_workspaces"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_checkpoints" ADD CONSTRAINT "theme_checkpoints_marketplaceId_revisionId_fkey" FOREIGN KEY ("marketplaceId", "revisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_sandboxes" ADD CONSTRAINT "theme_sandboxes_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_sandboxes" ADD CONSTRAINT "theme_sandboxes_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_sandboxes" ADD CONSTRAINT "theme_sandboxes_marketplaceId_workspaceId_fkey" FOREIGN KEY ("marketplaceId", "workspaceId") REFERENCES "theme_workspaces"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_sandboxes" ADD CONSTRAINT "theme_sandboxes_marketplaceId_restoredRevisionId_fkey" FOREIGN KEY ("marketplaceId", "restoredRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_preview_sessions" ADD CONSTRAINT "theme_preview_sessions_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_preview_sessions" ADD CONSTRAINT "theme_preview_sessions_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_preview_sessions" ADD CONSTRAINT "theme_preview_sessions_marketplaceId_workspaceId_fkey" FOREIGN KEY ("marketplaceId", "workspaceId") REFERENCES "theme_workspaces"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_preview_sessions" ADD CONSTRAINT "theme_preview_sessions_marketplaceId_sandboxId_fkey" FOREIGN KEY ("marketplaceId", "sandboxId") REFERENCES "theme_sandboxes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_marketplaceId_conversationId_fkey" FOREIGN KEY ("marketplaceId", "conversationId") REFERENCES "agent_conversations"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_marketplaceId_conversationId_fkey" FOREIGN KEY ("marketplaceId", "conversationId") REFERENCES "agent_conversations"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_marketplaceId_triggerMessageId_fkey" FOREIGN KEY ("marketplaceId", "triggerMessageId") REFERENCES "agent_messages"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_targets" ADD CONSTRAINT "agent_run_targets_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_targets" ADD CONSTRAINT "agent_run_targets_marketplaceId_runId_fkey" FOREIGN KEY ("marketplaceId", "runId") REFERENCES "agent_runs"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_targets" ADD CONSTRAINT "agent_run_targets_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_targets" ADD CONSTRAINT "agent_run_targets_marketplaceId_workspaceId_fkey" FOREIGN KEY ("marketplaceId", "workspaceId") REFERENCES "theme_workspaces"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_targets" ADD CONSTRAINT "agent_run_targets_marketplaceId_baseRevisionId_fkey" FOREIGN KEY ("marketplaceId", "baseRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_targets" ADD CONSTRAINT "agent_run_targets_marketplaceId_resultRevisionId_fkey" FOREIGN KEY ("marketplaceId", "resultRevisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_events" ADD CONSTRAINT "agent_run_events_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_run_events" ADD CONSTRAINT "agent_run_events_marketplaceId_runId_fkey" FOREIGN KEY ("marketplaceId", "runId") REFERENCES "agent_runs"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tool_calls" ADD CONSTRAINT "agent_tool_calls_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tool_calls" ADD CONSTRAINT "agent_tool_calls_marketplaceId_runId_fkey" FOREIGN KEY ("marketplaceId", "runId") REFERENCES "agent_runs"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_attachments" ADD CONSTRAINT "agent_attachments_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_attachments" ADD CONSTRAINT "agent_attachments_marketplaceId_messageId_fkey" FOREIGN KEY ("marketplaceId", "messageId") REFERENCES "agent_messages"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_attachments" ADD CONSTRAINT "agent_attachments_marketplaceId_mediaAssetId_fkey" FOREIGN KEY ("marketplaceId", "mediaAssetId") REFERENCES "media_assets"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usages" ADD CONSTRAINT "agent_usages_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usages" ADD CONSTRAINT "agent_usages_marketplaceId_runId_fkey" FOREIGN KEY ("marketplaceId", "runId") REFERENCES "agent_runs"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_workspace_leases" ADD CONSTRAINT "theme_workspace_leases_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_workspace_leases" ADD CONSTRAINT "theme_workspace_leases_marketplaceId_workspaceId_fkey" FOREIGN KEY ("marketplaceId", "workspaceId") REFERENCES "theme_workspaces"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployments" ADD CONSTRAINT "theme_deployments_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployments" ADD CONSTRAINT "theme_deployments_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployments" ADD CONSTRAINT "theme_deployments_marketplaceId_revisionId_fkey" FOREIGN KEY ("marketplaceId", "revisionId") REFERENCES "theme_revisions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployments" ADD CONSTRAINT "theme_deployments_marketplaceId_configurationVersionId_fkey" FOREIGN KEY ("marketplaceId", "configurationVersionId") REFERENCES "theme_configuration_versions"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployment_attempts" ADD CONSTRAINT "theme_deployment_attempts_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployment_attempts" ADD CONSTRAINT "theme_deployment_attempts_marketplaceId_deploymentId_fkey" FOREIGN KEY ("marketplaceId", "deploymentId") REFERENCES "theme_deployments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployment_runtimes" ADD CONSTRAINT "theme_deployment_runtimes_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_deployment_runtimes" ADD CONSTRAINT "theme_deployment_runtimes_marketplaceId_deploymentId_fkey" FOREIGN KEY ("marketplaceId", "deploymentId") REFERENCES "theme_deployments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_publications" ADD CONSTRAINT "storefront_publications_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_publications" ADD CONSTRAINT "storefront_publications_marketplaceId_desiredDeploymentId_fkey" FOREIGN KEY ("marketplaceId", "desiredDeploymentId") REFERENCES "theme_deployments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_publications" ADD CONSTRAINT "storefront_publications_marketplaceId_observedDeploymentId_fkey" FOREIGN KEY ("marketplaceId", "observedDeploymentId") REFERENCES "theme_deployments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_publication_events" ADD CONSTRAINT "storefront_publication_events_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_publication_events" ADD CONSTRAINT "storefront_publication_events_marketplaceId_previousDeploy_fkey" FOREIGN KEY ("marketplaceId", "previousDeploymentId") REFERENCES "theme_deployments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_publication_events" ADD CONSTRAINT "storefront_publication_events_marketplaceId_requestedDeplo_fkey" FOREIGN KEY ("marketplaceId", "requestedDeploymentId") REFERENCES "theme_deployments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_environment_variables" ADD CONSTRAINT "theme_environment_variables_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_environment_variables" ADD CONSTRAINT "theme_environment_variables_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_configuration_versions" ADD CONSTRAINT "theme_configuration_versions_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_configuration_versions" ADD CONSTRAINT "theme_configuration_versions_marketplaceId_themeId_fkey" FOREIGN KEY ("marketplaceId", "themeId") REFERENCES "code_themes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tenant policies for all new tenant-owned tables.
ALTER TABLE "code_themes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "code_themes" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "code_themes" TO cloviana_tenant;
ALTER TABLE "theme_repositories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_repositories" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_repositories" TO cloviana_tenant;
ALTER TABLE "theme_workspaces" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_workspaces" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_workspaces" TO cloviana_tenant;
ALTER TABLE "theme_revisions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_revisions" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_revisions" TO cloviana_tenant;
ALTER TABLE "theme_checkpoints" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_checkpoints" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_checkpoints" TO cloviana_tenant;
ALTER TABLE "theme_sandboxes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_sandboxes" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_sandboxes" TO cloviana_tenant;
ALTER TABLE "theme_preview_sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_preview_sessions" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_preview_sessions" TO cloviana_tenant;
ALTER TABLE "agent_conversations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_conversations" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_conversations" TO cloviana_tenant;
ALTER TABLE "agent_messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_messages" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_messages" TO cloviana_tenant;
ALTER TABLE "agent_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_runs" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_runs" TO cloviana_tenant;
ALTER TABLE "agent_run_targets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_run_targets" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_run_targets" TO cloviana_tenant;
ALTER TABLE "agent_run_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_run_events" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_run_events" TO cloviana_tenant;
ALTER TABLE "agent_tool_calls" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_tool_calls" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_tool_calls" TO cloviana_tenant;
ALTER TABLE "agent_attachments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_attachments" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_attachments" TO cloviana_tenant;
ALTER TABLE "agent_usages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "agent_usages" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "agent_usages" TO cloviana_tenant;
ALTER TABLE "theme_workspace_leases" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_workspace_leases" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_workspace_leases" TO cloviana_tenant;
ALTER TABLE "background_jobs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "background_jobs" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "background_jobs" TO cloviana_tenant;
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "outbox_events" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "outbox_events" TO cloviana_tenant;
ALTER TABLE "theme_deployments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_deployments" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_deployments" TO cloviana_tenant;
ALTER TABLE "theme_deployment_attempts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_deployment_attempts" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_deployment_attempts" TO cloviana_tenant;
ALTER TABLE "theme_deployment_runtimes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_deployment_runtimes" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_deployment_runtimes" TO cloviana_tenant;
ALTER TABLE "storefront_publications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "storefront_publications" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "storefront_publications" TO cloviana_tenant;
ALTER TABLE "storefront_publication_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "storefront_publication_events" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "storefront_publication_events" TO cloviana_tenant;
ALTER TABLE "theme_environment_variables" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_environment_variables" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_environment_variables" TO cloviana_tenant;
ALTER TABLE "theme_configuration_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "theme_configuration_versions" TO cloviana_tenant USING ("marketplaceId" = (SELECT public.current_marketplace_id())) WITH CHECK ("marketplaceId" = (SELECT public.current_marketplace_id()));
GRANT SELECT, INSERT, UPDATE, DELETE ON "theme_configuration_versions" TO cloviana_tenant;

-- Active resources and structural invariants.
CREATE UNIQUE INDEX "theme_sandboxes_one_active_per_workspace" ON "theme_sandboxes" ("marketplaceId", "workspaceId") WHERE "status" IN ('REQUESTED', 'STARTING', 'RUNNING', 'STOPPING');
CREATE UNIQUE INDEX "agent_runs_one_active_per_conversation" ON "agent_runs" ("marketplaceId", "conversationId") WHERE "status" IN ('QUEUED', 'RUNNING', 'WAITING_FOR_INPUT');
ALTER TABLE "theme_sandboxes" ADD CONSTRAINT "theme_sandboxes_port_check" CHECK ("devServerPort" IS NULL OR "devServerPort" BETWEEN 1 AND 65535), ADD CONSTRAINT "theme_sandboxes_generation_check" CHECK ("generation" > 0);
ALTER TABLE "theme_workspaces" ADD CONSTRAINT "theme_workspaces_generation_check" CHECK ("headGeneration" >= 0);
ALTER TABLE "theme_workspace_leases" ADD CONSTRAINT "theme_workspace_leases_fencing_check" CHECK ("fencingToken" > 0);
ALTER TABLE "theme_environment_variables" ADD CONSTRAINT "theme_environment_variables_value_check" CHECK (("kind" = 'PUBLIC' AND "publicValue" IS NOT NULL AND "secretReference" IS NULL) OR ("kind" = 'SECRET' AND "publicValue" IS NULL AND "secretReference" IS NOT NULL));
ALTER TABLE "agent_attachments" ADD CONSTRAINT "agent_attachments_storage_check" CHECK ((("mediaAssetId" IS NOT NULL)::int + ("objectStorageKey" IS NOT NULL)::int) = 1 AND "sizeBytes" >= 0);
ALTER TABLE "agent_usages" ADD CONSTRAINT "agent_usages_nonnegative_check" CHECK ("inputTokens" >= 0 AND "outputTokens" >= 0 AND ("cachedInputTokens" IS NULL OR "cachedInputTokens" >= 0) AND ("costMicros" IS NULL OR "costMicros" >= 0));
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_attempt_check" CHECK ("attemptCount" >= 0);
ALTER TABLE "theme_deployment_attempts" ADD CONSTRAINT "theme_deployment_attempts_number_check" CHECK ("attemptNumber" > 0);
ALTER TABLE "storefront_publications" ADD CONSTRAINT "storefront_publications_generation_check" CHECK ("desiredGeneration" >= 0 AND ("observedGeneration" IS NULL OR ("observedGeneration" >= 0 AND "observedGeneration" <= "desiredGeneration")));

-- Additional composite foreign keys prevent cross-project references inside a tenant.
ALTER TABLE "theme_repositories" ADD UNIQUE ("marketplaceId", "themeId", "id");
ALTER TABLE "theme_workspaces" ADD UNIQUE ("marketplaceId", "themeId", "id");
ALTER TABLE "theme_revisions" ADD UNIQUE ("marketplaceId", "themeId", "id");
ALTER TABLE "theme_sandboxes" ADD UNIQUE ("marketplaceId", "themeId", "workspaceId", "id", "generation");
ALTER TABLE "theme_configuration_versions" ADD UNIQUE ("marketplaceId", "themeId", "id");
ALTER TABLE "agent_messages" ADD UNIQUE ("marketplaceId", "conversationId", "id");
ALTER TABLE "theme_workspaces" ADD FOREIGN KEY ("marketplaceId", "themeId", "repositoryId") REFERENCES "theme_repositories" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_revisions" ADD FOREIGN KEY ("marketplaceId", "themeId", "repositoryId") REFERENCES "theme_repositories" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_workspaces" ADD FOREIGN KEY ("marketplaceId", "themeId", "headRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_checkpoints" ADD FOREIGN KEY ("marketplaceId", "themeId", "workspaceId") REFERENCES "theme_workspaces" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_checkpoints" ADD FOREIGN KEY ("marketplaceId", "themeId", "revisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_sandboxes" ADD FOREIGN KEY ("marketplaceId", "themeId", "workspaceId") REFERENCES "theme_workspaces" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_sandboxes" ADD FOREIGN KEY ("marketplaceId", "themeId", "restoredRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_preview_sessions" ADD FOREIGN KEY ("marketplaceId", "themeId", "workspaceId", "sandboxId", "sandboxGeneration") REFERENCES "theme_sandboxes" ("marketplaceId", "themeId", "workspaceId", "id", "generation") ON DELETE RESTRICT;
ALTER TABLE "agent_runs" ADD FOREIGN KEY ("marketplaceId", "conversationId", "triggerMessageId") REFERENCES "agent_messages" ("marketplaceId", "conversationId", "id") ON DELETE RESTRICT;
ALTER TABLE "agent_run_targets" ADD FOREIGN KEY ("marketplaceId", "themeId", "workspaceId") REFERENCES "theme_workspaces" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "agent_run_targets" ADD FOREIGN KEY ("marketplaceId", "themeId", "baseRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "agent_run_targets" ADD FOREIGN KEY ("marketplaceId", "themeId", "resultRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_deployments" ADD FOREIGN KEY ("marketplaceId", "themeId", "revisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
ALTER TABLE "theme_deployments" ADD FOREIGN KEY ("marketplaceId", "themeId", "configurationVersionId") REFERENCES "theme_configuration_versions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
