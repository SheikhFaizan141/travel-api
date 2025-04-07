/*
  Warnings:

  - The `parent_id` column on the `Location` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "parent_id",
ADD COLUMN     "parent_id" INTEGER;
