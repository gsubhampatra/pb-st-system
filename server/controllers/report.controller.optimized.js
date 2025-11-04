import prisma from "../prisma/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ExcelJS from "exceljs";

// Helper: Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
};

// Helper: Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN");
};

// --- Get Dashboard Summary ---
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  // Parallel aggregations for performance
  const [
    totalSales,
    totalPurchases,
    totalReceipts,
    totalPayments,
    totalCustomers,
    totalSuppliers,
    totalItems,
  ] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: startDate || endDate ? { date: dateFilter } : {},
    }),
    prisma.purchase.aggregate({
      _sum: { totalAmount: true },
      where: startDate || endDate ? { date: dateFilter } : {},
    }),
    prisma.receipt.aggregate({
      _sum: { amount: true },
      where: startDate || endDate ? { date: dateFilter } : {},
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: startDate || endDate ? { date: dateFilter } : {},
    }),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.item.count(),
  ]);

  res.status(200).json({
    totalSales: totalSales._sum.totalAmount || 0,
    totalPurchases: totalPurchases._sum.totalAmount || 0,
    totalReceipts: totalReceipts._sum.amount || 0,
    totalPayments: totalPayments._sum.amount || 0,
    totalCustomers,
    totalSuppliers,
    totalItems,
  });
});

// --- Sales Report ---
export const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  // Fetch sales with customer and items in a single query (avoid N+1)
  const sales = await prisma.sale.findMany({
    where: startDate || endDate ? { date: dateFilter } : {},
    include: {
      customer: true,
      items: {
        include: {
          item: true, // Include item details
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + (sale.discount || 0), 0);
  const totalReceived = sales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0);
  const totalDue = totalAmount - totalReceived;

  res.status(200).json({
    sales,
    summary: {
      totalAmount,
      totalDiscount,
      totalReceived,
      totalDue,
      count: sales.length,
    },
  });
});

// --- Purchase Report ---
export const getPurchaseReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  // Fetch purchases with supplier and items in a single query (avoid N+1)
  const purchases = await prisma.purchase.findMany({
    where: startDate || endDate ? { date: dateFilter } : {},
    include: {
      supplier: true,
      items: {
        include: {
          item: true, // Include item details
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalDue = totalAmount - totalPaid;

  res.status(200).json({
    purchases,
    summary: {
      totalAmount,
      totalPaid,
      totalDue,
      count: purchases.length,
    },
  });
});

// --- Stock Report ---
export const getStockReport = asyncHandler(async (req, res) => {
  const { lowStock } = req.query;
  const threshold = Number(lowStock) || 10;

  const items = await prisma.item.findMany({
    where: {
      stock: { lte: threshold },
    },
    orderBy: { stock: "asc" },
  });

  res.status(200).json({
    items,
    count: items.length,
    threshold,
  });
});

// --- Customer Statement ---
export const getCustomerStatement = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  // Parallel queries
  const [customer, sales, receipts] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.sale.findMany({
      where: {
        customerId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      include: {
        items: {
          include: { item: true },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.receipt.findMany({
      where: {
        customerId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!customer) {
    return res.status(404).json({ message: `Customer with ID ${customerId} not found` });
  }

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
  const balance = totalSales - totalReceipts;

  res.status(200).json({
    customer,
    sales,
    receipts,
    summary: {
      totalSales,
      totalReceipts,
      balance,
    },
  });
});

// --- Supplier Statement ---
export const getSupplierStatement = asyncHandler(async (req, res) => {
  const { supplierId } = req.params;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  // Parallel queries
  const [supplier, purchases, payments] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: supplierId } }),
    prisma.purchase.findMany({
      where: {
        supplierId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      include: {
        items: {
          include: { item: true },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.payment.findMany({
      where: {
        supplierId,
        ...(startDate || endDate ? { date: dateFilter } : {}),
      },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!supplier) {
    return res.status(404).json({ message: `Supplier with ID ${supplierId} not found` });
  }

  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalPurchases - totalPayments;

  res.status(200).json({
    supplier,
    purchases,
    payments,
    summary: {
      totalPurchases,
      totalPayments,
      balance,
    },
  });
});

// --- Download Report (Excel) ---
export const downloadReport = asyncHandler(async (req, res) => {
  const { reportType, startDate, endDate, supplierId } = req.query;

  if (!reportType || !["sales", "purchase", "stock"].includes(reportType)) {
    return res.status(400).json({ message: "Invalid report type. Use 'sales', 'purchase', or 'stock'." });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType.toUpperCase() + " Report");

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  if (reportType === "sales") {
    const sales = await prisma.sale.findMany({
      where: startDate || endDate ? { date: dateFilter } : {},
      include: {
        customer: true,
        items: { include: { item: true } },
      },
      orderBy: { date: "desc" },
    });

    worksheet.columns = [
      { header: "Invoice No", key: "invoiceNumber", width: 15 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Discount", key: "discount", width: 12 },
      { header: "Paid", key: "paidAmount", width: 12 },
      { header: "Due", key: "due", width: 12 },
    ];

    sales.forEach((sale) => {
      worksheet.addRow({
        invoiceNumber: sale.invoiceNumber,
        date: formatDate(sale.date),
        customer: sale.customer?.name || "N/A",
        totalAmount: formatCurrency(sale.totalAmount),
        discount: formatCurrency(sale.discount || 0),
        paidAmount: formatCurrency(sale.paidAmount || 0),
        due: formatCurrency(sale.totalAmount - (sale.paidAmount || 0)),
      });
    });
  } else if (reportType === "purchase") {
    const purchases = await prisma.purchase.findMany({
      where: {
        ...(startDate || endDate ? { date: dateFilter } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: {
        supplier: true,
        items: { include: { item: true } },
      },
      orderBy: { date: "desc" },
    });

    worksheet.columns = [
      { header: "Invoice No", key: "invoiceNumber", width: 15 },
      { header: "Date", key: "date", width: 15 },
      { header: "Supplier", key: "supplier", width: 25 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Paid", key: "paidAmount", width: 12 },
      { header: "Due", key: "due", width: 12 },
    ];

    purchases.forEach((purchase) => {
      worksheet.addRow({
        // In Prisma schema, field is `invoiceNo`
        invoiceNumber: purchase.invoiceNo,
        date: formatDate(purchase.date),
        supplier: purchase.supplier?.name || "N/A",
        totalAmount: formatCurrency(purchase.totalAmount),
        paidAmount: formatCurrency(purchase.paidAmount || 0),
        due: formatCurrency(purchase.totalAmount - (purchase.paidAmount || 0)),
      });
    });

    // Add detailed items worksheet - simplified, grouped by Date & Supplier
    const detailSheet = workbook.addWorksheet("Purchase Items");
    detailSheet.columns = [
      { header: "Date & Supplier", key: "ds", width: 40 },
      { header: "Item", key: "itemName", width: 28 },
      { header: "Qty", key: "quantity", width: 10 },
      { header: "Unit Price", key: "unitPrice", width: 14 },
      { header: "Line Total", key: "lineTotal", width: 14 },
    ];

    purchases.forEach((purchase) => {
      // Group header row: "dd/mm/yyyy - Supplier Name"
      const headerRow = detailSheet.addRow([
        `${formatDate(purchase.date)} - ${purchase.supplier?.name || "N/A"}`,
      ]);
      // Merge header across all columns
      detailSheet.mergeCells(headerRow.number, 1, headerRow.number, 5);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: "left" };
      headerRow.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
      };

      // Item rows under the group header
      purchase.items.forEach((pi) => {
        const row = detailSheet.addRow([
          "", // indent under group header
          pi.item?.name || "",
          pi.quantity,
          pi.unitPrice,
          pi.totalPrice,
        ]);
        // Align numeric columns right and apply number format
        row.getCell(3).alignment = { horizontal: "right" };
        row.getCell(4).alignment = { horizontal: "right" };
        row.getCell(5).alignment = { horizontal: "right" };
        row.getCell(4).numFmt = "#,##0.00";
        row.getCell(5).numFmt = "#,##0.00";
        // Subtle row separator
        row.border = { bottom: { style: "hair" } };
      });

      // Group total row
      const totalRow = detailSheet.addRow([
        "",
        "Total Amount",
        "",
        "",
        purchase.totalAmount,
      ]);
      totalRow.font = { bold: true };
      totalRow.getCell(5).alignment = { horizontal: "right" };
      totalRow.getCell(5).numFmt = "#,##0.00";
      totalRow.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
      };

      // Spacer row between groups
      detailSheet.addRow([]);
    });
  } else if (reportType === "stock") {
    const items = await prisma.item.findMany({
      orderBy: { stock: "asc" },
    });

    worksheet.columns = [
      { header: "Item Name", key: "name", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Base Price", key: "basePrice", width: 15 },
      { header: "Selling Price", key: "sellingPrice", width: 15 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        name: item.name,
        category: item.category || "N/A",
        stock: item.stock,
        unit: item.unit,
        basePrice: formatCurrency(item.basePrice),
        sellingPrice: formatCurrency(item.sellingPrice),
      });
    });
  }

  // Record download in database
  await prisma.reportDownload.create({
    data: {
      reportType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${reportType}_report_${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});

// --- Report Download History ---
export const getReportDownloadHistory = asyncHandler(async (req, res) => {
  const { limit = 20, reportType } = req.query;

  const where = reportType ? { reportType } : {};
  const downloads = await prisma.reportDownload.findMany({
    where,
    orderBy: { downloadedAt: "desc" },
    take: Number(limit),
  });

  res.status(200).json({ downloads });
});
