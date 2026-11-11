-- CreateTable
CREATE TABLE "RentalReturn" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "damageCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "additionalCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "rentalItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalReturn_rentalId_idx" ON "RentalReturn"("rentalId");

-- CreateIndex
CREATE INDEX "RentalReturn_returnDate_idx" ON "RentalReturn"("returnDate");

-- CreateIndex
CREATE INDEX "RentalReturnItem_returnId_idx" ON "RentalReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "RentalReturnItem_rentalItemId_idx" ON "RentalReturnItem"("rentalItemId");

-- AddForeignKey
ALTER TABLE "RentalReturn" ADD CONSTRAINT "RentalReturn_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReturnItem" ADD CONSTRAINT "RentalReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "RentalReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReturnItem" ADD CONSTRAINT "RentalReturnItem_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
