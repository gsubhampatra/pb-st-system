/*
  Warnings:

  - You are about to drop the column `unitId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the `Unit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnitConversion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_unitId_fkey";

-- DropForeignKey
ALTER TABLE "UnitConversion" DROP CONSTRAINT "UnitConversion_fromUnitId_fkey";

-- DropForeignKey
ALTER TABLE "UnitConversion" DROP CONSTRAINT "UnitConversion_toUnitId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "unitId",
ALTER COLUMN "unit" SET DEFAULT 'kg';

-- AlterTable
ALTER TABLE "PurchaseItem" ALTER COLUMN "unit" SET DEFAULT 'kg';

-- AlterTable
ALTER TABLE "SaleItem" ALTER COLUMN "unit" SET DEFAULT 'kg';

-- AlterTable
ALTER TABLE "StockTransaction" ALTER COLUMN "unit" SET DEFAULT 'kg';

-- DropTable
DROP TABLE "Unit";

-- DropTable
DROP TABLE "UnitConversion";
