BEGIN;

ALTER TYPE "JobType" RENAME TO "WorkflowRunType";
ALTER TYPE "JobStatus" RENAME TO "WorkflowRunStatus";

ALTER TABLE "jobs" RENAME TO "workflow_runs";
ALTER TABLE "audits" RENAME COLUMN "jobId" TO "workflowRunId";

ALTER TABLE "workflow_runs"
  RENAME CONSTRAINT "jobs_pkey" TO "workflow_runs_pkey";
ALTER TABLE "workflow_runs"
  RENAME CONSTRAINT "jobs_businessId_fkey" TO "workflow_runs_businessId_fkey";
ALTER TABLE "audits"
  RENAME CONSTRAINT "audits_jobId_fkey" TO "audits_workflowRunId_fkey";

ALTER INDEX "jobs_businessId_type_status_idx"
  RENAME TO "workflow_runs_businessId_type_status_idx";
ALTER INDEX "jobs_type_businessId_dedupeKey_key"
  RENAME TO "workflow_runs_type_businessId_dedupeKey_key";
DROP INDEX "jobs_type_status_priority_scheduledAt_idx";

ALTER TABLE "workflow_runs"
  DROP COLUMN "priority",
  DROP COLUMN "attempts",
  DROP COLUMN "scheduledAt",
  DROP COLUMN "lastHeartbeatAt",
  DROP COLUMN "payload",
  ADD COLUMN "eventId" TEXT;

CREATE UNIQUE INDEX "workflow_runs_eventId_key"
  ON "workflow_runs"("eventId");
CREATE INDEX "audits_workflowRunId_idx"
  ON "audits"("workflowRunId");

COMMIT;
