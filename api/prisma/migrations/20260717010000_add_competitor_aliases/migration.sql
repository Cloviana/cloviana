ALTER TABLE "competitors"
ADD COLUMN "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "competitors"
SET "aliases" = ARRAY["name"]
WHERE cardinality("aliases") = 0;
