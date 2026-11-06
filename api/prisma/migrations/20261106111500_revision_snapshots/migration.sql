ALTER TABLE theme_revisions ADD COLUMN "storageKey" TEXT;
UPDATE theme_revisions r SET "storageKey"=t."storageKey"
FROM themes t WHERE t."headRevisionId"=r.id;
