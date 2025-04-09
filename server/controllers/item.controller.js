import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
// --- Create Item ---
export const createItem = async (req, res) => {
    const { name, description, unit, basePrice, currentStock } = req.body;

    // Basic validation
    if (!name || !unit || typeof basePrice !== 'number' || typeof currentStock !== 'number') {
        return res.status(400).json({ message: 'Missing or invalid required fields: name, unit, basePrice, currentStock' });
    }

    try {
        const newItem = await prisma.item.create({
            data: {
                name,
                description, // Optional, will be null if not provided
                unit,
                basePrice,
                currentStock,
            },
        });
        res.status(201).json(newItem); // 201 Created
    } catch (error) {
        console.error("Error creating item:", error);
        // Handle potential unique constraint errors if needed, though Item doesn't have unique fields besides id
        res.status(500).json({ message: 'Error creating item', error: error.message });
    }
};

// --- Get All Items ---
export const getAllItems = async (req, res) => {
    // Optional: Add pagination/filtering later via req.query
    // const { page = 1, limit = 10, search = '' } = req.query;
    try {
        const items = await prisma.item.findMany({
             // Add where, skip, take for filtering/pagination if needed
             orderBy: { name: 'asc' } // Optional: order by name
        });
        res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: 'Error fetching items', error: error.message });
    }
};

// --- Get Item By ID ---
export const getItemById = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await prisma.item.findUnique({
            where: { id: id },
            // Optionally include related data if needed in the future
            // include: { purchaseItems: true, saleItems: true }
        });

        if (!item) {
            return res.status(404).json({ message: `Item with ID ${id} not found` });
        }

        res.status(200).json(item);
    } catch (error) {
        console.error(`Error fetching item ${id}:`, error);
        res.status(500).json({ message: 'Error fetching item', error: error.message });
    }
};

// --- Update Item ---
export const updateItem = async (req, res) => {
    const { id } = req.params;
    const { name, description, unit, basePrice, currentStock } = req.body;

    // Basic validation: Ensure at least one field is being updated
    if (!name && !description && !unit && typeof basePrice !== 'number' && typeof currentStock !== 'number') {
        return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    try {
        const updatedItem = await prisma.item.update({
            where: { id: id },
            data: {
                // Only include fields that are present in the request body
                ...(name && { name }),
                ...(description !== undefined && { description }), // Allow setting description to null/empty
                ...(unit && { unit }),
                ...(typeof basePrice === 'number' && { basePrice }),
                ...(typeof currentStock === 'number' && { currentStock }),
            },
        });
        res.status(200).json(updatedItem);
    } catch (error) {
        console.error(`Error updating item ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record to update not found
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Item with ID ${id} not found` });
            }
        }
        res.status(500).json({ message: 'Error updating item', error: error.message });
    }
};

// --- Delete Item ---
export const deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        // Optional: Check if item is used in Purchases or Sales before deleting
        // const relatedPurchases = await prisma.purchaseItem.count({ where: { itemId: id } });
        // const relatedSales = await prisma.saleItem.count({ where: { itemId: id } });
        // if (relatedPurchases > 0 || relatedSales > 0) {
        //     return res.status(400).json({ message: 'Cannot delete item: It is associated with existing purchases or sales.' });
        // }

        await prisma.item.delete({
            where: { id: id },
        });
        res.status(204).send(); // 204 No Content - Standard for successful delete
    } catch (error) {
        console.error(`Error deleting item ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record to delete not found
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Item with ID ${id} not found` });
            }
            // P2003: Foreign key constraint failed (item is related to other records)
            // Depending on your schema's onDelete behavior, this might occur.
             if (error.code === 'P2003') {
                 return res.status(400).json({ message: 'Cannot delete item: It is referenced in other records (e.g., purchases, sales, stock transactions).' });
             }
        }
        res.status(500).json({ message: 'Error deleting item', error: error.message });
    }
};