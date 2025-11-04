-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "productId" UUID;

-- CreateIndex
CREATE INDEX "blogs_productId_idx" ON "blogs"("productId");
