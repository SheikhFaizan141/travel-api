/*
  Warnings:

  - You are about to drop the column `fromPrice` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `toPrice` on the `Listing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "fromPrice",
DROP COLUMN "toPrice",
ADD COLUMN     "priceFrom" DOUBLE PRECISION,
ADD COLUMN     "priceTo" DOUBLE PRECISION;
