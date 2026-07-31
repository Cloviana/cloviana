/*
  Warnings:

  - You are about to drop the column `distributionChannels` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `icp` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `searchIntentCommercial` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `searchIntentInformational` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `selectedTopicIds` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `setupCompletedAt` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `setupStatus` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `setupStep` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `businesses` table. All the data in the column will be lost.
  - Made the column `category` on table `businesses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `businesses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "distributionChannels",
DROP COLUMN "icp",
DROP COLUMN "industry",
DROP COLUMN "location",
DROP COLUMN "searchIntentCommercial",
DROP COLUMN "searchIntentInformational",
DROP COLUMN "selectedTopicIds",
DROP COLUMN "setupCompletedAt",
DROP COLUMN "setupStatus",
DROP COLUMN "setupStep",
DROP COLUMN "timezone",
ADD COLUMN     "personas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
