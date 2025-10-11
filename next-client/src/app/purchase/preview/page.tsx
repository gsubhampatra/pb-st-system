"use client";
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, API_PATHS } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function PurchasePreviewPage() {
  const [preview, setPreview] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = sessionStorage.getItem('purchasePreview');
    if (raw) setPreview(JSON.parse(raw));
    else router.push('/');
  }, [router]);

  if (!preview) return <div className="p-8">Loading...</div>;

  const { payload, created } = preview;

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!payload) return;
    const lines = [] as string[];
    lines.push(`Invoice #: ${payload.invoiceNo}`);
    lines.push(`Date: ${payload.date}`);
    lines.push(`Supplier ID: ${payload.supplierId}`);
    payload.items.forEach((it: any) => lines.push(`${it.name} x ${it.quantity} @ ₹${it.unitPrice} = ₹${(it.quantity * it.unitPrice).toFixed(2)}`));
    lines.push(`Total: ₹${payload.totalAmount.toFixed(2)}`);
    const msg = encodeURIComponent(lines.join('\n'));
    // open WA with empty number (user selects) - better to use supplier phone if available in created
    const phone = created?.supplier?.phone || '';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleSMS = () => {
    const lines = [] as string[];
    lines.push(`Invoice #: ${payload.invoiceNo}`);
    lines.push(`Total: ₹${payload.totalAmount.toFixed(2)}`);
    const phone = created?.supplier?.phone || '';
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`sms:${phone}?body=${msg}`, '_blank');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Purchase Preview</h2>
      <div className="bg-white p-4 shadow rounded">
        <div className="flex justify-between">
          <div>
            <div className="text-sm text-gray-600">Invoice</div>
            <div className="font-semibold text-lg">{payload.invoiceNo}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Date</div>
            <div className="font-semibold">{payload.date}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-600">Items</div>
          <table className="w-full mt-2">
            <thead>
              <tr className="text-left"><th>Item</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              {payload.items.map((it: any, idx: number) => (
                <tr key={idx} className="border-t"><td>{it.name}</td><td className="text-right">{it.quantity}</td><td className="text-right">₹{it.unitPrice.toFixed(2)}</td><td className="text-right">₹{(it.quantity * it.unitPrice).toFixed(2)}</td></tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t"><td colSpan={3} className="text-right font-bold">Total</td><td className="text-right font-bold">₹{payload.totalAmount.toFixed(2)}</td></tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handlePrint}>Print</Button>
          <Button onClick={handleWhatsApp}>WhatsApp</Button>
          <Button onClick={handleSMS}>SMS</Button>
          <Button variant="outline" onClick={() => router.push('/')}>Done</Button>
        </div>
      </div>
    </div>
  );
}
