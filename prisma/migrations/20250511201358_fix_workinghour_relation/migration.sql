-- DropForeignKey
ALTER TABLE "WorkingHour" DROP CONSTRAINT "WorkingHour_listingId_fkey";

-- AddForeignKey
ALTER TABLE "WorkingHour" ADD CONSTRAINT "WorkingHour_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
