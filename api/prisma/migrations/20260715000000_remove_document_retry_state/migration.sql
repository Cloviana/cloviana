DELETE FROM "documents" WHERE "status" = 'FAILED';

ALTER TABLE "documents"
DROP COLUMN "failureReason",
DROP COLUMN "ingestionAttempts";

CREATE TYPE "DocumentStatus_new" AS ENUM (
    'PENDING',
    'PROCESSING',
    'READY'
);

ALTER TABLE "documents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "documents"
ALTER COLUMN "status" TYPE "DocumentStatus_new"
USING ("status"::TEXT::"DocumentStatus_new");

DROP TYPE "DocumentStatus";
ALTER TYPE "DocumentStatus_new" RENAME TO "DocumentStatus";
ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'PENDING';
