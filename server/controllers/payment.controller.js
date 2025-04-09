import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
// --- Create Payment ---
export const createPayment = async (req, res) => {
    const { supplierId, amount, method, accountId, date, note } = req.body;

    // --- Basic Input Validation ---
    if (!supplierId || typeof amount !== 'number' || amount <= 0 || !method || !date) {
        return res.status(400).json({ message: 'Missing required fields: supplierId, positive amount, method, date' });
    }
    if (!['cash', 'account'].includes(method)) {
        return res.status(400).json({ message: "Invalid method. Must be 'cash' or 'account'." });
    }
    if (method === 'account' && !accountId) {
        return res.status(400).json({ message: 'accountId is required when method is "account"' });
    }
     if (method === 'cash' && accountId) {
        // Optional: Decide if accountId should be ignored or rejected for cash payments
        console.warn("accountId provided for cash payment, it will be ignored.");
        // Alternatively, return res.status(400).json({ message: 'accountId should not be provided for cash payments' });
    }

    try {
        // --- Use Prisma Transaction (especially important if updating account balance) ---
        const newPayment = await prisma.$transaction(async (tx) => {

      

            let validatedAccountId = null;
            // 2. If method is 'account', validate Account and update balance
            if (method === 'account') {
                const account = await tx.account.findUnique({
                    where: { id: accountId }
                });
                if (!account) {
                    throw new Error(`Account with ID ${accountId} not found.`);
                }
                // Optional: Check for sufficient balance before allowing payment
                // if (account.balance < amount) {
                //     throw new Error(`Insufficient balance in account ${accountId}. Available: ${account.balance}, Required: ${amount}`);
                // }

                // Decrement account balance
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            decrement: amount,
                        },
                    },
                });
                validatedAccountId = accountId; // Store validated ID
            }

            // 3. Create the Payment record
            const payment = await tx.payment.create({
                data: {
                    supplierId: supplierId,
                    amount: amount,
                    method: method,
                    accountId: validatedAccountId, // Use null if cash, validated ID if account
                    date: new Date(date),
                    note: note, // Optional
                },
                include: { // Include related data in the response
                    supplier: { select: { name: true } },
                    account: { select: { bankName: true, accountNumber: true } } // Include if account was used
                }
            });

            return payment; // Return the created payment from the transaction
        }); // End of Prisma Transaction

        res.status(201).json(newPayment);

    } catch (error) {
        console.error("Error creating payment:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ message: 'Database error creating payment.', details: error.message });
        } else if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        // else if (error.message.includes("Insufficient balance")) {
        //     return res.status(409).json({ message: error.message }); // 409 Conflict for insufficient funds
        // }
        res.status(500).json({ message: 'Error creating payment', error: error.message });
    }
};

// --- Get All Payments (with optional filtering/pagination) ---
export const getPayments = async (req, res) => {
    const { supplierId, accountId, method, startDate, endDate, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        const whereClause = {};
        if (supplierId) whereClause.supplierId = supplierId;
        if (accountId) whereClause.accountId = accountId; // Filter by specific account
        if (method) whereClause.method = method;
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

        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                supplier: { select: { name: true } },
                account: { select: { bankName: true, accountNumber: true } }, // Include account info if present
            },
            orderBy: {
                date: 'desc', // Default order by date descending
            },
            skip: skip,
            take: limitNum,
        });

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
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: 'Error fetching payments', error: error.message });
    }
};

// --- Get Payment By ID ---
export const getPaymentById = async (req, res) => {
    const { id } = req.params;

    try {
        const payment = await prisma.payment.findUnique({
            where: { id: id },
            include: {
                supplier: true, // Include full supplier details
                account: true,  // Include full account details (will be null if cash)
            }
        });

        if (!payment) {
            return res.status(404).json({ message: `Payment with ID ${id} not found` });
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error(`Error fetching payment ${id}:`, error);
        res.status(500).json({ message: 'Error fetching payment', error: error.message });
    }
};

// --- Update Payment ---
// NOTE: Updating financial records like amount or account usually involves reversal + new entry.
// This example allows updating non-critical fields like 'note' or 'date'.
// Updating 'amount' or 'accountId' would require complex transaction logic (reverse old, apply new).
export const updatePayment = async (req, res) => {
    const { id } = req.params;
    const { date, note } = req.body;

    // Validate that at least one valid field is provided
    if (date === undefined && note === undefined) {
        return res.status(400).json({ message: 'No valid fields (date, note) provided for update' });
    }

    try {
        const paymentToUpdate = await prisma.payment.findUnique({ where: { id } });
        if (!paymentToUpdate) {
             return res.status(404).json({ message: `Payment with ID ${id} not found` });
        }

        // If you WERE to allow amount/account updates, the logic would go here inside a transaction

        const updatedPayment = await prisma.payment.update({
            where: { id: id },
            data: {
                ...(date && { date: new Date(date) }),
                ...(note !== undefined && { note }), // Allow setting note to null/empty
            },
             include: { // Return the updated payment with details
                 supplier: { select: { name: true } },
                 account: { select: { bankName: true, accountNumber: true } }
            }
        });
        res.status(200).json(updatedPayment);
    } catch (error) {
        console.error(`Error updating payment ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return res.status(404).json({ message: `Payment with ID ${id} not found during update.` });
        }
        res.status(500).json({ message: 'Error updating payment', error: error.message });
    }
};


// --- Delete Payment ---
// WARNING: Deleting financial records is often discouraged. Consider a "void" status or reversal entry.
// If deleting, MUST reverse account balance changes within a transaction.
export const deletePayment = async (req, res) => {
    const { id } = req.params;

    try {
        // Use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {

            // 1. Find the payment to get its details (amount, method, accountId)
            const paymentToDelete = await tx.payment.findUnique({
                where: { id: id },
                select: { amount: true, method: true, accountId: true }
            });

            if (!paymentToDelete) {
                 throw new Error(`Payment with ID ${id} not found.`);
            }

            // 2. If it was an account payment, reverse the balance change
            if (paymentToDelete.method === 'account' && paymentToDelete.accountId) {
                // Increment account balance (put money back)
                 const accountExists = await tx.account.findUnique({ where: { id: paymentToDelete.accountId }, select: {id: true}});
                 if (!accountExists) {
                    // This shouldn't happen if data is consistent, but good practice to check
                    console.error(`Account ${paymentToDelete.accountId} associated with payment ${id} not found during deletion. Balance cannot be reversed.`);
                    throw new Error(`Failed to reverse balance: Account ${paymentToDelete.accountId} not found.`);
                 }
                await tx.account.update({
                    where: { id: paymentToDelete.accountId },
                    data: {
                        balance: {
                            increment: paymentToDelete.amount,
                        },
                    },
                });
            }

            // 3. Delete the Payment record itself
            await tx.payment.delete({
                where: { id: id },
            });

            return true; // Indicate success
        }); // End of Transaction

        res.status(204).send(); // 204 No Content for successful deletion

    } catch (error) {
        console.error(`Error deleting payment ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Payment with ID ${id} not found.` });
            }
         } else if (error.message.includes("not found")) {
             // Handle 'not found' or other errors from the transaction
             return res.status(404).json({ message: error.message });
         } else if (error.message.includes('Failed to reverse balance')) {
              // Handle specific error from transaction logic
             return res.status(500).json({ message: error.message });
         }

        res.status(500).json({ message: 'Error deleting payment', error: error.message });
    }
};