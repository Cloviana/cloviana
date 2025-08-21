/*
  Warnings:

  - You are about to drop the column `mainImageAlt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `mainImageUrl` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "mainImageAlt",
DROP COLUMN "mainImageUrl",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "handle" DROP NOT NULL;
