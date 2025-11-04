import escpos from "escpos";
import escposUsb from "escpos-usb";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper: Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
};

// Helper: Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN");
};

// --- Print Invoice (Purchase/Sale) ---
export const printInvoice = asyncHandler(async (req, res) => {
  const {
    invoiceNo,
    date,
    supplier,
    customer,
    items,
    totalAmount,
    paidAmount,
    discount = 0,
    type = "purchase", // 'purchase' or 'sale'
  } = req.body;

  // Validation
  if (!invoiceNo || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: invoiceNo, items",
    });
  }

  if (typeof totalAmount !== "number" || typeof paidAmount !== "number") {
    return res.status(400).json({
      status: "error",
      message: "totalAmount and paidAmount must be numbers",
    });
  }

  try {
    const device = new escposUsb(); // Auto-detect USB printer
    const printer = new escpos.Printer(device);

    device.open(() => {
      const due = totalAmount - paidAmount;
      const partyName = type === "purchase" ? supplier : customer;

      printer
        .align("CT")
        .style("B")
        .size(1, 1)
        .text("PATRA BHANDAR")
        .text(type === "purchase" ? "PURCHASE INVOICE" : "SALES INVOICE")
        .text(`Invoice: ${invoiceNo}`)
        .text(`Date: ${date ? formatDate(date) : formatDate(new Date())}`)
        .text(`${type === "purchase" ? "Supplier" : "Customer"}: ${partyName || "N/A"}`)
        .drawLine()
        .align("LT")
        .text("Items:")
        .text("-------------------------------");

      items.forEach((item, i) => {
        const name = String(item.name || "Unknown").substring(0, 12).padEnd(12);
        const qtyRate = `${item.quantity}x${item.unitPrice || item.price || 0}`.padEnd(10);
        const itemTotal = item.quantity * (item.unitPrice || item.price || 0);
        printer.text(`${i + 1}. ${name} ${qtyRate} ${formatCurrency(itemTotal)}`);
      });

      printer
        .text("-------------------------------")
        .align("RT")
        .text(`Total    : ${formatCurrency(totalAmount)}`)
        .text(`Discount : ${formatCurrency(discount)}`)
        .text(`Paid     : ${formatCurrency(paidAmount)}`)
        .text(`Due      : ${formatCurrency(due)}`)
        .text("-------------------------------")
        .align("CT")
        .text("Contact: 7847916571")
        .text("Thank You!")
        .text("\n\n\n")
        .cut()
        .close();
    });

    res.json({ status: "success", message: "Invoice printed successfully" });
  } catch (err) {
    // Handle printer errors gracefully
    console.error("Print error:", err);
    
    // If no printer connected, provide helpful message
    if (err.message.includes("LIBUSB") || err.message.includes("device")) {
      return res.status(503).json({
        status: "error",
        message: "Printer not connected or not detected. Please check USB connection.",
      });
    }

    throw err; // Let asyncHandler catch other errors
  }
});
