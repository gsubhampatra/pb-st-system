import prisma from "../prisma/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- Create Supplier ---
export const createSupplier = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const newSupplier = await prisma.supplier.create({
    data: { name, phone, address },
  });
  
  res.status(201).json(newSupplier);
});

// --- Get/Search Suppliers ---
export const getSuppliers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const whereClause = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const suppliers = await prisma.supplier.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
  });

  res.status(200).json(suppliers);
});

// --- Get Supplier By ID ---
export const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
  });

  if (!supplier) {
    return res.status(404).json({ message: `Supplier with ID ${id} not found` });
  }

  res.status(200).json(supplier);
});

// --- Update Supplier ---
export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;

  const updatedSupplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
    },
  });

  res.status(200).json(updatedSupplier);
});

// --- Delete Supplier ---
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.supplier.delete({ where: { id } });
  
  res.status(204).send();
});
