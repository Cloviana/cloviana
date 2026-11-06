-- Rename the current code-based theme model without recreating its data.
BEGIN;

ALTER TYPE "CodeThemeStatus" RENAME TO "ThemeStatus";
ALTER TABLE "code_themes" RENAME TO "themes";

-- Foreign keys, grants and RLS policies remain attached to the renamed table.
-- Rename its constraints (including PostgreSQL 18 NOT NULL constraints).
DO $$
DECLARE
  constraint_row record;
BEGIN
  FOR constraint_row IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.themes'::regclass
      AND conname LIKE 'code\_themes\_%' ESCAPE '\'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.themes RENAME CONSTRAINT %I TO %I',
      constraint_row.conname,
      replace(constraint_row.conname, 'code_themes_', 'themes_')
    );
  END LOOP;
END $$;

-- Renaming an index-backed constraint already renames its index.
DO $$
DECLARE
  index_row record;
BEGIN
  FOR index_row IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'themes'
      AND indexname LIKE 'code\_themes\_%' ESCAPE '\'
  LOOP
    EXECUTE format(
      'ALTER INDEX public.%I RENAME TO %I',
      index_row.indexname,
      replace(index_row.indexname, 'code_themes_', 'themes_')
    );
  END LOOP;
END $$;

COMMIT;
