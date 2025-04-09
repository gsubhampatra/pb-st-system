import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
// --- Create Receipt ---
export const createReceipt = async (req, res) => {
    const { customerId, amount, method, accountId, date, note } = req.body;

    // --- Basic Input Validation ---
    if (!customerId || typeof amount !== 'number' || amount <= 0 || !method || !date) {
        return res.status(400).json({ message: 'Missing required fields: customerId, positive amount, method, date' });
    }
    if (!['cash', 'account'].includes(method)) {
        return res.status(400).json({ message: "Invalid method. Must be 'cash' or 'account'." });
    }
    if (method === 'account' && !accountId) {
        return res.status(400).json({ message: 'accountId is required when method is "account"' });
    }
    if (method === 'cash' && accountId) {
        // Optional: Decide behavior if accountId provided with cash
        console.warn("accountId provided for cash receipt, it will be ignored.");
        // Or return res.status(400).json({ message: 'accountId should not be provided for cash receipts' });
    }

    try {
        // --- Use Prisma Transaction (important for updating account balance) ---
        const newReceipt = await prisma.$transaction(async (tx) => {

            // 1. Validate Customer exists
            const customer = await tx.customer.findUnique({
                where: { id: customerId },
                select: { id: true }
            });
            if (!customer) {
                throw new Error(`Customer with ID ${customerId} not found.`);
            }

            let validatedAccountId = null;
            // 2. If method is 'account', validate Account and update balance
            if (method === 'account') {
                const account = await tx.account.findUnique({
                    where: { id: accountId }
                });
                if (!account) {
                    throw new Error(`Account with ID ${accountId} not found.`);
                }

                // Increment account balance (receiving money)
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            increment: amount, // Increase balance
                        },
                    },
                });
                validatedAccountId = accountId; // Store validated ID
            }

            // 3. Create the Receipt record
            const receipt = await tx.receipt.create({
                data: {
                    customerId: customerId,
                    amount: amount,
                    method: method,
                    accountId: validatedAccountId, // Use null if cash, validated ID if account
                    date: new Date(date),
                    note: note, // Optional
                },
                include: { // Include related data in the response
                    customer: { select: { name: true } },
                    account: { select: { bankName: true, accountNumber: true } } // Include if account was used
                }
            });

            return receipt; // Return the created receipt from the transaction
        }); // End of Prisma Transaction

        res.status(201).json(newReceipt);

    } catch (error) {
        console.error("Error creating receipt:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ message: 'Database error creating receipt.', details: error.message });
        } else if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message }); // Customer or Account not found
        }
        res.status(500).json({ message: 'Error creating receipt', error: error.message });
    }
};

// --- Get All Receipts (with optional filtering/pagination) ---
export const getReceipts = async (req, res) => {
    const { customerId, accountId, method, startDate, endDate, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        const whereClause = {};
        if (customerId) whereClause.customerId = customerId;
        if (accountId) whereClause.accountId = accountId;
        if (method) whereClause.method = method;
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                whereClause.date.lte = endOfDay;
            }
        }

        const receipts = await prisma.receipt.findMany({
            where: whereClause,
            include: {
                customer: { select: { name: true } },
                account: { select: { bankName: true, accountNumber: true } },
            },
            orderBy: {
                date: 'desc',
            },
            skip: skip,
            take: limitNum,
        });

        const totalReceipts = await prisma.receipt.count({ where: whereClause });
        const totalPages = Math.ceil(totalReceipts / limitNum);

        res.status(200).json({
            data: receipts,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: totalReceipts,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching receipts:", error);
        res.status(500).json({ message: 'Error fetching receipts', error: error.message });
    }
};

// --- Get Receipt By ID ---
export const getReceiptById = async (req, res) => {
    const { id } = req.params;

    try {
        const receipt = await prisma.receipt.findUnique({
            where: { id: id },
            include: {
                customer: true, // Include full customer details
                account: true,  // Include full account details (null if cash)
            }
        });

        if (!receipt) {
            return res.status(404).json({ message: `Receipt with ID ${id} not found` });
        }

        res.status(200).json(receipt);
    } catch (error) {
        console.error(`Error fetching receipt ${id}:`, error);
        res.status(500).json({ message: 'Error fetching receipt', error: error.message });
    }
};

// --- Update Receipt ---
// Again, limiting updates to non-financial fields like 'note' or 'date'.
export const updateReceipt = async (req, res) => {
    const { id } = req.params;
    const { date, note } = req.body;

    if (date === undefined && note === undefined) {
        return res.status(400).json({ message: 'No valid fields (date, note) provided for update' });
    }

    try {
        const receiptToUpdate = await prisma.receipt.findUnique({ where: { id } });
        if (!receiptToUpdate) {
             return res.status(404).json({ message: `Receipt with ID ${id} not found` });
        }

        // Transaction not strictly needed for only date/note, but good practice if more complex updates were added
        const updatedReceipt = await prisma.receipt.update({
            where: { id: id },
            data: {
                ...(date && { date: new Date(date) }),
                ...(note !== undefined && { note }),
            },
             include: { // Return the updated receipt with details
                 customer: { select: { name: true } },
                 account: { select: { bankName: true, accountNumber: true } }
            }
        });
        res.status(200).json(updatedReceipt);
    } catch (error) {
        console.error(`Error updating receipt ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return res.status(404).json({ message: `Receipt with ID ${id} not found during update.` });
        }
        res.status(500).json({ message: 'Error updating receipt', error: error.message });
    }
};


// --- Delete Receipt ---
// WARNING: Reverses account balance changes. Use cautiously.
export const deleteReceipt = async (req, res) => {
    const { id } = req.params;

    try {
        // Use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {

            // 1. Find the receipt to get its details
            const receiptToDelete = await tx.receipt.findUnique({
                where: { id: id },
                select: { amount: true, method: true, accountId: true }
            });

            if (!receiptToDelete) {
                 throw new Error(`Receipt with ID ${id} not found.`);
            }

            // 2. If it was an account receipt, reverse the balance change
            if (receiptToDelete.method === 'account' && receiptToDelete.accountId) {
                 const accountExists = await tx.account.findUnique({ where: { id: receiptToDelete.accountId }, select: {id: true}});
                 if (!accountExists) {
                    console.error(`Account ${receiptToDelete.accountId} associated with receipt ${id} not found during deletion. Balance cannot be reversed.`);
                    throw new Error(`Failed to reverse balance: Account ${receiptToDelete.accountId} not found.`);
                 }

                // Decrement account balance (reverse the received money)
                await tx.account.update({
                    where: { id: receiptToDelete.accountId },
                    data: {
                        balance: {
                            decrement: receiptToDelete.amount, // Decrease balance
                        },
                    },
                });
                 // Optional: Add check for balance going negative if necessary
                 // const updatedAccount = await tx.account.findUnique(...);
                 // if (updatedAccount.balance < 0) throw new Error(...)
            }

            // 3. Delete the Receipt record itself
            await tx.receipt.delete({
                where: { id: id },
            });

            return true; // Indicate success
        }); // End of Transaction

        res.status(204).send(); // 204 No Content for successful deletion

    } catch (error) {
        console.error(`Error deleting receipt ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Receipt with ID ${id} not found.` });
            }
         } else if (error.message.includes("not found")) {
             return res.status(404).json({ message: error.message });
         } else if (error.message.includes('Failed to reverse balance')) {
             return res.status(500).json({ message: error.message });
         }

        res.status(500).json({ message: 'Error deleting receipt', error: error.message });
    }
};