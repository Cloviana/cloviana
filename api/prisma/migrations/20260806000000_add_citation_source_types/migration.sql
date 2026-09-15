-- CreateEnum
CREATE TYPE "CitationUrlType" AS ENUM (
  'COMPARISON',
  'OTHER',
  'ARTICLE',
  'HOW_TO_GUIDE',
  'PRODUCT_PAGE',
  'DISCUSSION',
  'LISTICLE',
  'PROFILE',
  'HOMEPAGE'
);

-- CreateEnum
CREATE TYPE "CitationDomainType" AS ENUM (
  'CORPORATE',
  'UGC',
  'OTHER',
  'REFERENCE',
  'COMPETITOR',
  'INSTITUTIONAL',
  'EDITORIAL'
);

-- AlterTable
-- Nullable until the citation classification pipeline has assigned both
-- values; null means unclassified rather than incorrectly treating it as OTHER.
ALTER TABLE "citations"
ADD COLUMN "urlType" "CitationUrlType",
ADD COLUMN "domainType" "CitationDomainType";
