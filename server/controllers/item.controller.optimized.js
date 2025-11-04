import prisma from "../prisma/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- Create Item ---
export const createItem = asyncHandler(async (req, res) => {
  const { name, category, basePrice, sellingPrice, stock, unit } = req.body;

  const newItem = await prisma.item.create({
    data: {
      name,
      category,
      basePrice,
      sellingPrice,
      stock,
      unit: unit || "unit",
    },
  });

  res.status(201).json(newItem);
});

// --- Get Items (with optional search & pagination) ---
export const getItems = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const whereClause = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  // Parallel execution
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      skip,
      take: Number(limit),
    }),
    prisma.item.count({ where: whereClause }),
  ]);

  res.status(200).json({
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// --- Get Item By ID ---
export const getItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await prisma.item.findUnique({ where: { id } });

  if (!item) {
    return res.status(404).json({ message: `Item with ID ${id} not found` });
  }

  res.status(200).json(item);
});

// --- Update Item ---
export const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, basePrice, sellingPrice, stock, unit } = req.body;

  const updatedItem = await prisma.item.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(category !== undefined && { category }),
      ...(basePrice !== undefined && { basePrice }),
      ...(sellingPrice !== undefined && { sellingPrice }),
      ...(stock !== undefined && { stock }),
      ...(unit && { unit }),
    },
  });

  res.status(200).json(updatedItem);
});

// --- Delete Item ---
export const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.item.delete({ where: { id } });

  res.status(204).send();
});

// --- Update Stock (called after purchase/sale) ---
export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== "number") {
    return res.status(400).json({ message: "Quantity must be a number" });
  }

  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    return res.status(404).json({ message: `Item with ID ${id} not found` });
  }

  const newStock = item.stock + quantity;
  if (newStock < 0) {
    return res.status(400).json({ message: "Insufficient stock available" });
  }

  const updatedItem = await prisma.item.update({
    where: { id },
    data: { stock: newStock },
  });

  res.status(200).json(updatedItem);
});
