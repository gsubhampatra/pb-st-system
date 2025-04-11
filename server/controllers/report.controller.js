import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();
export const downloadReport = async (req, res) => {
  const { type, filter, date, month, year } = req.query;

  let startOfDay, endOfDay;
  const today = new Date();

  if (filter === 'week') {
    startOfDay = new Date();
    startOfDay.setDate(today.getDate() - 7);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
  } else if (filter === 'month' && month !== undefined && year) {
    startOfDay = new Date(year, parseInt(month), 1);
    endOfDay = new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999); // end of month
  } else if (filter === 'date' && date) {
    startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
  } else {
    // Default: today
    startOfDay = new Date(today.setHours(0, 0, 0, 0));
    endOfDay = new Date(today.setHours(23, 59, 59, 999));
  }

  const workbook = new ExcelJS.Workbook();
  const worksheetName = `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${filter.charAt(0).toUpperCase() + filter.slice(1)} ${
    filter === "month" ? `${month + 1}/${year}` : filter === "date" ? date : ""
  }`;
  const worksheetNameSafe = worksheetName.replace(/[\/\\*\?|\[\]]/g, "");
  const worksheet = workbook.addWorksheet(worksheetNameSafe);

  switch (type) {
    case "purchase": {
      const purchases = await prisma.purchase.findMany({
        include: { supplier: true, items: true },
        where: { date: { gte: startOfDay, lt: endOfDay } },
      });

      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Supplier", key: "supplier", width: 25 },
        { header: "Item", key: "item", width: 25 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Unit Price", key: "unitPrice", width: 15 },
        { header: "Total Price", key: "totalPrice", width: 15 },
      ];

      for (const purchase of purchases) {
        worksheet.addRow({
          date: purchase.date.toISOString().split("T")[0],
          supplier: purchase.supplier.name,
        });

        for (const item of purchase.items) {
          const itemData = await prisma.item.findUnique({
            where: { id: item.itemId },
          });

          worksheet.addRow({
            item: itemData?.name || "Unknown",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          });
        }

        const totalRow = worksheet.addRow({
          item: "Total",
          totalPrice: purchase.totalAmount,
        });
        const paidRow = worksheet.addRow({
          item: "Paid",
          totalPrice: purchase.paidAmount,
        });

        totalRow.font = { bold: true };
        paidRow.font = { bold: true };
        worksheet.addRow({});
      }
      break;
    }

    case "sale": {
      const sales = await prisma.sale.findMany({
        include: { customer: true, items: true },
        where: { date: { gte: startOfDay, lt: endOfDay } },
      });

      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Item", key: "item", width: 25 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Unit Price", key: "unitPrice", width: 15 },
        { header: "Total Price", key: "totalPrice", width: 15 },
      ];

      for (const sale of sales) {
        worksheet.addRow({
          date: sale.date.toISOString().split("T")[0],
          customer: sale.customer.name,
        });

        for (const item of sale.items) {
          const itemData = await prisma.item.findUnique({
            where: { id: item.itemId },
          });

          worksheet.addRow({
            item: itemData?.name || "Unknown",
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price,
          });
        }

        const totalRow = worksheet.addRow({
          item: "Total",
          totalPrice: sale.totalAmount,
        });
        const paidRow = worksheet.addRow({
          item: "Paid",
          totalPrice: sale.paidAmount,
        });

        totalRow.font = { bold: true };
        paidRow.font = { bold: true };
        worksheet.addRow({});
      }
      break;
    }

    case "payment": {
      const payments = await prisma.payment.findMany({
        include: { supplier: true },
        where: { date: { gte: startOfDay, lt: endOfDay } },
      });

      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Supplier", key: "supplier", width: 25 },
        { header: "Amount", key: "amount", width: 20 },
      ];

      for (const payment of payments) {
        worksheet.addRow({
          date: payment.date.toISOString().split("T")[0],
          supplier: payment.supplier.name,
          amount: payment.amount,
        });
      }
      break;
    }

    case "receipt": {
      const receipts = await prisma.receipt.findMany({
        include: { customer: true },
        where: { date: { gte: startOfDay, lt: endOfDay } },
      });

      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Amount", key: "amount", width: 20 },
      ];

      for (const receipt of receipts) {
        worksheet.addRow({
          date: receipt.date.toISOString().split("T")[0],
          customer: receipt.customer.name,
          amount: receipt.amount,
        });
      }
      break;
    }

    default:
      return res.status(400).json({ error: "Invalid report type" });
  }

  // If no rows were added, show empty message
  if (worksheet.rowCount === 0) {
    worksheet.addRow(["No records found for today."]);
  }

  const fileName = `${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();

  // Save report download history
  await prisma.reportDownload.create({
    data: {
      type,
      date: new Date(),
    },
  });

  // Send Excel file
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.send(buffer);
};

export const getDownloadHistory = async (req, res) => {
  try {
    const history = await prisma.reportDownload.findMany({
      orderBy: { date: "desc" },
      take: 100,
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [purchaseTotal, saleTotal, paymentTotal, receiptTotal] =
      await Promise.all([
        prisma.purchase.aggregate({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
        prisma.sale.aggregate({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
        prisma.payment.aggregate({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.receipt.aggregate({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

    res.json({
      purchases: purchaseTotal._sum.totalAmount || 0,
      sales: saleTotal._sum.totalAmount || 0,
      payments: paymentTotal._sum.amount || 0,
      receipts: receiptTotal._sum.amount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
