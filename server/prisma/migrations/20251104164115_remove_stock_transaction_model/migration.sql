/*
  Warnings:

  - You are about to drop the `StockTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockTransaction" DROP CONSTRAINT "StockTransaction_itemId_fkey";

-- DropTable
DROP TABLE "StockTransaction";
