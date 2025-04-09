import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisma.js";
// --- Create Customer ---
export const createCustomer = async (req, res) => {
    const { name, phone, address } = req.body;

    // Basic validation
    if (!name) {
        return res.status(400).json({ message: 'Customer name is required' });
    }

    try {
        const newCustomer = await prisma.customer.create({
            data: {
                name,
                phone,   // Optional
                address, // Optional
            },
        });
        res.status(201).json(newCustomer); // 201 Created
    } catch (error) {
        console.error("Error creating customer:", error);
        // Handle potential unique constraint errors if you add them later (e.g., unique email)
        res.status(500).json({ message: 'Error creating customer', error: error.message });
    }
};

// --- Get/Search Customers ---
// Handles both fetching all customers and searching by name or phone
export const getCustomers = async (req, res) => {
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

        const customers = await prisma.customer.findMany({
            where: whereClause,
            orderBy: {
                name: 'asc', // Optional: order results by name
            },
            // Add pagination here if needed (similar to getPurchases)
            // const { page = 1, limit = 10 } = req.query;
            // const skip = (parseInt(page) - 1) * parseInt(limit);
            // take: parseInt(limit),
            // skip: skip,
        });

        // If implementing pagination, fetch total count as well:
        // const totalCustomers = await prisma.customer.count({ where: whereClause });
        // const totalPages = Math.ceil(totalCustomers / parseInt(limit));
        // res.status(200).json({ data: customers, pagination: { currentPage: parseInt(page), totalPages, totalItems: totalCustomers } });

        res.status(200).json(customers); // Return simple array for now

    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
};

// --- Get Customer By ID ---
export const getCustomerById = async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: id },
            // Optionally include related data counts or details if needed
             include: {
                 _count: {
                     select: { sales: true, receipts: true }
                 }
             }
        });

        if (!customer) {
            return res.status(404).json({ message: `Customer with ID ${id} not found` });
        }

        res.status(200).json(customer);
    } catch (error) {
        console.error(`Error fetching customer ${id}:`, error);
        res.status(500).json({ message: 'Error fetching customer', error: error.message });
    }
};

// --- Update Customer ---
export const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;

     // Basic validation: Ensure at least one field is being updated
    if (name === undefined && phone === undefined && address === undefined) {
        return res.status(400).json({ message: 'No fields provided for update. Provide name, phone, or address.' });
    }

    try {
        const updatedCustomer = await prisma.customer.update({
            where: { id: id },
            data: {
                 // Only include fields that are explicitly present in the request body
                 // Allows setting fields to null or empty string if desired
                 ...(name !== undefined && { name }),
                 ...(phone !== undefined && { phone }),
                 ...(address !== undefined && { address }),
            },
        });
        res.status(200).json(updatedCustomer);
    } catch (error) {
        console.error(`Error updating customer ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return res.status(404).json({ message: `Customer with ID ${id} not found` });
        }
        res.status(500).json({ message: 'Error updating customer', error: error.message });
    }
};

// --- Delete Customer ---
export const deleteCustomer = async (req, res) => {
    const { id } = req.params;

    try {
        // **Important Check:** Prevent deletion if customer has associated sales or receipts
        const relatedSalesCount = await prisma.sale.count({ where: { customerId: id } });
        const relatedReceiptsCount = await prisma.receipt.count({ where: { customerId: id } });

        if (relatedSalesCount > 0 || relatedReceiptsCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete customer: Customer is associated with existing sales or receipts.',
                details: {
                    sales: relatedSalesCount,
                    receipts: relatedReceiptsCount,
                }
            });
        }

        // If no related records, proceed with deletion
        await prisma.customer.delete({
            where: { id: id },
        });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Error deleting customer ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record to delete not found
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Customer with ID ${id} not found` });
            }
            // P2003: Foreign key constraint failed (should be caught by the manual check above, but good fallback)
             if (error.code === 'P2003') {
                 return res.status(400).json({ message: 'Cannot delete customer: It is referenced in other records.' });
             }
        }
        res.status(500).json({ message: 'Error deleting customer', error: error.message });
    }
};

export const getCustomerCredit = async (req, res) => {
    const { id: customerId } = req.params; // Get customer ID from URL parameter

    try {
        // 1. Check if the customer exists
        const customerExists = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { id: true, name: true } // Select basic info for response context
        });

        if (!customerExists) {
            return res.status(404).json({ message: `Customer with ID ${customerId} not found` });
        }

        // 2. Calculate the sum of totalAmount for all sales of this customer
        const salesAggregation = await prisma.sale.aggregate({
            _sum: {
                totalAmount: true, // Sum this field
            },
            where: {
                customerId: customerId, // Filter by the specific customer
            },
        });
        const totalSalesAmount = salesAggregation._sum.totalAmount || 0; // Default to 0 if no sales

        // 3. Calculate the sum of amount for all receipts from this customer
        const receiptsAggregation = await prisma.receipt.aggregate({
            _sum: {
                amount: true, // Sum this field
            },
            where: {
                customerId: customerId, // Filter by the specific customer
            },
        });
        const totalReceiptsAmount = receiptsAggregation._sum.amount || 0; // Default to 0 if no receipts

        // 4. Calculate the outstanding balance (credit)
        // Positive value means customer owes money
        // Negative value means customer has overpaid or has credit
        // Zero means settled
        const outstandingBalance = totalSalesAmount - totalReceiptsAmount;

        // 5. Prepare the response
        res.status(200).json({
            customerId: customerId,
            customerName: customerExists.name,
            totalSales: totalSalesAmount,
            totalReceipts: totalReceiptsAmount,
            outstandingBalance: outstandingBalance,
            status: outstandingBalance > 0 ? 'Owes Money' : (outstandingBalance < 0 ? 'Credit Surplus/Overpaid' : 'Settled'),
        });

    } catch (error) {
        console.error(`Error calculating credit for customer ${customerId}:`, error);
        res.status(500).json({ message: 'Error calculating customer credit', error: error.message });
    }
};