/*
  Warnings:

  - Made the column `domain` on table `businesses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "businesses" ALTER COLUMN "domain" SET NOT NULL;
