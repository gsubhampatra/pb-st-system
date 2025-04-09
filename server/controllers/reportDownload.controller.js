import prisma from "../prisma/prisma.js";
// --- Log a Report Download (Create) ---
export const logReportDownload = async (req, res) => {
    const { type, date } = req.body; // 'type' (e.g., 'purchase', 'sale'), 'date' (date the report pertains to)

    // --- Basic Input Validation ---
    if (!type || !date) {
        return res.status(400).json({ message: 'Missing required fields: type, date' });
    }
    // Optional: Validate 'type' against a predefined list if necessary
    // const validTypes = ['purchase', 'sale', 'stock', 'customer_balance', 'supplier_balance'];
    // if (!validTypes.includes(type)) {
    //    return res.status(400).json({ message: `Invalid report type. Valid types are: ${validTypes.join(', ')}` });
    // }

    try {
        const newLog = await prisma.reportDownload.create({
            data: {
                type: type,
                date: new Date(date), // Ensure it's stored as a Date object
                // downloadedAt defaults to now() via the schema
            },
        });
        res.status(201).json(newLog); // 201 Created

    } catch (error) {
        console.error("Error logging report download:", error);
        // Check if the date format was invalid
        if (error instanceof Error && error.message.includes('Invalid date')) {
             return res.status(400).json({ message: 'Invalid date format provided.' });
        }
        res.status(500).json({ message: 'Error logging report download', error: error.message });
    }
};

// --- Get All Report Download Logs (with optional filtering/pagination) ---
export const getReportDownloads = async (req, res) => {
    const { type, startDate, endDate, page = 1, limit = 20 } = req.query; // Allow filtering by type and date range

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        const whereClause = {};
        if (type) whereClause.type = type;

        // Filter by the 'date' the report pertains to
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
            if (endDate) {
                 const endOfDay = new Date(endDate);
                 endOfDay.setHours(23, 59, 59, 999);
                 whereClause.date.lte = endOfDay;
            }
        }
        /* Alternative: Filter by download time instead of report date
         if (startDate || endDate) {
            whereClause.downloadedAt = {};
            if (startDate) whereClause.downloadedAt.gte = new Date(startDate);
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                whereClause.downloadedAt.lte = endOfDay;
            }
         }
        */


        const logs = await prisma.reportDownload.findMany({
            where: whereClause,
            orderBy: {
                downloadedAt: 'desc', // Show most recent downloads first
            },
            skip: skip,
            take: limitNum,
        });

        const totalLogs = await prisma.reportDownload.count({ where: whereClause });
        const totalPages = Math.ceil(totalLogs / limitNum);

        res.status(200).json({
            data: logs,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: totalLogs,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        console.error("Error fetching report download logs:", error);
         if (error instanceof Error && error.message.includes('Invalid date')) {
             return res.status(400).json({ message: 'Invalid date format provided for filtering.' });
        }
        res.status(500).json({ message: 'Error fetching report download logs', error: error.message });
    }
};

// --- Get Specific Report Download Log By ID ---
export const getReportDownloadById = async (req, res) => {
    const { id } = req.params;

    try {
        const log = await prisma.reportDownload.findUnique({
            where: { id: id },
        });

        if (!log) {
            return res.status(404).json({ message: `Report download log with ID ${id} not found` });
        }

        res.status(200).json(log);
    } catch (error) {
        console.error(`Error fetching report download log ${id}:`, error);
        res.status(500).json({ message: 'Error fetching report download log', error: error.message });
    }
};

// --- Delete Report Download Log ---
// Use case might be limited (e.g., purging old logs), but included for completeness.
export const deleteReportDownload = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.reportDownload.delete({
            where: { id: id },
        });
        res.status(204).send(); // 204 No Content for successful deletion

    } catch (error) {
        console.error(`Error deleting report download log ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record to delete not found
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Report download log with ID ${id} not found.` });
            }
        }
        res.status(500).json({ message: 'Error deleting report download log', error: error.message });
    }
};