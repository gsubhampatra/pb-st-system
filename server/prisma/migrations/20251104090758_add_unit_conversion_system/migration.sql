/*
  Warnings:

  - You are about to drop the column `currentStock` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `ReportDownload` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ReportDownload` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAmount` on the `Sale` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reportType` to the `ReportDownload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNumber` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_saleId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "currentStock",
DROP COLUMN "description",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "sellingPrice" DOUBLE PRECISION,
ADD COLUMN     "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unitId" TEXT,
ALTER COLUMN "unit" SET DEFAULT 'pcs';

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs',
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ReportDownload" DROP COLUMN "date",
DROP COLUMN "type",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "reportType" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "receivedAmount",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs',
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "StockTransaction" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs',
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "conversionToBase" DOUBLE PRECISION NOT NULL,
    "isBaseUnit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitConversion" (
    "id" TEXT NOT NULL,
    "fromUnitId" TEXT NOT NULL,
    "toUnitId" TEXT NOT NULL,
    "conversionFactor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "UnitConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UnitConversion_fromUnitId_toUnitId_key" ON "UnitConversion"("fromUnitId", "toUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_fromUnitId_fkey" FOREIGN KEY ("fromUnitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_toUnitId_fkey" FOREIGN KEY ("toUnitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
