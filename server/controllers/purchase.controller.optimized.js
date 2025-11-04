import prisma from "../prisma/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- Create Purchase ---
export const createPurchase = asyncHandler(async (req, res) => {
  const {
    supplierId,
    invoiceNo,
    date,
    items,
    totalAmount,
    paidAmount = 0,
    status = "recorded",
  } = req.body;

  // Validate required fields
  if (!invoiceNo || !supplierId || !date || !items || items.length === 0) {
    return res.status(400).json({ 
      message: "Missing required fields: invoiceNo, supplierId, date, and items" 
    });
  }

  // Use Prisma Transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create the Purchase record
    const newPurchase = await tx.purchase.create({
      data: {
        supplierId,
        invoiceNo,
        date: new Date(date),
        totalAmount,
        paidAmount,
        status,
      },
    });

    // Prepare purchase items data
    const purchaseItemsData = items.map((item) => ({
      purchaseId: newPurchase.id,
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      unit: item.unit || 'kg', // Default to 'kg'
    }));

    // Create PurchaseItem records
    await tx.purchaseItem.createMany({
      data: purchaseItemsData,
    });

    // Update stock and create transactions sequentially to avoid interactive tx issues
    for (const item of items) {
      // Update item stock only (no stock transaction record)
      await tx.item.update({
        where: { id: item.itemId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Return complete purchase with relations
    return tx.purchase.findUnique({
      where: { id: newPurchase.id },
      include: {
        supplier: { select: { name: true, phone: true } },
        items: {
          include: {
            item: { select: { name: true, unit: true } },
          },
        },
      },
    });
  }, { timeout: 15000, maxWait: 5000 });

  res.status(201).json(result);
});

// --- Get All Purchases (with filtering/pagination) ---
export const getPurchases = asyncHandler(async (req, res) => {
  const {
    supplierNameORPhone,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const whereClause = {};

  // Filter by supplier name or phone
  if (supplierNameORPhone) {
    whereClause.supplier = {
      OR: [
        { name: { contains: supplierNameORPhone, mode: "insensitive" } },
        { phone: { contains: supplierNameORPhone } },
      ],
    };
  }

  if (status) whereClause.status = status;
  
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.date.lte = end;
    }
  }

  // Execute queries in parallel
  const [purchases, totalPurchases] = await Promise.all([
    prisma.purchase.findMany({
      where: whereClause,
      include: {
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.purchase.count({ where: whereClause }),
  ]);

  res.status(200).json({
    data: purchases,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalPurchases / limitNum),
      totalItems: totalPurchases,
      itemsPerPage: limitNum,
    },
  });
});

// --- Get Purchase By ID ---
export const getPurchaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: { item: true },
      },
    },
  });

  if (!purchase) {
    return res.status(404).json({ message: `Purchase with ID ${id} not found` });
  }

  res.status(200).json(purchase);
});

// --- Update Purchase ---
export const updatePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, status, totalAmount } = req.body;

  const updatedPurchase = await prisma.purchase.update({
    where: { id },
    data: {
      ...(typeof paidAmount === "number" && { paidAmount }),
      ...(typeof totalAmount === "number" && { totalAmount }),
      ...(status && { status }),
    },
    include: {
      supplier: { select: { name: true } },
      items: { include: { item: { select: { name: true } } } },
    },
  });

  res.status(200).json(updatedPurchase);
});

// --- Delete Purchase ---
export const deletePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async (tx) => {
    // Find purchase with items
    const purchase = await tx.purchase.findUnique({
      where: { id },
      include: { items: { select: { itemId: true, quantity: true } } },
    });

    if (!purchase) {
      const error = new Error(`Purchase with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Reverse stock updates sequentially to avoid interactive tx issues
    for (const item of purchase.items) {
      await tx.item.update({
        where: { id: item.itemId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // No stock transactions to delete (feature removed)

    // Delete purchase items
    await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

    // Delete purchase
    await tx.purchase.delete({ where: { id } });
  });

  res.status(204).send();
});
