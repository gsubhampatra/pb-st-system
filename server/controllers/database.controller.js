import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../prisma/prisma.js";

/**
 * Clear all data from the database
 * WARNING: This is a destructive operation!
 */
export const clearDatabase = asyncHandler(async (req, res) => {
  // Delete all records in reverse order of dependencies
  await prisma.$transaction([
    // Delete transaction records (stock transactions removed)
    prisma.reportDownload.deleteMany(),

    // Delete payment and receipt records
    prisma.payment.deleteMany(),
    prisma.receipt.deleteMany(),

    // Delete purchase and sale items first (foreign key constraints)
    prisma.purchaseItem.deleteMany(),
    prisma.saleItem.deleteMany(),

    // Delete purchases and sales
    prisma.purchase.deleteMany(),
    prisma.sale.deleteMany(),

    // Delete accounts
    prisma.account.deleteMany(),

    // Delete items
    prisma.item.deleteMany(),

    // Delete unit conversions first (foreign key constraints)
  // Unit system removed; skip unitConversion and unit deletions

    // Delete customers and suppliers
    prisma.customer.deleteMany(),
    prisma.supplier.deleteMany(),

    // Delete users (optional - uncomment if needed)
    // prisma.user.deleteMany(),
  ]);

  res.status(200).json({
    success: true,
    message: "Database cleared successfully. All data has been deleted.",
  });
});


/**
 * Reset database with seed data
 */
export const resetDatabase = asyncHandler(async (req, res) => {
  // First clear all data
  await prisma.$transaction([
    prisma.reportDownload.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.receipt.deleteMany(),
    prisma.purchaseItem.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.account.deleteMany(),
    prisma.item.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.supplier.deleteMany(),
  ]);

  // Now add seed data
 const items = [
  {
    name: 'ଚାଉଳ (Rice)',
    category: 'Grains',
    basePrice: 25,
    sellingPrice: 15,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ବିରି (Black Gram / Urad Dal)',
    category: 'Pulses',
    basePrice: 55,
    sellingPrice: 25,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ମୁଗ (Green Gram / Moong Dal)',
    category: 'Pulses',
    basePrice: 68,
    sellingPrice: 25,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'କୋଳଥା (Horse Gram)',
    category: 'Pulses',
    basePrice: 28,
    sellingPrice: 25,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ଧାନ (Paddy)',
    category: 'Grains',
    basePrice: 18,
    sellingPrice: 20,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ଗମ ଚାଉଳ (Broken Rice)',
    category: 'Grains',
    basePrice: 23,
    sellingPrice: 15,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ରିଜେକ୍ସନ୍ ଚାଉଳ (Rejected Rice)',
    category: 'Grains',
    basePrice: 21,
    sellingPrice: 10,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ଅରୁଆ ଖୁଦ  (Raw Broken Rice )',
    category: 'Grains',
    basePrice: 20,
    sellingPrice: 10,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ଉସୁନା ଖୁଦ  (Parboiled Broken Rice )',
    category: 'Grains',
    basePrice: 20,
    sellingPrice: 15,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ବିଲା ଚନା (Split Bengal Gram / Chana Dal)',
    category: 'Pulses',
    basePrice: 31,
    sellingPrice: 25,
    stock: 50,
    unit: 'Kg',
  },
  {
    name: 'ଅଣି ଚନା (Whole Bengal Gram / Whole Chana)',
    category: 'Pulses',
    basePrice: 25,
    sellingPrice: 25,
    stock: 0,
    unit: 'Kg',
  },
  {
    name: 'ରାସି (Sesame Seeds)',
    category: 'Spices',
    basePrice: 50,
    sellingPrice: 75,
    stock: 0,
    unit: 'Kg',
  },
];

  // Create items
  await Promise.all(items.map((item) => prisma.item.create({ data: item })));


  res.status(200).json({
    success: true,
    message: "Database reset successfully.",
  });
});
