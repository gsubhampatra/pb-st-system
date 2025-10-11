"use client";
import React, { useEffect, useState, useRef } from "react";
import { api, API_PATHS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Eye } from "lucide-react";

export interface PurchaseItemView {
  id: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  item?: { name?: string; unit?: string };
}

export interface PurchaseView {
  id: string;
  invoiceNo: string;
  supplier?: { name?: string };
  date: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  items?: PurchaseItemView[];
}

const PurchaseList: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseView[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PurchaseView | null>(null);
  const [open, setOpen] = useState(false);
  const printableRef = useRef<HTMLDivElement | null>(null);
  // filters
  const todayIso = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState<string>(todayIso);
  const [toDate, setToDate] = useState<string>(todayIso);
  const [supplierFilter, setSupplierFilter] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await api.get(API_PATHS.purchases.getAll, { params: { page: 1, limit: 50 } });
        const data = resp.data?.data || resp.data || [];
        setPurchases(data);
      } catch (err) {
        console.error("Failed to load purchases", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openPreview = async (id: string) => {
    try {
      const resp = await api.get(API_PATHS.purchases.getById(id));
      const data = resp.data;
      setSelected(data);
      setOpen(true);
    } catch (err) {
      console.error("Failed to load purchase details", err);
      alert("Failed to load purchase details");
    }
  };

  const doPrint = () => {
    // simple print — dialog content is visible so window.print will include it
    window.print();
  };

  return (
    <div className="p-4">
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Purchases</h2>
            <div>{loading ? "Loading..." : `${purchases.length} records`}</div>
          </div>

          <div className="flex gap-3 mb-4 items-end">
            <div>
              <label className="block text-xs text-gray-600">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-600">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border px-2 py-1 rounded" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600">Supplier</label>
              <input placeholder="Supplier name" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <button onClick={() => { setFromDate(todayIso); setToDate(todayIso); setSupplierFilter(""); }} className="px-3 py-1 border rounded text-sm">Reset</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr>
                  <th className="p-2">Invoice</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Date</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases
                  .filter((p) => {
                    // date filter
                    const pd = new Date(p.date).toISOString().slice(0, 10);
                    if (pd < fromDate) return false;
                    if (pd > toDate) return false;
                    if (supplierFilter.trim()) {
                      const s = p.supplier?.name || "";
                      if (!s.toLowerCase().includes(supplierFilter.trim().toLowerCase())) return false;
                    }
                    return true;
                  })
                  .map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.invoiceNo}</td>
                    <td className="p-2">{p.supplier?.name || "-"}</td>
                    <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="p-2 text-right">₹{p.totalAmount?.toFixed(2)}</td>
                    <td className="p-2 text-right">₹{p.paidAmount?.toFixed(2)}</td>
                    <td className="p-2">{p.status}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button onClick={() => openPreview(p.id)} className="gap-2">
                          <Eye className="h-4 w-4" /> Preview
                        </Button>
                        <Button onClick={() => { setSelected(p); setOpen(true); }} variant="outline" className="gap-2">
                          <Printer className="h-4 w-4" /> Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Preview</DialogTitle>
          </DialogHeader>

          <div ref={printableRef} className="p-4">
            {selected ? (
              <div>
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Invoice</div>
                    <div className="font-semibold text-lg">{selected.invoiceNo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="font-semibold">{new Date(selected.date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600">Supplier</div>
                  <div className="font-semibold">{selected.supplier?.name || '-'}</div>
                </div>

                <div className="mb-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items?.map((it) => (
                        <tr key={it.id} className="border-b">
                          <td className="p-2">{it.item?.name || 'Item'}</td>
                          <td className="p-2 text-right">{it.quantity}</td>
                          <td className="p-2 text-right">₹{it.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-semibold">₹{(it.quantity * it.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-600 text-white">
                      <tr>
                        <td colSpan={3} className="p-3 text-right font-bold">Total:</td>
                        <td className="p-3 text-right font-bold">₹{selected.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex gap-2">
                  <Button onClick={doPrint} className="bg-green-600 hover:bg-green-700">Print</Button>
                  <Button onClick={() => setOpen(false)} variant="outline">Close</Button>
                </div>
              </div>
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseList;
