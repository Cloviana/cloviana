ALTER TABLE agent_runs ADD COLUMN "attachmentIds" UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE agent_attachments ADD COLUMN "uploadStatus" TEXT NOT NULL DEFAULT 'READY',
  ADD COLUMN "expiresAt" TIMESTAMPTZ(3);
ALTER TABLE agent_attachments ALTER COLUMN "uploadStatus" SET DEFAULT 'PENDING';
ALTER TABLE agent_attachments ADD CONSTRAINT agent_attachments_upload_status_check CHECK ("uploadStatus" IN ('PENDING','READY'));
