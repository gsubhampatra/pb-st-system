import escpos from 'escpos';
import escposUsb from 'escpos-usb';
export const printInvoice = async (req, res) => {
  const { invoiceNo, date, supplier, items, totalAmount, paidAmount } =
    req.body;

  try {
    const device = new escposUsb();  // Auto-detect USB printer
    const printer = new escpos.Printer(device);

    device.open(() => {
      printer
        .align("CT")
        .style("B")
        .size(1, 1)
        .text("PATRA BHANDAR")
        .text("PURCHASE INVOICE")
        .text(`Invoice: ${invoiceNo}`)
        .text(`Date: ${date}`)
        .text(`Supplier: ${supplier}`)
        .drawLine()
        .align("LT")
        .text("Items:")
        .text("-------------------------------");

      items.forEach((item, i) => {
        const name = item.name.padEnd(12);
        const qtyRate = `${item.quantity}x${item.unitPrice}`.padEnd(10);
        const total = (item.quantity * item.unitPrice).toFixed(2);
        printer.text(`${i + 1}. ${name} ${qtyRate} ₹${total}`);
      });

      const due = totalAmount - paidAmount;

      printer
        .text("-------------------------------")
        .align("RT")
        .text(`Total: ₹${totalAmount.toFixed(2)}`)
        .text(`Paid : ₹${paidAmount.toFixed(2)}`)
        .text(`Due  : ₹${due.toFixed(2)}`)
        .text("-------------------------------")
        .align("CT")
        .text("Contact: 7847916571")
        .text("Thank You!")
        .text("\n\n\n")
        .cut()
        .close();
    });

    res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

