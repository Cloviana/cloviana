-- A competitor Brand with no remaining ProductCompetitor link isn't tracking
-- a real competitor under the current model (see brand-kit-draft.service.ts
-- deleteOrphanedCompetitor). Sweep any that already exist before the
-- app-level invariant takes over going forward.
DELETE FROM "brands" b
WHERE b."kind" = 'COMPETITOR'
  AND NOT EXISTS (
    SELECT 1 FROM "product_competitors" pc
    WHERE pc."competitorBrandId" = b."id"
  );
