BEGIN;

-- Refuse to discard lifecycle or enum data that the application no longer models.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "businesses"
    WHERE "archivedAt" IS NOT NULL OR "deletedAt" IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM "brands"
    WHERE "archivedAt" IS NOT NULL OR "deletedAt" IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM "prompts"
    WHERE "archivedAt" IS NOT NULL OR "deletedAt" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot remove unused lifecycle columns while they contain values';
  END IF;

  IF EXISTS (SELECT 1 FROM "workflow_runs" WHERE "type"::text = 'SITE_AUDIT') THEN
    RAISE EXCEPTION 'Cannot remove WorkflowRunType.SITE_AUDIT while rows still use it';
  END IF;

  IF EXISTS (SELECT 1 FROM "prompt_responses" WHERE "engine"::text = 'ALL') THEN
    RAISE EXCEPTION 'Prompt responses cannot use the aggregate ALL engine';
  END IF;
END
$$;

-- Correct enum semantics without losing existing values.
ALTER TYPE "SubscriptionStatus" RENAME VALUE 'TRIALLING' TO 'TRIALING';
ALTER TYPE "BusinessMembershipRole" RENAME VALUE 'OWNER' TO 'ADMIN';

ALTER TYPE "WorkflowRunType" RENAME TO "WorkflowRunType_old";
CREATE TYPE "WorkflowRunType" AS ENUM (
  'BUSINESS_INITIALIZATION',
  'PROMPT_RESEARCH',
  'PROMPT_GENERATION',
  'MONITORING'
);
ALTER TABLE "workflow_runs"
  ALTER COLUMN "type" TYPE "WorkflowRunType"
  USING ("type"::text::"WorkflowRunType");
DROP TYPE "WorkflowRunType_old";

CREATE TYPE "MetricEngine" AS ENUM (
  'CLAUDE',
  'CHATGPT',
  'PERPLEXITY',
  'AI_OVERVIEWS',
  'ALL'
);
ALTER TABLE "business_metrics"
  ALTER COLUMN "engine" TYPE "MetricEngine"
  USING ("engine"::text::"MetricEngine");

ALTER TYPE "AiEngine" RENAME TO "AiEngine_old";
CREATE TYPE "AiEngine" AS ENUM (
  'CLAUDE',
  'CHATGPT',
  'PERPLEXITY',
  'AI_OVERVIEWS'
);
ALTER TABLE "prompt_responses"
  ALTER COLUMN "engine" TYPE "AiEngine"
  USING ("engine"::text::"AiEngine");
DROP TYPE "AiEngine_old";

-- Enforce singular identifiers and ownership facts.
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");
CREATE UNIQUE INDEX "businesses_stripeCustomerId_key"
  ON "businesses"("stripeCustomerId");

DO $$
BEGIN
  IF EXISTS (
    SELECT "businessId"
    FROM "brands"
    WHERE "kind" = 'BUSINESS'
    GROUP BY "businessId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'A business has more than one BUSINESS brand';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "brand_kits" bk
    LEFT JOIN "brands" b
      ON b."businessId" = bk."businessId" AND b."kind" = 'BUSINESS'
    WHERE b."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'A brand kit has no BUSINESS brand to own it';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "brand_kits" bk
    JOIN "brand_kit_versions" bkv ON bkv."id" = bk."publishedVersionId"
    WHERE bkv."brandKitId" <> bk."id"
  ) THEN
    RAISE EXCEPTION 'A brand kit publishes a version owned by a different kit';
  END IF;
END
$$;

CREATE UNIQUE INDEX "brands_id_businessId_key"
  ON "brands"("id", "businessId");
CREATE UNIQUE INDEX "brands_one_business_brand_per_business_key"
  ON "brands"("businessId") WHERE "kind" = 'BUSINESS';

ALTER TABLE "brand_kits" ADD COLUMN "brandId" UUID;
UPDATE "brand_kits" bk
SET "brandId" = b."id"
FROM "brands" b
WHERE b."businessId" = bk."businessId"
  AND b."kind" = 'BUSINESS';
ALTER TABLE "brand_kits" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "brand_kits"
  DROP CONSTRAINT "brand_kits_businessId_fkey",
  DROP CONSTRAINT "brand_kits_publishedVersionId_fkey";
DROP INDEX "brand_kits_businessId_key";
ALTER TABLE "brand_kits" DROP COLUMN "businessId";

CREATE UNIQUE INDEX "brand_kits_brandId_key" ON "brand_kits"("brandId");
CREATE UNIQUE INDEX "brand_kit_versions_id_brandKitId_key"
  ON "brand_kit_versions"("id", "brandKitId");
CREATE UNIQUE INDEX "brand_kits_publishedVersionId_id_key"
  ON "brand_kits"("publishedVersionId", "id");

ALTER TABLE "brand_kits"
  ADD CONSTRAINT "brand_kits_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "brands"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "brand_kits_publishedVersionId_id_fkey"
    FOREIGN KEY ("publishedVersionId", "id")
    REFERENCES "brand_kit_versions"("id", "brandKitId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Replace ambiguous implicit product/competitor links with a named relation.
CREATE TABLE "product_competitors" (
  "productId" UUID NOT NULL,
  "competitorBrandId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_competitors_pkey"
    PRIMARY KEY ("productId", "competitorBrandId")
);
INSERT INTO "product_competitors" ("productId", "competitorBrandId")
SELECT "B", "A" FROM "_ProductCompetitors";
DROP TABLE "_ProductCompetitors";
CREATE INDEX "product_competitors_competitorBrandId_idx"
  ON "product_competitors"("competitorBrandId");
ALTER TABLE "product_competitors"
  ADD CONSTRAINT "product_competitors_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "product_competitors_competitorBrandId_fkey"
    FOREIGN KEY ("competitorBrandId") REFERENCES "brands"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Make every rule and sample target belong to its own brand kit.
CREATE UNIQUE INDEX "audiences_id_brandKitId_key"
  ON "audiences"("id", "brandKitId");
CREATE UNIQUE INDEX "regions_id_brandKitId_key"
  ON "regions"("id", "brandKitId");
CREATE UNIQUE INDEX "content_types_id_brandKitId_key"
  ON "content_types"("id", "brandKitId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "rules" r
    LEFT JOIN "audiences" a ON a."id" = r."audienceId"
    LEFT JOIN "regions" rg ON rg."id" = r."regionId"
    LEFT JOIN "content_types" ct ON ct."id" = r."contentTypeId"
    WHERE (r."audienceId" IS NOT NULL AND a."brandKitId" <> r."brandKitId")
       OR (r."regionId" IS NOT NULL AND rg."brandKitId" <> r."brandKitId")
       OR (r."contentTypeId" IS NOT NULL AND ct."brandKitId" <> r."brandKitId")
  ) THEN
    RAISE EXCEPTION 'A rule targets an entity from a different brand kit';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "rules"
    WHERE NOT (
      ("scope" = 'GLOBAL' AND "audienceId" IS NULL AND "regionId" IS NULL AND "contentTypeId" IS NULL)
      OR ("scope" = 'AUDIENCE' AND "audienceId" IS NOT NULL AND "regionId" IS NULL AND "contentTypeId" IS NULL)
      OR ("scope" = 'REGION' AND "audienceId" IS NULL AND "regionId" IS NOT NULL AND "contentTypeId" IS NULL)
      OR ("scope" = 'CONTENT_TYPE' AND "audienceId" IS NULL AND "regionId" IS NULL AND "contentTypeId" IS NOT NULL)
    )
  ) THEN
    RAISE EXCEPTION 'A rule scope does not match its target columns';
  END IF;
END
$$;

ALTER TABLE "rules"
  DROP CONSTRAINT "rules_audienceId_fkey",
  DROP CONSTRAINT "rules_regionId_fkey",
  DROP CONSTRAINT "rules_contentTypeId_fkey",
  ADD CONSTRAINT "rules_audienceId_brandKitId_fkey"
    FOREIGN KEY ("audienceId", "brandKitId")
    REFERENCES "audiences"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "rules_regionId_brandKitId_fkey"
    FOREIGN KEY ("regionId", "brandKitId")
    REFERENCES "regions"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "rules_contentTypeId_brandKitId_fkey"
    FOREIGN KEY ("contentTypeId", "brandKitId")
    REFERENCES "content_types"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "rules_scope_target_check" CHECK (
    ("scope" = 'GLOBAL' AND "audienceId" IS NULL AND "regionId" IS NULL AND "contentTypeId" IS NULL)
    OR ("scope" = 'AUDIENCE' AND "audienceId" IS NOT NULL AND "regionId" IS NULL AND "contentTypeId" IS NULL)
    OR ("scope" = 'REGION' AND "audienceId" IS NULL AND "regionId" IS NOT NULL AND "contentTypeId" IS NULL)
    OR ("scope" = 'CONTENT_TYPE' AND "audienceId" IS NULL AND "regionId" IS NULL AND "contentTypeId" IS NOT NULL)
  ),
  ADD CONSTRAINT "rules_position_nonnegative_check" CHECK ("position" >= 0);

ALTER TABLE "samples" ADD COLUMN "brandKitId" UUID;
UPDATE "samples" s
SET "brandKitId" = ct."brandKitId"
FROM "content_types" ct
WHERE ct."id" = s."contentTypeId";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "samples" WHERE "brandKitId" IS NULL) THEN
    RAISE EXCEPTION 'A sample has no content type from which to derive its brand kit';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "samples" s
    LEFT JOIN "audiences" a ON a."id" = s."audienceId"
    LEFT JOIN "regions" r ON r."id" = s."regionId"
    WHERE (s."audienceId" IS NOT NULL AND a."brandKitId" <> s."brandKitId")
       OR (s."regionId" IS NOT NULL AND r."brandKitId" <> s."brandKitId")
  ) THEN
    RAISE EXCEPTION 'A sample targets an entity from a different brand kit';
  END IF;
END
$$;

ALTER TABLE "samples" ALTER COLUMN "brandKitId" SET NOT NULL;
ALTER TABLE "samples"
  DROP CONSTRAINT "samples_contentTypeId_fkey",
  DROP CONSTRAINT "samples_audienceId_fkey",
  DROP CONSTRAINT "samples_regionId_fkey",
  ADD CONSTRAINT "samples_brandKitId_fkey"
    FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "samples_contentTypeId_brandKitId_fkey"
    FOREIGN KEY ("contentTypeId", "brandKitId")
    REFERENCES "content_types"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "samples_audienceId_brandKitId_fkey"
    FOREIGN KEY ("audienceId", "brandKitId")
    REFERENCES "audiences"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "samples_regionId_brandKitId_fkey"
    FOREIGN KEY ("regionId", "brandKitId")
    REFERENCES "regions"("id", "brandKitId")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "samples_brandKitId_idx" ON "samples"("brandKitId");

-- Replace prompt taxonomy junctions and enforce same-business membership.
CREATE UNIQUE INDEX "prompts_id_businessId_key"
  ON "prompts"("id", "businessId");
CREATE UNIQUE INDEX "topics_id_businessId_key"
  ON "topics"("id", "businessId");
CREATE UNIQUE INDEX "tags_id_businessId_key"
  ON "tags"("id", "businessId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "_PromptToTopic" pt
    JOIN "prompts" p ON p."id" = pt."A"
    JOIN "topics" t ON t."id" = pt."B"
    WHERE p."businessId" <> t."businessId"
  ) THEN
    RAISE EXCEPTION 'A prompt is linked to a topic from a different business';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "_PromptToTag" pt
    JOIN "prompts" p ON p."id" = pt."A"
    JOIN "tags" t ON t."id" = pt."B"
    WHERE p."businessId" <> t."businessId"
  ) THEN
    RAISE EXCEPTION 'A prompt is linked to a tag from a different business';
  END IF;
END
$$;

CREATE TABLE "prompt_topics" (
  "promptId" UUID NOT NULL,
  "topicId" UUID NOT NULL,
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prompt_topics_pkey" PRIMARY KEY ("promptId", "topicId")
);
INSERT INTO "prompt_topics" ("promptId", "topicId", "businessId")
SELECT pt."A", pt."B", p."businessId"
FROM "_PromptToTopic" pt
JOIN "prompts" p ON p."id" = pt."A";

CREATE TABLE "prompt_tags" (
  "promptId" UUID NOT NULL,
  "tagId" UUID NOT NULL,
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prompt_tags_pkey" PRIMARY KEY ("promptId", "tagId")
);
INSERT INTO "prompt_tags" ("promptId", "tagId", "businessId")
SELECT pt."A", pt."B", p."businessId"
FROM "_PromptToTag" pt
JOIN "prompts" p ON p."id" = pt."A";

DROP TABLE "_PromptToTopic";
DROP TABLE "_PromptToTag";

CREATE INDEX "prompt_topics_topicId_businessId_idx"
  ON "prompt_topics"("topicId", "businessId");
CREATE INDEX "prompt_tags_tagId_businessId_idx"
  ON "prompt_tags"("tagId", "businessId");
ALTER TABLE "prompt_topics"
  ADD CONSTRAINT "prompt_topics_promptId_businessId_fkey"
    FOREIGN KEY ("promptId", "businessId")
    REFERENCES "prompts"("id", "businessId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "prompt_topics_topicId_businessId_fkey"
    FOREIGN KEY ("topicId", "businessId")
    REFERENCES "topics"("id", "businessId")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompt_tags"
  ADD CONSTRAINT "prompt_tags_promptId_businessId_fkey"
    FOREIGN KEY ("promptId", "businessId")
    REFERENCES "prompts"("id", "businessId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "prompt_tags_tagId_businessId_fkey"
    FOREIGN KEY ("tagId", "businessId")
    REFERENCES "tags"("id", "businessId")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- PromptRun is the sole owner of responses; business scope is enforced on metrics.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "prompt_responses" pr
    JOIN "prompt_runs" run ON run."id" = pr."promptRunId"
    WHERE pr."promptId" <> run."promptId"
  ) THEN
    RAISE EXCEPTION 'A prompt response duplicates a conflicting promptId';
  END IF;
END
$$;

ALTER TABLE "prompt_responses"
  DROP CONSTRAINT "prompt_responses_promptId_fkey";
DROP INDEX "prompt_responses_promptId_idx";
ALTER TABLE "prompt_responses" DROP COLUMN "promptId";
CREATE INDEX "prompt_responses_promptRunId_createdAt_idx"
  ON "prompt_responses"("promptRunId", "createdAt" DESC);
CREATE INDEX "prompt_runs_promptId_status_completedAt_createdAt_idx"
  ON "prompt_runs"("promptId", "status", "completedAt" DESC, "createdAt" DESC);

ALTER TABLE "prompt_metrics" ADD COLUMN "businessId" TEXT;
UPDATE "prompt_metrics" pm
SET "businessId" = p."businessId"
FROM "prompts" p
WHERE p."id" = pm."promptId";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "prompt_metrics" WHERE "businessId" IS NULL) THEN
    RAISE EXCEPTION 'A prompt metric has no prompt from which to derive its business';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "prompt_metrics" pm
    JOIN "brands" b ON b."id" = pm."brandId"
    WHERE b."businessId" <> pm."businessId"
  ) THEN
    RAISE EXCEPTION 'A prompt metric references a brand from a different business';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "business_metrics" bm
    JOIN "brands" b ON b."id" = bm."brandId"
    WHERE b."businessId" <> bm."businessId"
  ) THEN
    RAISE EXCEPTION 'A business metric references a brand from a different business';
  END IF;
END
$$;

ALTER TABLE "prompt_metrics" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "prompt_metrics"
  DROP CONSTRAINT "prompt_metrics_promptId_fkey",
  DROP CONSTRAINT "prompt_metrics_brandId_fkey",
  ADD CONSTRAINT "prompt_metrics_promptId_businessId_fkey"
    FOREIGN KEY ("promptId", "businessId")
    REFERENCES "prompts"("id", "businessId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "prompt_metrics_brandId_businessId_fkey"
    FOREIGN KEY ("brandId", "businessId")
    REFERENCES "brands"("id", "businessId")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_metrics"
  DROP CONSTRAINT "business_metrics_brandId_fkey",
  ADD CONSTRAINT "business_metrics_brandId_businessId_fkey"
    FOREIGN KEY ("brandId", "businessId")
    REFERENCES "brands"("id", "businessId")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "prompt_metrics_promptId_businessId_idx"
  ON "prompt_metrics"("promptId", "businessId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "sentiment_claims" WHERE "brandId" IS NULL) THEN
    RAISE EXCEPTION 'A sentiment claim has no brand';
  END IF;
END
$$;
ALTER TABLE "sentiment_claims" ALTER COLUMN "brandId" SET NOT NULL;

-- Remove unused audit and lifecycle ownership, and add the missing profile FK.
ALTER TABLE "audits" DROP CONSTRAINT "audits_workflowRunId_fkey";
DROP INDEX "audits_workflowRunId_idx";
ALTER TABLE "audits" DROP COLUMN "workflowRunId";

UPDATE "profiles" p
SET "lastAccessedBusinessId" = NULL
WHERE p."lastAccessedBusinessId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "businesses" b
    WHERE b."id" = p."lastAccessedBusinessId"
  );
CREATE INDEX "profiles_lastAccessedBusinessId_idx"
  ON "profiles"("lastAccessedBusinessId");
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_lastAccessedBusinessId_fkey"
    FOREIGN KEY ("lastAccessedBusinessId") REFERENCES "businesses"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "businesses" DROP CONSTRAINT "businesses_ownerId_fkey";
ALTER TABLE "businesses"
  ADD CONSTRAINT "businesses_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "profiles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "businesses" DROP COLUMN "archivedAt", DROP COLUMN "deletedAt";
ALTER TABLE "brands" DROP COLUMN "archivedAt", DROP COLUMN "deletedAt";
ALTER TABLE "prompts" DROP COLUMN "archivedAt", DROP COLUMN "deletedAt";

-- Domain constraints for values whose validity is not expressible in Prisma.
ALTER TABLE "brand_kits"
  ADD CONSTRAINT "brand_kits_draftRevision_nonnegative_check"
    CHECK ("draftRevision" >= 0);
ALTER TABLE "brand_kit_versions"
  ADD CONSTRAINT "brand_kit_versions_number_positive_check"
    CHECK ("number" > 0),
  ADD CONSTRAINT "brand_kit_versions_sourceRevision_nonnegative_check"
    CHECK ("sourceRevision" >= 0);
ALTER TABLE "sentiment_evidence"
  ADD CONSTRAINT "sentiment_evidence_offsets_check"
    CHECK ("startOffset" >= 0 AND "endOffset" > "startOffset");
ALTER TABLE "prompt_metrics"
  ADD CONSTRAINT "prompt_metrics_rates_check" CHECK (
    "mentionRate" BETWEEN 0 AND 100
    AND "citationShare" BETWEEN 0 AND 100
    AND "shareOfVoice" BETWEEN 0 AND 100
    AND ("positiveSentimentShare" IS NULL OR "positiveSentimentShare" BETWEEN 0 AND 100)
  ),
  ADD CONSTRAINT "prompt_metrics_claim_counts_check" CHECK (
    ("positiveClaimCount" IS NULL OR "positiveClaimCount" >= 0)
    AND ("negativeClaimCount" IS NULL OR "negativeClaimCount" >= 0)
  );
ALTER TABLE "business_metrics"
  ADD CONSTRAINT "business_metrics_rates_check" CHECK (
    "mentionRate" BETWEEN 0 AND 100
    AND "citationShare" BETWEEN 0 AND 100
    AND "shareOfVoice" BETWEEN 0 AND 100
    AND ("positiveSentimentShare" IS NULL OR "positiveSentimentShare" BETWEEN 0 AND 100)
  ),
  ADD CONSTRAINT "business_metrics_claim_counts_check" CHECK (
    ("positiveClaimCount" IS NULL OR "positiveClaimCount" >= 0)
    AND ("negativeClaimCount" IS NULL OR "negativeClaimCount" >= 0)
  );

-- Convert legacy timestamp-without-time-zone columns as UTC instants.
ALTER TABLE "audiences"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "audits"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "brand_kit_versions"
  ALTER COLUMN "publishedAt" TYPE TIMESTAMPTZ(3) USING "publishedAt" AT TIME ZONE 'UTC';
ALTER TABLE "brand_kits"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "brands"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "business_invites"
  ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "acceptedAt" TYPE TIMESTAMPTZ(3) USING "acceptedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "business_members"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "business_metrics"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "businesses"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "chat_messages"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "chats"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "citations"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "content_types"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "custom_variables"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "documents"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "indexedAt" TYPE TIMESTAMPTZ(3) USING "indexedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "ingestionQueuedAt" TYPE TIMESTAMPTZ(3) USING "ingestionQueuedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "ingestionStartedAt" TYPE TIMESTAMPTZ(3) USING "ingestionStartedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "deletedAt" TYPE TIMESTAMPTZ(3) USING "deletedAt" AT TIME ZONE 'UTC';
ALTER TABLE "fan_out_queries"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "folders"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "mentions"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "plans"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "products"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "profiles"
  ALTER COLUMN "heardAboutUsCapturedAt" TYPE TIMESTAMPTZ(3) USING "heardAboutUsCapturedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "prompt_metrics"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "prompt_responses"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "prompt_runs"
  ALTER COLUMN "completedAt" TYPE TIMESTAMPTZ(3) USING "completedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "prompts"
  ALTER COLUMN "lastRunAt" TYPE TIMESTAMPTZ(3) USING "lastRunAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "regions"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "rules"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "samples"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "sentiment_claims"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "subscriptions"
  ALTER COLUMN "trialEndsAt" TYPE TIMESTAMPTZ(3) USING "trialEndsAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "tags"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "topics"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "workflow_runs"
  ALTER COLUMN "startedAt" TYPE TIMESTAMPTZ(3) USING "startedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "finishedAt" TYPE TIMESTAMPTZ(3) USING "finishedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- Index foreign keys and the actual list/recovery query shapes.
DROP INDEX "brands_businessId_idx";
DROP INDEX "sentiment_claims_promptResponseId_idx";
DROP INDEX "sentiment_evidence_sentimentClaimId_startOffset_idx";
DROP INDEX "documents_businessId_folderId_position_idx";
DROP INDEX "documents_deletedAt_createdAt_idx";

CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");
CREATE INDEX "business_invites_acceptedById_idx"
  ON "business_invites"("acceptedById");
CREATE INDEX "workflow_runs_businessId_type_createdAt_idx"
  ON "workflow_runs"("businessId", "type", "createdAt" DESC);
CREATE INDEX "mentions_promptResponseId_order_idx"
  ON "mentions"("promptResponseId", "order");
CREATE INDEX "citations_promptResponseId_order_idx"
  ON "citations"("promptResponseId", "order");
CREATE INDEX "fan_out_queries_promptResponseId_idx"
  ON "fan_out_queries"("promptResponseId");
CREATE INDEX "audits_domain_createdAt_idx"
  ON "audits"("domain", "createdAt" DESC);
CREATE INDEX "documents_active_business_folder_position_idx"
  ON "documents"("businessId", "folderId", "position")
  WHERE "deletedAt" IS NULL;
CREATE INDEX "documents_pending_deletion_idx"
  ON "documents"("deletedAt", "createdAt")
  WHERE "deletedAt" IS NOT NULL;

COMMIT;
