-- Fences stale workers before they can publish a workspace snapshot.
ALTER TABLE themes ADD COLUMN "redoStack" UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN "workspaceLeaseToken" UUID,
  ADD COLUMN "workspaceLeaseUntil" TIMESTAMPTZ(3);
ALTER TABLE agent_runs ADD COLUMN "workerToken" UUID,
  ADD COLUMN "heartbeatAt" TIMESTAMPTZ(3),
  ADD COLUMN "modelTokenHash" TEXT,
  ADD COLUMN "modelRequestCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX agent_runs_dispatch_idx ON agent_runs ("createdAt") WHERE status = 'QUEUED';
CREATE INDEX agent_runs_heartbeat_idx ON agent_runs ("heartbeatAt") WHERE status = 'RUNNING';
