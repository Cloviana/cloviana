-- Slim deployments: no retry attempts, no publication event log, no routing status.

-- Keep the Vercel project id on the publication before it leaves the deployment row.
UPDATE "storefront_publications" AS p
SET "externalProjectId" = d."externalProjectId"
FROM "theme_deployments" AS d
WHERE p."externalProjectId" IS NULL
  AND d."marketplaceId" = p."marketplaceId"
  AND d."id" = p."liveDeploymentId";

-- Removed statuses fold into the nearest remaining one.
UPDATE "theme_deployments" SET "status" = 'BUILDING' WHERE "status"::text = 'DEPLOYING';
UPDATE "theme_deployments" SET "status" = 'FAILED' WHERE "status"::text = 'CANCELLED';
UPDATE "theme_deployments" SET "status" = 'READY' WHERE "status"::text = 'RETIRED';

-- AlterEnum
BEGIN;
CREATE TYPE "ThemeDeploymentStatus_new" AS ENUM ('QUEUED', 'BUILDING', 'READY', 'FAILED');
ALTER TABLE "public"."theme_deployments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "theme_deployments" ALTER COLUMN "status" TYPE "ThemeDeploymentStatus_new" USING ("status"::text::"ThemeDeploymentStatus_new");
ALTER TYPE "ThemeDeploymentStatus" RENAME TO "ThemeDeploymentStatus_old";
ALTER TYPE "ThemeDeploymentStatus_new" RENAME TO "ThemeDeploymentStatus";
DROP TYPE "public"."ThemeDeploymentStatus_old";
ALTER TABLE "theme_deployments" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;

-- DropTable (foreign keys and RLS policies go with them)
DROP TABLE "storefront_publication_events";
DROP TABLE "theme_deployment_attempts";

-- AlterTable
ALTER TABLE "storefront_publications" DROP COLUMN "routingStatus";

ALTER TABLE "theme_deployments" DROP COLUMN "buildConfigVersion",
DROP COLUMN "externalProjectId",
DROP COLUMN "retiredAt",
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorSummary" TEXT;

-- DropEnum
DROP TYPE "PublicationAction";
DROP TYPE "PublicationEventStatus";
DROP TYPE "PublicationRoutingStatus";
DROP TYPE "ThemeDeploymentAttemptStatus";
