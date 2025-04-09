import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";

// --- Create Account ---
export const createAccount = async (req, res) => {
    const { bankName, accountNumber, accountHolder, balance = 0 } = req.body;

    // Basic validation
    if (!bankName || !accountNumber || !accountHolder) {
        return res.status(400).json({ message: 'Missing required fields: bankName, accountNumber, accountHolder' });
    }
    if (typeof balance !== 'number') {
        return res.status(400).json({ message: 'Initial balance must be a number' });
    }

    try {
        // Optional: Check if accountNumber already exists for the same bank (if needed)
        // const existing = await prisma.account.findFirst({ where: { bankName, accountNumber } });
        // if (existing) return res.status(409).json({ message: 'Account with this number already exists for this bank.'})

        const newAccount = await prisma.account.create({
            data: {
                bankName,
                accountNumber,
                accountHolder,
                balance, // Use provided initial balance or default 0
            },
        });
        res.status(201).json(newAccount); // 201 Created
    } catch (error) {
        console.error("Error creating account:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle potential unique constraints if you add them later
            if (error.code === 'P2002') {
                 return res.status(409).json({ message: 'An account with similar unique details already exists.' });
            }
        }
        res.status(500).json({ message: 'Error creating account', error: error.message });
    }
};

// --- Get All Accounts (with optional search) ---
export const getAccounts = async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        let whereClause = {};
        if (search) {
            whereClause = {
                OR: [
                    { bankName: { contains: search, mode: 'insensitive' } },
                    { accountNumber: { contains: search, mode: 'insensitive' } },
                    { accountHolder: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const accounts = await prisma.account.findMany({
            where: whereClause,
            orderBy: { bankName: 'asc' },
            skip: skip,
            take: limitNum,
             // Optionally include counts of related transactions
             include: {
                 _count: {
                     select: { payments: true, receipts: true }
                 }
             }
        });

        const totalAccounts = await prisma.account.count({ where: whereClause });
        const totalPages = Math.ceil(totalAccounts / limitNum);

         res.status(200).json({
            data: accounts,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: totalAccounts,
                itemsPerPage: limitNum,
            },
        });

    } catch (error) {
        console.error("Error fetching accounts:", error);
        res.status(500).json({ message: 'Error fetching accounts', error: error.message });
    }
};

// --- Get Account By ID ---
export const getAccountById = async (req, res) => {
    const { id } = req.params;

    try {
        const account = await prisma.account.findUnique({
            where: { id: id },
            // Include counts or even recent transactions if desired
             include: {
                 _count: {
                     select: { payments: true, receipts: true }
                 }
                 // payments: { take: 5, orderBy: { date: 'desc' } }, // Example: Get 5 recent payments
                 // receipts: { take: 5, orderBy: { date: 'desc' } }  // Example: Get 5 recent receipts
             }
        });

        if (!account) {
            return res.status(404).json({ message: `Account with ID ${id} not found` });
        }

        res.status(200).json(account);
    } catch (error) {
        console.error(`Error fetching account ${id}:`, error);
        res.status(500).json({ message: 'Error fetching account', error: error.message });
    }
};

// --- Update Account ---
// Note: Balance should generally NOT be updated directly here. It's managed via payments/receipts/adjustments.
export const updateAccount = async (req, res) => {
    const { id } = req.params;
    // Exclude 'balance' from direct updates via this endpoint
    const { bankName, accountNumber, accountHolder } = req.body;

     // Validation: Ensure at least one updatable field is provided
    if (bankName === undefined && accountNumber === undefined && accountHolder === undefined) {
        return res.status(400).json({ message: 'No fields provided for update. Provide bankName, accountNumber, or accountHolder.' });
    }

    try {
        const accountToUpdate = await prisma.account.findUnique({ where: { id } });
        if (!accountToUpdate) {
             return res.status(404).json({ message: `Account with ID ${id} not found` });
        }

        const updatedAccount = await prisma.account.update({
            where: { id: id },
            data: {
                 // Only include fields explicitly provided in the request body
                 ...(bankName !== undefined && { bankName }),
                 ...(accountNumber !== undefined && { accountNumber }),
                 ...(accountHolder !== undefined && { accountHolder }),
                 // DO NOT update balance here directly:
                 // ...(typeof balance === 'number' && { balance }), // Avoid this
            },
        });
        res.status(200).json(updatedAccount);
    } catch (error) {
        console.error(`Error updating account ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Account with ID ${id} not found during update.` });
            }
             // Handle potential unique constraint violations if accountNumber/bankName combo should be unique
             if (error.code === 'P2002') {
                 return res.status(409).json({ message: 'Update failed: An account with similar unique details might already exist.' });
            }
        }
        res.status(500).json({ message: 'Error updating account', error: error.message });
    }
};

// --- Delete Account ---
// WARNING: Should only be allowed if the account has zero balance and no associated transactions.
export const deleteAccount = async (req, res) => {
    const { id } = req.params;

    try {
         // 1. Check if account exists and get balance
         const account = await prisma.account.findUnique({
            where: { id: id },
            select: { balance: true } // Only need balance for check
         });

         if (!account) {
            return res.status(404).json({ message: `Account with ID ${id} not found.` });
         }

         // 2. Check for non-zero balance (optional, but good practice)
         // Allowing deletion with balance might require manual adjustments elsewhere
         if (account.balance !== 0) {
             return res.status(400).json({ message: `Cannot delete account with non-zero balance (${account.balance}). Adjust balance first.` });
         }

        // 3. **Crucial Check:** Verify no associated payments or receipts exist
        const relatedPaymentsCount = await prisma.payment.count({ where: { accountId: id } });
        const relatedReceiptsCount = await prisma.receipt.count({ where: { accountId: id } });

        if (relatedPaymentsCount > 0 || relatedReceiptsCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete account: It is associated with existing payments or receipts.',
                details: {
                    payments: relatedPaymentsCount,
                    receipts: relatedReceiptsCount,
                }
            });
        }

        // 4. If all checks pass, proceed with deletion
        await prisma.account.delete({
            where: { id: id },
        });
        res.status(204).send(); // No Content

    } catch (error) {
        console.error(`Error deleting account ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Not found (might be redundant due to initial check, but safe)
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Account with ID ${id} not found.` });
            }
            // P2003: Foreign key constraint (should be caught by manual check, but fallback)
             if (error.code === 'P2003') {
                 return res.status(400).json({ message: 'Cannot delete account due to existing references (payments/receipts).' });
             }
        }
        res.status(500).json({ message: 'Error deleting account', error: error.message });
    }
};


// --- Get Payments for a Specific Account (with filters) ---
export const getAccountPayments = async (req, res) => {
    const { id } = req.params; // The Account ID
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        // Optional: Check if account exists first
        const accountExists = await prisma.account.findUnique({ where: { id }, select: { id: true } });
        if (!accountExists) {
            return res.status(404).json({ message: `Account with ID ${id} not found.` });
        }

        // Build the where clause for payments
        const whereClause = {
            accountId: id // *** Filter by the specific account ID ***
        };

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                whereClause.date.lte = endOfDay;
            }
        }

        // Fetch payments matching the criteria
        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                supplier: { select: { name: true } }, // Include supplier name for context
            },
            orderBy: { date: 'desc' },
            skip: skip,
            take: limitNum,
        });

        // Get total count for pagination
        const totalPayments = await prisma.payment.count({ where: whereClause });
        const totalPages = Math.ceil(totalPayments / limitNum);

        res.status(200).json({
            data: payments,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: totalPayments,
                itemsPerPage: limitNum,
            },
        });

    } catch (error) {
        console.error(`Error fetching payments for account ${id}:`, error);
        res.status(500).json({ message: 'Error fetching account payments', error: error.message });
    }
};

// --- Get Receipts for a Specific Account (with filters) ---
export const getAccountReceipts = async (req, res) => {
    const { id } = req.params; // The Account ID
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
         // Optional: Check if account exists first
        const accountExists = await prisma.account.findUnique({ where: { id }, select: { id: true } });
        if (!accountExists) {
            return res.status(404).json({ message: `Account with ID ${id} not found.` });
        }

        // Build the where clause for receipts
        const whereClause = {
            accountId: id // *** Filter by the specific account ID ***
        };

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                whereClause.date.lte = endOfDay;
            }
        }

        // Fetch receipts matching the criteria
        const receipts = await prisma.receipt.findMany({
            where: whereClause,
            include: {
                customer: { select: { name: true } }, // Include customer name for context
            },
            orderBy: { date: 'desc' },
            skip: skip,
            take: limitNum,
        });

        // Get total count for pagination
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
        console.error(`Error fetching receipts for account ${id}:`, error);
        res.status(500).json({ message: 'Error fetching account receipts', error: error.message });
    }
};