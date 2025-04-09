import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
// --- Create Supplier ---
export const createSupplier = async (req, res) => {
    const { name, phone, address } = req.body;

    // Basic validation
    if (!name) {
        return res.status(400).json({ message: 'Supplier name is required' });
    }

    try {
        const newSupplier = await prisma.supplier.create({
            data: {
                name,
                phone,    // Optional
                address,  // Optional
            },
        });
        res.status(201).json(newSupplier); // 201 Created
    } catch (error) {
        console.error("Error creating supplier:", error);
        // You could add specific checks here, e.g., if you later add a unique constraint on phone/email
        res.status(500).json({ message: 'Error creating supplier', error: error.message });
    }
};

// --- Get/Search Suppliers ---
// This single function handles both fetching all suppliers and searching by name or phone
export const getSuppliers = async (req, res) => {
    const { search } = req.query; // Use 'search' as the query parameter

    try {
        let whereClause = {}; // Default: no filter (get all)

        if (search) {
            // If search query is provided, filter by name OR phone
            whereClause = {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                    {
                        phone: {
                            contains: search,
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                ],
            };
        }

        const suppliers = await prisma.supplier.findMany({
            where: whereClause,
            orderBy: {
                name: 'asc', // Optional: order results by name
            },
            // You could add pagination here later if needed
            // take: parseInt(limit) || 10,
            // skip: (parseInt(page) - 1) * (parseInt(limit) || 10),
        });

        res.status(200).json(suppliers);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
    }
};

// --- Get Supplier By ID --- (Good practice to have this too)
export const getSupplierById = async (req, res) => {
    const { id } = req.params;

    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: id },
            // include: { purchases: true } // Optionally include related data
        });

        if (!supplier) {
            return res.status(404).json({ message: `Supplier with ID ${id} not found` });
        }

        res.status(200).json(supplier);
    } catch (error) {
        console.error(`Error fetching supplier ${id}:`, error);
        res.status(500).json({ message: 'Error fetching supplier', error: error.message });
    }
};


// --- Update Supplier --- (Example - You might need this later)
export const updateSupplier = async (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;

     // Basic validation: Ensure at least one field is being updated
    if (!name && !phone && !address) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    try {
        const updatedSupplier = await prisma.supplier.update({
            where: { id: id },
            data: {
                 // Only include fields that are present in the request body
                 ...(name && { name }),
                 ...(phone !== undefined && { phone }), // Allow setting phone to null/empty
                 ...(address !== undefined && { address }), // Allow setting address to null/empty
            },
        });
        res.status(200).json(updatedSupplier);
    } catch (error) {
        console.error(`Error updating supplier ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return res.status(404).json({ message: `Supplier with ID ${id} not found` });
        }
        res.status(500).json({ message: 'Error updating supplier', error: error.message });
    }
};

// --- Delete Supplier --- (Example - You might need this later)
export const deleteSupplier = async (req, res) => {
    const { id } = req.params;

    try {
        // Optional: Add checks here if the supplier has associated purchases/payments before deleting
        // const relatedPurchases = await prisma.purchase.count({ where: { supplierId: id } });
        // if (relatedPurchases > 0) { ... }

        await prisma.supplier.delete({
            where: { id: id },
        });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Error deleting supplier ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Supplier with ID ${id} not found` });
            }
             if (error.code === 'P2003') {
                 return res.status(400).json({ message: 'Cannot delete supplier: It is referenced in other records (e.g., purchases, payments).' });
             }
        }
        res.status(500).json({ message: 'Error deleting supplier', error: error.message });
    }
};