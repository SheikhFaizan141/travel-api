/*
  Warnings:

  - You are about to drop the column `parent_id` on the `Location` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "parent_id",
ADD COLUMN     "parent" INTEGER;
