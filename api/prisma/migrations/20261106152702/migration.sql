-- Prisma cannot represent these additional composite foreign keys in the
-- current schema. Keep them: they prevent cross-theme and cross-conversation
-- references. This also restores any keys dropped by an earlier failed attempt
-- to apply this migration. The supporting UNIQUE constraints must be retained.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.agent_runs'::regclass AND conname = 'agent_runs_base_revision_same_theme_fkey') THEN
    ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_base_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "themeId", "baseRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.agent_runs'::regclass AND conname = 'agent_runs_marketplaceId_conversationId_triggerMessageId_fkey') THEN
    ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_marketplaceId_conversationId_triggerMessageId_fkey" FOREIGN KEY ("marketplaceId", "conversationId", "triggerMessageId") REFERENCES "agent_messages" ("marketplaceId", "conversationId", "id") ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.agent_runs'::regclass AND conname = 'agent_runs_result_revision_same_theme_fkey') THEN
    ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_result_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "themeId", "resultRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.theme_deployments'::regclass AND conname = 'theme_deployments_marketplaceId_themeId_revisionId_fkey') THEN
    ALTER TABLE "theme_deployments" ADD CONSTRAINT "theme_deployments_marketplaceId_themeId_revisionId_fkey" FOREIGN KEY ("marketplaceId", "themeId", "revisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.theme_sandboxes'::regclass AND conname = 'theme_sandboxes_marketplaceId_themeId_restoredRevisionId_fkey') THEN
    ALTER TABLE "theme_sandboxes" ADD CONSTRAINT "theme_sandboxes_marketplaceId_themeId_restoredRevisionId_fkey" FOREIGN KEY ("marketplaceId", "themeId", "restoredRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.themes'::regclass AND conname = 'themes_head_revision_same_theme_fkey') THEN
    ALTER TABLE "themes" ADD CONSTRAINT "themes_head_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "id", "headRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.themes'::regclass AND conname = 'themes_redo_revision_same_theme_fkey') THEN
    ALTER TABLE "themes" ADD CONSTRAINT "themes_redo_revision_same_theme_fkey" FOREIGN KEY ("marketplaceId", "id", "redoRevisionId") REFERENCES "theme_revisions" ("marketplaceId", "themeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
