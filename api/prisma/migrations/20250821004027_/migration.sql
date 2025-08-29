-- Step 1: Add the column with a temporary default
ALTER TABLE "products"
ADD COLUMN "onlineStorePreviewUrl" TEXT NOT NULL DEFAULT '';

-- Step 2: Remove the default (so new inserts must set it explicitly)
ALTER TABLE "products"
ALTER COLUMN "onlineStorePreviewUrl" DROP DEFAULT;

-- Step 3: Add the optional column
ALTER TABLE "products"
ADD COLUMN "onlineStoreUrl" TEXT;
