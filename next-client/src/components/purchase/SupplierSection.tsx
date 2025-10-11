"use client";
import React from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Supplier } from "@/components/LocalPurchaseForm";

interface Props {
  suppliers: Supplier[];
  searchSupplier: string;
  setSearchSupplier: (v: string) => void;
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (s: Supplier | null) => void;
  showSupplierForm: boolean;
  setShowSupplierForm: (b: boolean) => void;
  newSupplier: Omit<Supplier, "id">;
  setNewSupplier: (s: Omit<Supplier, "id">) => void;
  handleAddSupplier: () => Promise<void>;
  supplierSearchRef: React.RefObject<HTMLInputElement | null>;
}

export default function SupplierSection(props: Props) {
  const {
    suppliers,
    searchSupplier,
    setSearchSupplier,
    selectedSupplier,
    setSelectedSupplier,
    showSupplierForm,
    setShowSupplierForm,
    newSupplier,
    setNewSupplier,
    handleAddSupplier,
    supplierSearchRef,
  } = props;

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchSupplier.toLowerCase()) ||
    s.phone.includes(searchSupplier) ||
    s.address.toLowerCase().includes(searchSupplier.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Label>Supplier Details</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          ref={supplierSearchRef}
          placeholder="Search supplier by name, phone or address..."
          className="pl-10"
          value={searchSupplier}
          onChange={(e) => {
            setSearchSupplier(e.target.value);
            setSelectedSupplier(null);
          }}
        />
      </div>

      {searchSupplier && !selectedSupplier && (
        <Card>
          <CardContent className="p-0 max-h-32 overflow-y-auto">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setSearchSupplier(supplier.name);
                }}
              >
                <div className="font-semibold text-gray-900">{supplier.name}</div>
                <div className="text-sm text-gray-600">{supplier.phone} • {supplier.address}</div>
              </div>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => setShowSupplierForm(true)}
            >
              <Plus className="h-4 w-4" /> Add New Supplier
            </Button>
          </CardContent>
        </Card>
      )}

      {showSupplierForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 space-y-3">
            <Input
              placeholder="Supplier Name"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleAddSupplier}>Add Supplier</Button>
              <Button variant="outline" onClick={() => setShowSupplierForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSupplier && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="font-semibold text-green-900">{selectedSupplier.name}</div>
            <div className="text-sm text-green-700">{selectedSupplier.phone} • {selectedSupplier.address}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
