import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
// --- Create Sale ---
export const createSale = async (req, res) => {
    const { customerId, date, items, receivedAmount = 0, status = 'recorded' } = req.body;
    // 'items' should be an array like: [{ itemId: 'cuid1', quantity: 2, unitPrice: 15.00 }, ...]

    // --- Basic Input Validation ---
    if (!customerId || !date || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields: customerId, date, and non-empty items array' });
    }
    for (const item of items) {
        if (!item.itemId || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
            return res.status(400).json({ message: 'Invalid data in items array. Each item needs itemId, positive quantity, and non-negative unitPrice.' });
        }
    }

    try {
        // --- Use Prisma Transaction ---
        const result = await prisma.$transaction(async (tx) => {

            // 1. Validate Customer exists
            const customer = await tx.customer.findUnique({
                where: { id: customerId },
                select: { id: true } // Only select id for validation
            });
            if (!customer) {
                throw new Error(`Customer with ID ${customerId} not found.`);
            }

            // 2. Validate items, check stock, calculate total amount
            let totalAmount = 0;
            const saleItemsData = [];
            const itemStockUpdates = []; // To perform stock updates later

            for (const item of items) {
                // Fetch item details including current stock
                const dbItem = await tx.item.findUnique({
                    where: { id: item.itemId },
                    select: { id: true, name: true, currentStock: true }
                });

                if (!dbItem) {
                    throw new Error(`Item with ID ${item.itemId} not found.`);
                }

                // !!! CRITICAL: Check Stock Availability !!!
                if (dbItem.currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for item "${dbItem.name}" (ID: ${item.itemId}). Available: ${dbItem.currentStock}, Requested: ${item.quantity}`);
                }

                const itemTotalPrice = item.quantity * item.unitPrice;
                totalAmount += itemTotalPrice;

                // Prepare data for SaleItem creation
                saleItemsData.push({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: itemTotalPrice,
                });

                // Prepare data for stock updates and transactions
                itemStockUpdates.push({
                    itemId: item.itemId,
                    quantity: item.quantity, // Amount to decrease stock by
                });
            }

            // 3. Create the Sale record
            const newSale = await tx.sale.create({
                data: {
                    customerId: customerId,
                    date: new Date(date), // Ensure it's a Date object
                    totalAmount: totalAmount,
                    receivedAmount: receivedAmount,
                    status: status,
                    // items will be linked in the next step
                },
            });

            // 4. Create SaleItem records linked to the new Sale
            await tx.saleItem.createMany({
                data: saleItemsData.map(sItem => ({
                    ...sItem,
                    saleId: newSale.id, // Link to the created sale
                })),
            });

            // 5. Update Item stock levels and create Stock Transactions
            for (const update of itemStockUpdates) {
                // Decrement stock
                await tx.item.update({
                    where: { id: update.itemId },
                    data: {
                        currentStock: {
                            decrement: update.quantity,
                        },
                    },
                });

                // Create stock transaction record
                await tx.stockTransaction.create({
                    data: {
                        itemId: update.itemId,
                        type: 'sale',
                        quantity: -update.quantity, // Negative for sale/stock decrease
                        relatedId: newSale.id,     // Link to the sale
                        date: new Date(),          // Use current date for transaction log
                    }
                });
            }

            // Return the created sale along with its items for the response
            // Fetch it again *within the transaction* for consistency
             return tx.sale.findUnique({
                where: { id: newSale.id },
                include: {
                    customer: { select: { name: true } }, // Include customer name
                    items: {                              // Include created items
                        include: {
                            item: { select: { name: true, unit: true } } // Include item name/unit
                        }
                    }
                }
            });
        }); // End of Prisma Transaction

        res.status(201).json(result); // Send the detailed sale object back

    } catch (error) {
        console.error("Error creating sale:", error);
        // Check for specific Prisma errors or custom errors thrown in transaction
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle known errors like foreign key violations if necessary
            return res.status(400).json({ message: 'Database error creating sale.', details: error.message });
        } else if (error.message.includes("not found")) {
             // Handle 'not found' errors (Customer/Item)
             return res.status(404).json({ message: error.message });
        } else if (error.message.includes("Insufficient stock")) {
             // Handle specific stock error
             return res.status(409).json({ message: error.message }); // 409 Conflict is suitable here
        }
        res.status(500).json({ message: 'Error creating sale', error: error.message });
    }
};

// --- Get All Sales (with optional filtering/pagination) ---
export const getSales = async (req, res) => {
    const { customerNameOrPhone, startDate, endDate, status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        const whereClause = {};
        
        // Search by customer name or phone if provided
        if (customerNameOrPhone) {
            whereClause.customer = {
                OR: [
                    { name: { contains: customerNameOrPhone, mode: 'insensitive' } },
                    { phone: { contains: customerNameOrPhone, mode: 'insensitive' } }
                ]
            };
        }
        
        if (status) whereClause.status = status;
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
             // Adjust endDate to include the whole day
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                whereClause.date.lte = endOfDay;
            }
        }

        const sales = await prisma.sale.findMany({
            where: whereClause,
            include: {
                customer: { // Include basic customer info
                    select: { name: true, phone: true },
                },
                _count: { // Optionally count items per sale
                    select: { items: true }
                }
            },
            orderBy: {
                date: 'desc', // Default order by date descending
            },
            skip: skip,
            take: limitNum,
        });

        const totalSales = await prisma.sale.count({ where: whereClause });
        const totalPages = Math.ceil(totalSales / limitNum);

        res.status(200).json({
            data: sales,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: totalSales,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching sales:", error);
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};

// --- Get Sale By ID ---
export const getSaleById = async (req, res) => {
    const { id } = req.params;

    try {
        const sale = await prisma.sale.findUnique({
            where: { id: id },
            include: {
                customer: true, // Include full customer details
                items: {        // Include associated sale items
                    include: {
                        item: true // Include the actual item details for each sale item
                    }
                }
            }
        });

        if (!sale) {
            return res.status(404).json({ message: `Sale with ID ${id} not found` });
        }

        res.status(200).json(sale);
    } catch (error) {
        console.error(`Error fetching sale ${id}:`, error);
        res.status(500).json({ message: 'Error fetching sale', error: error.message });
    }
};

// --- Update Sale (Example: Update status or received amount) ---
// NOTE: Updating items within a sale is complex (often handled via returns/adjustments).
export const updateSale = async (req, res) => {
    const { id } = req.params;
    const { receivedAmount, status } = req.body;

    // Validate that at least one valid field is provided
    if (typeof receivedAmount === 'undefined' && !status) {
        return res.status(400).json({ message: 'No valid fields (receivedAmount, status) provided for update' });
    }
    if (typeof receivedAmount !== 'undefined' && typeof receivedAmount !== 'number') {
         return res.status(400).json({ message: 'Invalid receivedAmount, must be a number' });
    }
    // Add status validation if you have specific allowed statuses

    try {
        const saleToUpdate = await prisma.sale.findUnique({ where: { id } });

        if (!saleToUpdate) {
             return res.status(404).json({ message: `Sale with ID ${id} not found` });
        }

        // Optional: Add logic, e.g., prevent reducing receivedAmount below 0,
        // or validate receivedAmount against totalAmount.
        // if (typeof receivedAmount === 'number' && receivedAmount > saleToUpdate.totalAmount) {
        //     // Decide if overpayment is allowed or should be an error/warning
        // }

        const updatedSale = await prisma.sale.update({
            where: { id: id },
            data: {
                ...(typeof receivedAmount === 'number' && { receivedAmount }),
                ...(status && { status }),
            },
            include: { // Return the updated sale with details
                 customer: { select: { name: true } },
                 items: { include: { item: { select: { name: true } } } }
            }
        });
        res.status(200).json(updatedSale);
    } catch (error) {
        console.error(`Error updating sale ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return res.status(404).json({ message: `Sale with ID ${id} not found during update.` });
        }
        res.status(500).json({ message: 'Error updating sale', error: error.message });
    }
};


// --- Delete Sale ---
// WARNING: Deleting a sale requires reversing the stock updates. Consider if this should be allowed
// or if a "cancelled" status is better. If deleting, use a transaction.
export const deleteSale = async (req, res) => {
    const { id } = req.params;

    try {
        // Use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {

            // 1. Find the sale and its items to know what stock to reverse
            const saleToDelete = await tx.sale.findUnique({
                where: { id: id },
                include: {
                    items: { // Need items to know quantities and item IDs
                        select: { itemId: true, quantity: true }
                    }
                 }
            });

            if (!saleToDelete) {
                 throw new Error(`Sale with ID ${id} not found.`);
            }

             // Optional: Add business logic checks, e.g., prevent deletion if fully paid or shipped
             // if (saleToDelete.status === 'completed' || saleToDelete.receivedAmount >= saleToDelete.totalAmount) {
             //     throw new Error('Cannot delete a completed or fully paid sale. Consider cancelling instead.');
             // }
             // Optional: Check for related receipts if they link directly to sales
             // const relatedReceipts = await tx.receipt.count({ where: { /* link to sale */ } });
             // if (relatedReceipts > 0) {
             //     throw new Error('Cannot delete sale with associated receipts.');
             // }

            // 2. Reverse stock updates and delete related stock transactions
            for (const item of saleToDelete.items) {
                 // Increment stock (add back what was sold)
                await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                        currentStock: {
                            increment: item.quantity,
                        },
                    },
                });

                 // Delete the related stock transaction(s)
                 await tx.stockTransaction.deleteMany({
                     where: {
                         relatedId: id,
                         type: 'sale',
                         itemId: item.itemId // Be specific
                     }
                 });
            }

            // 3. Delete SaleItems associated with the sale
            await tx.saleItem.deleteMany({
                where: { saleId: id },
            });

            // 4. Delete the Sale record itself
            await tx.sale.delete({
                where: { id: id },
            });

            return true; // Indicate success
        }); // End of Transaction

        res.status(204).send(); // 204 No Content for successful deletion

    } catch (error) {
        console.error(`Error deleting sale ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025 can happen if the sale is deleted between the check and the final delete
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Sale with ID ${id} not found.` });
            }
             // P2003: Foreign key constraint (maybe related receipts/other things not handled)
             if (error.code === 'P2003') {
                 return res.status(400).json({ message: 'Cannot delete sale: It might be referenced in other records.' });
             }
        } else if (error.message.includes("not found")) {
             // Handle 'not found' error from the initial findUnique inside transaction
             return res.status(404).json({ message: error.message });
        }
         // Handle custom errors thrown in transaction (like "cannot delete completed sale")
         if (error.message.includes('Cannot delete')) {
             return res.status(400).json({ message: error.message });
         }

        res.status(500).json({ message: 'Error deleting sale', error: error.message });
    }
};