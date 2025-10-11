"use client";
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaseItem } from "@/components/LocalPurchaseForm";

interface Props {
  items: PurchaseItem[];
  handlePriceChange: (id: number, price: string) => void;
  handleRemoveItem: (id: number) => void;
  calculateTotal: () => number;
}

export default function ItemsList({ items, handlePriceChange, handleRemoveItem, calculateTotal }: Props) {
  return (
    <div className="space-y-3">
      <Label>Items List</Label>
      <Card>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="p-3 border-b last:border-b-0 bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  </div>
                  <Input type="number" step="0.01" placeholder="Price" className="w-24" value={item.price} onChange={(e) => handlePriceChange(item.id, e.target.value)} />
                  <div className="font-semibold text-gray-900 w-20 text-right">₹{(item.quantity * (parseFloat(item.price) || 0)).toFixed(2)}</div>
                  <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(item.id)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-blue-600 text-white">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Amount:</span>
              <span className="text-2xl font-bold">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
