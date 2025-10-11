"use client";
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { PurchaseItem } from "@/components/LocalPurchaseForm";

interface Props {
  currentItem: { name: string; quantity: string };
  setCurrentItem: (v: { name: string; quantity: string }) => void;
  searchItem: string;
  setSearchItem: (v: string) => void;
  serverItemResults: any[];
  visibleItems: any[];
  showItemDropdown: boolean;
  setShowItemDropdown: (b: boolean) => void;
  itemSearchRef: React.RefObject<HTMLInputElement | null>;
  quantityRef: React.RefObject<HTMLInputElement | null>;
  handleServerItemSearch: (q: string) => void;
  handleAddItem: () => void;
}

export default function ItemEntry(props: Props) {
  const {
    currentItem,
    setCurrentItem,
    searchItem,
    setSearchItem,
    serverItemResults,
    visibleItems,
    showItemDropdown,
    setShowItemDropdown,
    itemSearchRef,
    quantityRef,
    handleServerItemSearch,
    handleAddItem,
  } = props;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Input
            ref={itemSearchRef}
            placeholder="Search item..."
            value={searchItem}
            onChange={(e) => {
              handleServerItemSearch(e.target.value);
              setShowItemDropdown(true);
            }}
            onFocus={() => setShowItemDropdown(true)}
          />
          {showItemDropdown && searchItem && (
            <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-48 overflow-y-auto">
              <CardContent className="p-0">
                {serverItemResults.length > 0
                  ? serverItemResults.map((it) => (
                      <div
                        key={it.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setCurrentItem({ ...currentItem, name: it.name });
                          setSearchItem(it.name);
                          setShowItemDropdown(false);
                          quantityRef.current?.focus();
                        }}
                      >
                        <div className="font-semibold">{it.name}</div>
                        <div className="text-sm text-gray-600">Rate: ₹{it.basePrice ?? '—'}</div>
                      </div>
                    ))
                  : visibleItems.map((it: any) => (
                      <div
                        key={it.name}
                        className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-sm"
                        onClick={() => {
                          setCurrentItem({ ...currentItem, name: it.name });
                          setSearchItem(it.name);
                          setShowItemDropdown(false);
                          quantityRef.current?.focus();
                        }}
                      >
                        {it.name}
                      </div>
                    ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Input
          ref={quantityRef}
          type="number"
          step="0.01"
          placeholder="Quantity"
          value={currentItem.quantity}
          onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddItem();
            }
          }}
        />
      </div>
      <Button className="w-full gap-2" onClick={handleAddItem}>
        <Plus className="h-5 w-5" /> Add Item
      </Button>
    </div>
  );
}
