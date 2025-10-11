"use client";
import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function PreviewDialog({
  open,
  onOpenChange,
  invoiceNo,
  date,
  supplier,
  items,
  total,
  onPrint,
}: any) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${invoiceNo}</title>
            <style>
              body { font-family: 'Arial', sans-serif; padding: 20px; color: #111; }
              .invoice-box {
                max-width: 800px;
                margin: auto;
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .header-info { text-align: center; font-size: 14px; color: #555; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }
              th { background: #f5f5f5; text-align: left; }
              .text-right { text-align: right; }
              .total { background: #004aad; color: white; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
              @media print {
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Invoice Preview</span>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Section */}
        <div ref={printRef}>
          <div className="invoice-box bg-white rounded-xl border shadow-sm">
            {/* Header */}
            <div className="text-center border-b pb-4 mb-4">
              <h1 className="text-2xl font-bold text-blue-700">
                Patra Bhandar & Subham Traders
              </h1>
              <p className="text-sm text-gray-600">
                Brahmapur, Odisha | Phone: +91 XXXXX XXXXX
              </p>
              <p className="text-sm text-gray-600">GSTIN: 21XXXXXXXXXXZB</p>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 text-sm mb-4">
              <div>
                <p>
                  <span className="font-semibold">Invoice No:</span> {invoiceNo}
                </p>
                <p>
                  <span className="font-semibold">Date:</span> {date}
                </p>
              </div>
              {supplier && (
                <div className="text-right">
                  <p className="font-semibold text-gray-700">
                    {supplier.name || "Supplier"}
                  </p>
                  <p>{supplier.phone}</p>
                  <p>{supplier.address}</p>
                </div>
              )}
            </div>

            {/* Item Table */}
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Rate (₹)</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">
                      {parseFloat(item.price || "0").toFixed(2)}
                    </td>
                    <td className="text-right font-semibold">
                      {(
                        item.quantity * (parseFloat(item.price || "0") || 0)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total">
                  <td colSpan={3} className="text-right p-2">
                    Total
                  </td>
                  <td className="text-right p-2 font-bold text-lg">
                    ₹{total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div className="footer">
              <p>Thank you for your business!</p>
              <p>Computer Generated Invoice | No Signature Required</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4 no-print">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
