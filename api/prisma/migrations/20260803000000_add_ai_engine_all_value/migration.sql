-- Split into its own migration deliberately: Postgres does not allow a new
-- enum value to be used until the transaction that added it has committed,
-- and `prisma migrate dev` runs each migration.sql in its own transaction —
-- so this can't live in the same file as the UPDATE that uses 'ALL'
-- (see 20260803000100_introduce_brands).

-- AlterEnum
-- Sentinel for BusinessMetric's cross-engine aggregate row, replacing
-- `engine: null` for that row once `engine` becomes NOT NULL.
ALTER TYPE "AiEngine" ADD VALUE 'ALL';
