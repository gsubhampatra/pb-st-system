export interface Supplier {
  id: number;
  name: string;
  phone: string;
  village: string;
}

export interface PurchaseItem {
  id: number;
  name: string;
  quantity: number;
  price: string;
}

export type PaymentMode = "cash" | "online";

// components/LocalPurchaseForm.tsx
import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  X,
  Printer,
  MessageSquare,
  Send,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEM_OPTIONS = [
  "BIRI",
  "BROKEN RICE",
  "MOONG",
  "REJECTION RICE",
  "RICE",
  "TIL",
];

const LocalPurchaseForm: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 1, name: "Ram Kumar", phone: "9876543210", village: "Rampur" },
    { id: 2, name: "Shyam Singh", phone: "9876543211", village: "Shyampur" },
  ]);

  const [showSupplierForm, setShowSupplierForm] = useState<boolean>(false);
  const [searchSupplier, setSearchSupplier] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, "id">>({
    name: "",
    phone: "",
    village: "",
  });
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [currentItem, setCurrentItem] = useState<{
    name: string;
    quantity: string;
  }>({
    name: "",
    quantity: "",
  });
  const [searchItem, setSearchItem] = useState<string>("");
  const [showItemDropdown, setShowItemDropdown] = useState<boolean>(false);

  const [showPreview, setShowPreview] = useState<boolean>(false);

  const supplierSearchRef = useRef<HTMLInputElement | null>(null);
  const itemSearchRef = useRef<HTMLInputElement | null>(null);
  const quantityRef = useRef<HTMLInputElement | null>(null);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchSupplier.toLowerCase()) ||
      s.phone.includes(searchSupplier) ||
      s.village.toLowerCase().includes(searchSupplier.toLowerCase())
  );

  const filteredItems = ITEM_OPTIONS.filter((item) =>
    item.toLowerCase().includes(searchItem.toLowerCase())
  );

  const getStoredPrice = (itemName: string): string => {
    const existingItem = items.find((i) => i.name === itemName);
    return existingItem ? existingItem.price : "";
  };

  const handleAddSupplier = (): void => {
    if (newSupplier.name && newSupplier.phone) {
      const supplier: Supplier = { ...newSupplier, id: Date.now() };
      setSuppliers([...suppliers, supplier]);
      setSelectedSupplier(supplier);
      setNewSupplier({ name: "", phone: "", village: "" });
      setShowSupplierForm(false);
      setSearchSupplier(supplier.name);
    }
  };

  const handleAddItem = (): void => {
    if (currentItem.name && currentItem.quantity) {
      const newItem: PurchaseItem = {
        id: Date.now(),
        name: currentItem.name,
        quantity: parseFloat(currentItem.quantity),
        price: getStoredPrice(currentItem.name) || "",
      };
      setItems(
        [...items, newItem].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCurrentItem({ name: "", quantity: "" });
      setSearchItem("");
      itemSearchRef.current?.focus();
    }
  };

  const handlePriceChange = (id: number, price: string): void => {
    setItems(items.map((item) => (item.id === id ? { ...item, price } : item)));
  };

  const handleRemoveItem = (id: number): void => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + item.quantity * price;
    }, 0);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleWhatsApp = (): void => {
    if (!selectedSupplier) return;
    const message = encodeURIComponent(
      `Purchase Invoice #${invoiceNo}\nDate: ${date}\nSupplier: ${
        selectedSupplier.name
      }\nTotal Amount: ₹${calculateTotal().toFixed(2)}`
    );
    window.open(
      `https://wa.me/${selectedSupplier.phone}?text=${message}`,
      "_blank"
    );
  };

  const handleSMS = (): void => {
    if (!selectedSupplier) return;
    const message = encodeURIComponent(
      `Purchase Invoice #${invoiceNo}\nDate: ${date}\nTotal: ₹${calculateTotal().toFixed(
        2
      )}`
    );
    window.open(`sms:${selectedSupplier.phone}?body=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Local Purchase Form
          </h1>
          <p className="text-blue-100 mt-1">Rice & Grains Purchase Entry</p>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Supplier Section */}
          <div className="space-y-3">
            <Label>Supplier Details</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                ref={supplierSearchRef}
                placeholder="Search supplier by name, phone or village..."
                className="pl-10"
                value={searchSupplier}
                onChange={(e) => {
                  setSearchSupplier(e.target.value);
                  setSelectedSupplier(null);
                }}
                onKeyPress={(e) => handleKeyPress(e, itemSearchRef)}
              />
            </div>

            {searchSupplier && !selectedSupplier && (
              <Card>
                <CardContent className="p-0 max-h-48 overflow-y-auto">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setSearchSupplier(supplier.name);
                      }}
                    >
                      <div className="font-semibold text-gray-900">
                        {supplier.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {supplier.phone} • {supplier.village}
                      </div>
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
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, name: e.target.value })
                    }
                  />
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={newSupplier.phone}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, phone: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Village"
                    value={newSupplier.village}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        village: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleAddSupplier}>
                      Add Supplier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSupplierForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedSupplier && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="font-semibold text-green-900">
                    {selectedSupplier.name}
                  </div>
                  <div className="text-sm text-green-700">
                    {selectedSupplier.phone} • {selectedSupplier.village}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Date and Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice No</Label>
              <Input
                placeholder="Enter invoice number"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>
          </div>

          {/* Items Entry */}
          <div className="space-y-3">
            <Label>Add Items</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Input
                  ref={itemSearchRef}
                  placeholder="Search item..."
                  value={searchItem}
                  onChange={(e) => {
                    setSearchItem(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && filteredItems.length > 0) {
                      e.preventDefault();
                      setCurrentItem({
                        ...currentItem,
                        name: filteredItems[0],
                      });
                      setSearchItem(filteredItems[0]);
                      setShowItemDropdown(false);
                      quantityRef.current?.focus();
                    }
                  }}
                />
                {showItemDropdown && searchItem && (
                  <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-48 overflow-y-auto">
                    <CardContent className="p-0">
                      {filteredItems.map((item) => (
                        <div
                          key={item}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setCurrentItem({ ...currentItem, name: item });
                            setSearchItem(item);
                            setShowItemDropdown(false);
                            quantityRef.current?.focus();
                          }}
                        >
                          {item}
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
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, quantity: e.target.value })
                }
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

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <Label>Items List</Label>
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 border-b last:border-b-0 bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </div>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            className="w-24"
                            value={item.price}
                            onChange={(e) =>
                              handlePriceChange(item.id, e.target.value)
                            }
                          />
                          <div className="font-semibold text-gray-900 w-20 text-right">
                            ₹
                            {(
                              item.quantity * (parseFloat(item.price) || 0)
                            ).toFixed(2)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-blue-600 text-white">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Amount:</span>
                      <span className="text-2xl font-bold">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Mode */}
          <div className="space-y-3">
            <Label>Payment Mode</Label>
            <div className="flex gap-4">
              <Button
                variant={paymentMode === "cash" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentMode("cash")}
              >
                Cash
              </Button>
              <Button
                variant={paymentMode === "online" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentMode("online")}
              >
                Online
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t-2 border-gray-200">
            <Button
              className="w-full gap-2"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-5 w-5" /> Preview
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={handlePrint}
              >
                <Printer className="h-5 w-5" /> Print
              </Button>
              <Button
                className="gap-2 bg-blue-500 hover:bg-blue-600"
                onClick={handleSMS}
              >
                <MessageSquare className="h-5 w-5" /> SMS
              </Button>
            </div>

            <Button
              className="w-full gap-2 bg-green-500 hover:bg-green-600"
              onClick={handleWhatsApp}
            >
              <Send className="h-5 w-5" /> Send WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              Purchase Invoice
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Invoice No:</div>
                <div className="font-semibold">{invoiceNo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Date:</div>
                <div className="font-semibold">{date}</div>
              </div>
            </div>

            {selectedSupplier && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="text-sm text-gray-600">Supplier Details:</div>
                  <div className="font-semibold text-lg">
                    {selectedSupplier.name}
                  </div>
                  <div className="text-gray-700">{selectedSupplier.phone}</div>
                  <div className="text-gray-700">
                    {selectedSupplier.village}
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <div className="text-sm text-gray-600 mb-2">Items:</div>
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Rate</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.name}</td>
                      <td className="text-right p-2">{item.quantity}</td>
                      <td className="text-right p-2">
                        ₹{parseFloat(item.price || "0").toFixed(2)}
                      </td>
                      <td className="text-right p-2 font-semibold">
                        ₹
                        {(
                          item.quantity * (parseFloat(item.price) || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-600 text-white">
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-bold">
                      Total:
                    </td>
                    <td className="p-3 text-right font-bold text-lg">
                      ₹{calculateTotal().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="text-sm text-gray-600">Payment Mode:</div>
                <div className="font-semibold text-lg capitalize">
                  {paymentMode}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocalPurchaseForm;
