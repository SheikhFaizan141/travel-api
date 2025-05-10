-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "fromPrice" DOUBLE PRECISION,
ADD COLUMN     "priceRange" TEXT,
ADD COLUMN     "toPrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "WorkingHour" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "is24Hour" BOOLEAN NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "listingId" INTEGER NOT NULL,

    CONSTRAINT "WorkingHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHour_day_listingId_key" ON "WorkingHour"("day", "listingId");

-- AddForeignKey
ALTER TABLE "WorkingHour" ADD CONSTRAINT "WorkingHour_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
