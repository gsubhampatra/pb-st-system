"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  paymentMode: string;
  setPaymentMode: (m: any) => void;
  paidCash: string;
  setPaidCash: (v: string) => void;
  paidOnline: string;
  setPaidOnline: (v: string) => void;
  accounts: any[];
  selectedAccountId: string | number | null;
  setSelectedAccountId: (v: string | number | null) => void;
  total: number;
}

export default function PaymentSection({ paymentMode, setPaymentMode, paidCash, setPaidCash, paidOnline, setPaidOnline, accounts, selectedAccountId, setSelectedAccountId, total }: Props) {
  return (
    <div className="space-y-3">
      <Label>Payment Mode</Label>
      <div className="flex gap-4">
        <Button variant={paymentMode === "cash" ? "default" : "outline"} className="flex-1" onClick={() => setPaymentMode("cash")}>Cash</Button>
        <Button variant={paymentMode === "online" ? "default" : "outline"} className="flex-1" onClick={() => setPaymentMode("online")}>Online</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div>
          <Label>Paid Cash</Label>
          <Input placeholder="0.00" value={paidCash} onChange={(e) => setPaidCash(e.target.value)} />
        </div>
        <div>
          <Label>Paid Online</Label>
          <Input placeholder="0.00" value={paidOnline} onChange={(e) => setPaidOnline(e.target.value)} />
        </div>
      </div>

      {paymentMode === "online" && (
        <div className="mt-2">
          <Label>Select Account</Label>
          <select className="w-full p-2 border rounded" value={selectedAccountId ?? ""} onChange={(e) => { const v = e.target.value; if (!v) setSelectedAccountId(null); else if (/^\d+$/.test(v)) setSelectedAccountId(parseInt(v, 10)); else setSelectedAccountId(v); }}>
            <option value="">-- Select Account --</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.bankName} - {a.accountNumber} ({a.accountHolder})</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-2 text-sm">
        <div>Total: ₹{total.toFixed(2)}</div>
        <div>Paid: ₹{(parseFloat(paidCash || "0") + parseFloat(paidOnline || "0")).toFixed(2)}</div>
        <div>Due: ₹{(total - (parseFloat(paidCash || "0") + parseFloat(paidOnline || "0"))).toFixed(2)}</div>
      </div>
    </div>
  );
}
