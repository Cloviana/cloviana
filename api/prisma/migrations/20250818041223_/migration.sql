/*
  Warnings:

  - The primary key for the `products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[storeId,shopifyId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopifyId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "products" DROP CONSTRAINT "products_pkey",
ADD COLUMN     "shopifyId" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_shopifyId_key" ON "products"("storeId", "shopifyId");
