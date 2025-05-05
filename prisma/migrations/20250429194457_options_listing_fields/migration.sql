/*
  Warnings:

  - You are about to drop the column `banner_image` on the `Category` table. All the data in the column will be lost.
  - Made the column `updatedAt` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Location` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "banner_image",
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Listing" ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "zip" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "updatedAt" SET NOT NULL;
