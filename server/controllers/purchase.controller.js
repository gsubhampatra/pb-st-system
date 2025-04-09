import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
// --- Create Purchase ---
export const createPurchase = async (req, res) => {
    const { supplierId, date, items,totalAmount, paidAmount = 0, status = 'recorded' } = req.body;
    // 'items' should be an array like: [{ itemId: 'cuid1', quantity: 10, unitPrice: 5.50 }, ...]

    // --- Basic Input Validation ---
    if (!supplierId || !date || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields: supplierId, date, and non-empty items array' });
    }
    for (const item of items) {
        if (!item.itemId || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
            return res.status(400).json({ message: 'Invalid data in items array. Each item needs itemId, positive quantity, and non-negative unitPrice.' });
        }
    }

    try {
        // --- Use Prisma Transaction ---
        // This ensures all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {

         
            // 2. Calculate total amount and prepare item data
            const purchaseItemsData = [];
            const itemStockUpdates = []; // To perform stock updates later

            for (const item of items) {
              // Prepare data for PurchaseItem creation
                purchaseItemsData.push({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                });

                // Prepare data for stock updates and transactions
                itemStockUpdates.push({
                    itemId: item.itemId,
                    quantity: item.quantity,
                });
            }

            // 3. Create the Purchase record
            const newPurchase = await tx.purchase.create({
                data: {
                    supplierId: supplierId,
                    date: new Date(date), // Ensure it's a Date object
                    totalAmount: totalAmount,
                    paidAmount: paidAmount,
                    status: status,
                    // items will be linked in the next step
                },
            });

            // 4. Create PurchaseItem records linked to the new Purchase
            await tx.purchaseItem.createMany({
                data: purchaseItemsData.map(pItem => ({
                    ...pItem,
                    purchaseId: newPurchase.id, // Link to the created purchase
                })),
            });

            // 5. Update Item stock levels and create Stock Transactions
            for (const update of itemStockUpdates) {
                // Increment stock
                await tx.item.update({
                    where: { id: update.itemId },
                    data: {
                        currentStock: {
                            increment: update.quantity,
                        },
                    },
                });

                // Create stock transaction record
                await tx.stockTransaction.create({
                    data: {
                        itemId: update.itemId,
                        type: 'purchase',
                        quantity: update.quantity, // Positive for purchase
                        relatedId: newPurchase.id, // Link to the purchase
                        date: new Date(), // Use current date for transaction log
                    }
                });
            }

            // Return the created purchase along with its items for the response
            // Need to fetch it again *within the transaction* if we want items included
             return tx.purchase.findUnique({
                where: { id: newPurchase.id },
                include: {
                    supplier: { select: { name: true } }, // Include supplier name
                    items: {                              // Include created items
                        include: {
                            item: { select: { name: true, unit: true } } // Include item name/unit
                        }
                    }
                }
            });
        }); // End of Prisma Transaction

        res.status(201).json(result); // Send the detailed purchase object back

    } catch (error) {
        console.error("Error creating purchase:", error);
        // Check for specific Prisma errors or custom errors thrown in transaction
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle known errors like foreign key violations if necessary
            return res.status(400).json({ message: 'Database error creating purchase.', details: error.message });
        } else if (error.message.includes("not found")) {
             // Handle 'not found' errors thrown inside transaction
             return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error creating purchase', error: error.message });
    }
};


// --- Get All Purchases (with optional filtering/pagination) ---
export const getPurchases = async (req, res) => {
    const { supplierId, startDate, endDate, status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        const whereClause = {};
        if (supplierId) whereClause.supplierId = supplierId;
        if (status) whereClause.status = status;
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
            if (endDate) whereClause.date.lte = new Date(endDate); // Consider adjusting to end of day if needed
        }

        const purchases = await prisma.purchase.findMany({
            where: whereClause,
            include: {
                supplier: { // Include basic supplier info
                    select: { name: true },
                },
                _count: { // Optionally count items per purchase
                    select: { items: true }
                }
            },
            orderBy: {
                date: 'desc', // Default order by date descending
            },
            skip: skip,
            take: limitNum,
        });

        const totalPurchases = await prisma.purchase.count({ where: whereClause });
        const totalPages = Math.ceil(totalPurchases / limitNum);

        res.status(200).json({
            data: purchases,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: totalPurchases,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).json({ message: 'Error fetching purchases', error: error.message });
    }
};

// --- Get Purchase By ID ---
export const getPurchaseById = async (req, res) => {
    const { id } = req.params;

    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id: id },
            include: {
                supplier: true, // Include full supplier details
                items: {        // Include associated purchase items
                    include: {
                        item: true // Include the actual item details for each purchase item
                    }
                }
            }
        });

        if (!purchase) {
            return res.status(404).json({ message: `Purchase with ID ${id} not found` });
        }

        res.status(200).json(purchase);
    } catch (error) {
        console.error(`Error fetching purchase ${id}:`, error);
        res.status(500).json({ message: 'Error fetching purchase', error: error.message });
    }
};

// --- Update Purchase (Example: Update status or paid amount) ---
// NOTE: Updating items within a purchase is complex (requires reversing/re-applying stock changes).
// This example focuses on simpler updates.
export const updatePurchase = async (req, res) => {
    const { id } = req.params;
    const { paidAmount, status, items,totalAmount } = req.body;

    // Validate that at least one valid field is provided
    if (typeof paidAmount === 'undefined' && !status && !items) {
        return res.status(400).json({ message: 'No valid fields (paidAmount, status, items) provided for update' });
    }
    if (typeof paidAmount !== 'undefined' && typeof paidAmount !== 'number') {
         return res.status(400).json({ message: 'Invalid paidAmount, must be a number' });
    }
    if (items && !Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid items, must be an array' });
    }
    if (items) {
        for (const item of items) {
            if (typeof item.itemId !== 'string' || typeof item.quantity !== 'number') {
                return res.status(400).json({ message: 'Invalid item, must contain itemId and quantity' });
            }
        }
    }
    // Add status validation if you have specific allowed statuses

    try {
        const purchaseToUpdate = await prisma.purchase.findUnique({ where: { id } });

        if (!purchaseToUpdate) {
             return res.status(404).json({ message: `Purchase with ID ${id} not found` });
        }

        // You might add logic here, e.g., prevent reducing paidAmount below 0,
        // or ensure paidAmount doesn't exceed totalAmount (unless overpayment is allowed)

        // Update the purchase items
        if (items) {
            for (const item of items) {
                const itemToUpdate = await prisma.purchaseItem.findFirst({ where: { itemId: item.itemId, purchaseId: id } });
                if (!itemToUpdate) {
                    return res.status(404).json({ message: `Purchase item with ID ${item.itemId} not found` });
                }
                await prisma.purchaseItem.update({
                    where: { id: itemToUpdate.id },
                    data: {
                        quantity: item.quantity,
                    },
                });
            }
        }

        const updatedPurchase = await prisma.purchase.update({
            where: { id: id },
            data: {
                ...(typeof paidAmount === 'number' && { paidAmount }),
                ...(typeof totalAmount === 'number' && { totalAmount }),
                ...(status && { status }),
            },
            include: { // Return the updated purchase with details
                 supplier: { select: { name: true } },
                 items: { include: { item: { select: { name: true } } } }
            }
        });
        res.status(200).json(updatedPurchase);
    } catch (error) {
        console.error(`Error updating purchase ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             // This check might be redundant due to the findUnique check above, but good practice
             return res.status(404).json({ message: `Purchase with ID ${id} not found during update.` });
        }
        res.status(500).json({ message: 'Error updating purchase', error: error.message });
    }
};


// --- Delete Purchase ---
// WARNING: Deleting a purchase requires reversing the stock updates.
export const deletePurchase = async (req, res) => {
    const { id } = req.params;

    try {
        // Use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {

            // 1. Find the purchase and its items to know what stock to reverse
            const purchaseToDelete = await tx.purchase.findUnique({
                where: { id: id },
                include: {
                    items: { // Need items to know quantities and item IDs
                        select: { itemId: true, quantity: true }
                    }
                 }
            });

            if (!purchaseToDelete) {
                // Throw error inside transaction to cause rollback if needed elsewhere
                 throw new Error(`Purchase with ID ${id} not found.`);
            }

             // Optional: Check if payments have been made via the Payment model if it links to Purchase
             // const relatedPayments = await tx.payment.count({ where: { /* link to purchase */ } });
             // if (relatedPayments > 0) {
             //     throw new Error('Cannot delete purchase with associated payments.');
             // }

            // 2. Reverse stock updates and delete related stock transactions
            for (const item of purchaseToDelete.items) {
                 // Decrement stock
                await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                        currentStock: {
                            decrement: item.quantity,
                        },
                    },
                });
                // Optional: Add a check here to prevent stock going negative if required by business logic
                // const updatedItem = await tx.item.findUnique... if (updatedItem.currentStock < 0) throw...

                 // Delete the related stock transaction(s)
                 await tx.stockTransaction.deleteMany({
                     where: {
                         relatedId: id,
                         type: 'purchase',
                         itemId: item.itemId // Be specific if multiple items updated stock
                     }
                 });
            }

            // 3. Delete PurchaseItems associated with the purchase
            await tx.purchaseItem.deleteMany({
                where: { purchaseId: id },
            });

            // 4. Delete the Purchase record itself
            await tx.purchase.delete({
                where: { id: id },
            });

            return true; // Indicate success
        }); // End of Transaction

        res.status(204).send(); // 204 No Content for successful deletion

    } catch (error) {
        console.error(`Error deleting purchase ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025 can happen if the purchase is deleted between the check and the final delete
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Purchase with ID ${id} not found.` });
            }
             // P2003: Foreign key constraint (maybe related payments/other things not handled)
             if (error.code === 'P2003') {
                 return res.status(400).json({ message: 'Cannot delete purchase: It might be referenced in other records (e.g., payments).' });
             }
        } else if (error.message.includes("not found")) {
             // Handle 'not found' error from the initial findUnique inside transaction
             return res.status(404).json({ message: error.message });
        }
         // Handle custom errors thrown in transaction (like payment check)
         if (error.message.includes('Cannot delete purchase with associated payments')) {
             return res.status(400).json({ message: error.message });
         }

        res.status(500).json({ message: 'Error deleting purchase', error: error.message });
    }
};