/*
  Warnings:

  - You are about to drop the column `dailyRentalRate` on the `Rental` table. All the data in the column will be lost.
  - You are about to drop the column `materialId` on the `Rental` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Rental` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_materialId_fkey";

-- DropIndex
DROP INDEX "Rental_materialId_idx";

-- AlterTable
ALTER TABLE "Rental" DROP COLUMN "dailyRentalRate",
DROP COLUMN "materialId",
DROP COLUMN "quantity";

-- CreateTable
CREATE TABLE "RentalItem" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dailyRentalRate" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "RentalItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalItem_rentalId_idx" ON "RentalItem"("rentalId");

-- CreateIndex
CREATE INDEX "RentalItem_materialId_idx" ON "RentalItem"("materialId");

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
