"use client";
export interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface PurchaseItem {
  id: number;
  name: string;
  quantity: number;
  price: string;
  itemId?: string | number | null;
}

export type PaymentMode = "cash" | "online";

// components/LocalPurchaseForm.tsx
import React, { useState, useRef, useEffect } from "react";
import { Printer, MessageSquare, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { api, API_PATHS } from "@/lib/api";
import SupplierSection from "./purchase/SupplierSection";
import ItemEntry from "./purchase/ItemEntry";
import ItemsList from "./purchase/ItemsList";
import PaymentSection from "./purchase/PaymentSection";
import PreviewDialog from "./purchase/PreviewDialog";
import { useSuppliers } from "@/lib/queries/useSuppliers";
import { useItems, useItemSearch } from "@/lib/queries/useItems";
import { useAccounts } from "@/lib/queries/useAccounts";
// fallback local item names
const ITEM_OPTIONS: string[] = [
  "BIRI",
  "BROKEN RICE",
  "MOONG",
  "REJECTION RICE",
  "RICE",
  "TIL",
];
import { useRouter } from "next/navigation";

const LocalPurchaseForm: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [showSupplierForm, setShowSupplierForm] = useState<boolean>(false);
  const [searchSupplier, setSearchSupplier] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, "id">>({
    name: "",
    phone: "",
    address: "",
  });
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paidCash, setPaidCash] = useState<string>("");
  const [paidOnline, setPaidOnline] = useState<string>("");

  const [items, setItems] = useState<PurchaseItem[]>([]);
  // local map for itemName => last entered price
  const [itemPrices, setItemPrices] = useState<Record<string, string>>({});
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
  const router = useRouter();

  // fetched items from server for selection (search results)
  const [serverItemResults, setServerItemResults] = useState<any[]>([]);
  const [itemNameToId, setItemNameToId] = useState<
    Record<string, string | number>
  >({});
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | number | null
  >(null);


  // normalize visible items for dropdown: prefer server results, otherwise fallback to static options
  const visibleItems =
    serverItemResults && serverItemResults.length > 0
      ? serverItemResults
          .filter((i: any) =>
            i.name.toLowerCase().includes(searchItem.toLowerCase())
          )
          .slice(0, 8) // limit to first 8
      : ITEM_OPTIONS.filter((name) =>
          name.toLowerCase().includes(searchItem.toLowerCase())
        )
          .map((name) => ({ name }))
          .slice(0, 8);

  // preload invoice number on mount
  useEffect(() => {
    (async () => {
      try {
        const next = await generateInvoiceNo();
        setInvoiceNo(next);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  // use react-query hooks to fetch suppliers, items and accounts
  const suppliersQuery = useSuppliers({ page: 1, limit: 200 });
  const itemsQuery = useItems({ page: 1, limit: 200 });
  const accountsQuery = useAccounts({ page: 1, limit: 50 });

  // wire results into local state when queries return
  useEffect(() => {
    if (suppliersQuery.data) setSuppliers(suppliersQuery.data);
  }, [suppliersQuery.data]);

  useEffect(() => {
    if (itemsQuery.data) {
      setServerItemResults(itemsQuery.data);
      const priceMap: Record<string, string> = {};
      const nameToId: Record<string, string | number> = {};
      for (const it of itemsQuery.data) {
        if (it.name) nameToId[it.name] = it.id;
        if (typeof it.basePrice !== "undefined")
          priceMap[it.name] = String(it.basePrice);
      }
      setItemPrices((p) => ({ ...p, ...priceMap }));
      setItemNameToId((m) => ({ ...m, ...nameToId }));
    }
  }, [itemsQuery.data]);

  useEffect(() => {
    if (accountsQuery.data) setAccounts(accountsQuery.data);
  }, [accountsQuery.data]);

  // hook for searching items
  const itemSearchQuery = useItemSearch(searchItem);
  useEffect(() => {
    if (itemSearchQuery.data) setServerItemResults(itemSearchQuery.data);
  }, [itemSearchQuery.data]);

  const getStoredPrice = (itemName: string): string => {
    if (itemPrices[itemName]) return itemPrices[itemName];
    const existingItem = items.find((i) => i.name === itemName && i.price);
    return existingItem ? existingItem.price : "";
  };

  const handleAddSupplier = async (): Promise<void> => {
    if (newSupplier.name && newSupplier.phone) {
      try {
        // create supplier on server
        const resp = await api.post(API_PATHS.suppliers.create, newSupplier);
        const supplier: Supplier = resp.data;
        setSuppliers((prev) => [...prev, supplier]);
        setSelectedSupplier(supplier);
        setNewSupplier({ name: "", phone: "", address: "" });
        setShowSupplierForm(false);
        setSearchSupplier(supplier.name);
      } catch (err) {
        console.error(err);
        alert("Failed to create supplier on server.");
      }
    }
  };

  const handleAddItem = (): void => {
    if (currentItem.name && currentItem.quantity) {
      const newItem: PurchaseItem = {
        id: Date.now(),
        name: currentItem.name,
        quantity: parseFloat(currentItem.quantity),
        price: getStoredPrice(currentItem.name) || "",
        itemId: itemNameToId[currentItem.name] ?? null,
      };
      setItems(
        [...items, newItem].sort((a, b) => a.name.localeCompare(b.name))
      );
      // set item price map so future items auto-fill
      if (newItem.price) {
        setItemPrices((p) => ({ ...p, [newItem.name]: newItem.price }));
      }
      setCurrentItem({ name: "", quantity: "" });
      setSearchItem("");
      itemSearchRef.current?.focus();
    }
  };

  const handlePriceChange = (id: number, price: string): void => {
    const changed = items.map((item) =>
      item.id === id ? { ...item, price } : item
    );
    setItems(changed);
    // update price map for that item name
    const found = changed.find((i) => i.id === id);
    if (found) setItemPrices((p) => ({ ...p, [found.name]: price }));
  };

  const handleRemoveItem = (id: number): void => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateTotal = (): number => {
    return Math.round(
      items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + item.quantity * price;
      }, 0)
    );
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
    const message = encodeURIComponent(generateMessage());
    window.open(
      `https://wa.me/${selectedSupplier.phone}?text=${message}`,
      "_blank"
    );
  };

  const handleSMS = (): void => {
    if (!selectedSupplier) return;
    const message = encodeURIComponent(generateMessage());
    window.open(`sms:${selectedSupplier.phone}?body=${message}`, "_blank");
  };

  const handleSave = async () => {
    if (!selectedSupplier) {
      alert("Please select or create a supplier before saving.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    const total = calculateTotal();

    // Ensure all items exist on server and collect properly typed items for payload
    const itemsForPayload: Array<{
      itemId: string | number;
      name?: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const it of items) {
      let serverItemId = it.itemId ?? itemNameToId[it.name] ?? null;
      // If we don't have a server id (or it's a numeric local id), create the item on server
      if (!serverItemId || typeof serverItemId !== "string") {
        try {
          const createResp = await api.post(API_PATHS.items.create, {
            name: it.name,
            unit: "kg",
            basePrice: parseFloat(it.price || "0") || 0,
            currentStock: 0,
          });
          const createdItem = createResp.data;
          serverItemId = createdItem.id;
          // update maps/state
          setItemNameToId((m) => ({ ...m, [it.name]: serverItemId }));
          setServerItemResults((prev) => [...(prev || []), createdItem]);
        } catch (err) {
          console.error("Failed to create item on server:", err);
          throw err;
        }
      }

      itemsForPayload.push({
        itemId: serverItemId,
        name: it.name,
        quantity: Number(it.quantity),
        unitPrice: parseFloat(it.price || "0") || 0,
      });
    }

    const payload = {
      supplierId: String(selectedSupplier.id),
      date,
      items: itemsForPayload,
      totalAmount: total,
      paidAmount: parseFloat(paidCash || "0") + parseFloat(paidOnline || "0"),
      status:
        total - (parseFloat(paidCash || "0") + parseFloat(paidOnline || "0")) <=
        0
          ? "paid"
          : "recorded",
      invoiceNo,
    };

    try {
      // Client-side validation: ensure payload items are valid
      for (const it of itemsForPayload) {
        if (!it.itemId) {
          alert(
            `Missing server item id for item "${it.name}". Please create/select the item.`
          );
          return;
        }
        if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
          alert(`Invalid quantity for item "${it.name}". Enter a number > 0.`);
          return;
        }
        if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) {
          alert(`Invalid price for item "${it.name}". Enter a number >= 0.`);
          return;
        }
      }
      const resp = await api.post(API_PATHS.purchases.create, payload);
      const created = resp.data;

      const paidCashNum = parseFloat(paidCash || "0");
      const paidOnlineNum = parseFloat(paidOnline || "0");
      if (paidCashNum > 0) {
        await api.post(API_PATHS.payments.create, {
          supplierId: selectedSupplier.id,
          amount: paidCashNum,
          method: "cash",
          date,
        });
      }
      if (paidOnlineNum > 0) {
        await api.post(API_PATHS.payments.create, {
          supplierId: selectedSupplier.id,
          amount: paidOnlineNum,
          method: "account",
          date,
          ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
        });
      }

      // store preview payload and created response
      sessionStorage.setItem(
        "purchasePreview",
        JSON.stringify({ payload, created })
      );
      router.push("/purchase/preview");
    } catch (err: any) {
      // Improved error logging: show server response body when available
      const serverData = err?.response?.data;
      console.error("Purchase save error:", err, serverData);
      const msg =
        serverData?.message ||
        serverData?.error ||
        err?.message ||
        "Unknown error";
      alert("Error saving purchase: " + msg);
    }
  };

  function generateMessage() {
    const lines = [] as string[];
    lines.push(`Invoice #: ${invoiceNo}`);
    lines.push(`Date: ${date}`);
    if (selectedSupplier) lines.push(`Supplier: ${selectedSupplier.name}`);
    lines.push("Items:");
    for (const it of items) {
      lines.push(
        `${it.name} x ${it.quantity} @ ₹${parseFloat(it.price || "0").toFixed(
          2
        )} = ₹${(it.quantity * parseFloat(it.price || "0")).toFixed(2)}`
      );
    }
    lines.push(`Total: ₹${calculateTotal().toFixed(2)}`);
    return lines.join("\n");
  }

  async function generateInvoiceNo(): Promise<string> {
    try {
      const resp = await api.get(API_PATHS.purchases.getAll, {
        params: { page: 1, limit: 1 },
      });
      const data = resp.data?.data || [];
      const last = data[0];
      const today = new Date();
      const year = today.getFullYear().toString().slice(2);
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
      const prefix = `${year}${month}${day}`;
      if (last && last.invoiceNo && last.invoiceNo.startsWith(prefix)) {
        const suffix = parseInt(last.invoiceNo.slice(6), 10) || 0;
        const next = (suffix + 1).toString().padStart(4, "0");
        return `${prefix}${next}`;
      }
      return `${prefix}0001`;
    } catch (err) {
      const today = new Date();
      const year = today.getFullYear().toString().slice(2);
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
      return `${year}${month}${day}0001`;
    }
  }

  // when ItemEntry calls onSearchInput, update searchItem to trigger useItemSearch
  const onSearchInput = (q: string) => {
    setSearchItem(q);
    if (!q || q.length < 1) setServerItemResults([]);
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
          <SupplierSection
            suppliers={suppliers}
            searchSupplier={searchSupplier}
            setSearchSupplier={setSearchSupplier}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            showSupplierForm={showSupplierForm}
            setShowSupplierForm={setShowSupplierForm}
            newSupplier={newSupplier}
            setNewSupplier={setNewSupplier}
            handleAddSupplier={handleAddSupplier}
            supplierSearchRef={supplierSearchRef}
          />

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
          <ItemEntry
            currentItem={currentItem}
            setCurrentItem={setCurrentItem}
            searchItem={searchItem}
            setSearchItem={setSearchItem}
            serverItemResults={serverItemResults}
            visibleItems={visibleItems}
            showItemDropdown={showItemDropdown}
            setShowItemDropdown={setShowItemDropdown}
            itemSearchRef={itemSearchRef}
            quantityRef={quantityRef}
            handleServerItemSearch={onSearchInput}
            handleAddItem={handleAddItem}
          />

          {/* Items List */}
          {items.length > 0 && (
            <ItemsList
              items={items}
              handlePriceChange={handlePriceChange}
              handleRemoveItem={handleRemoveItem}
              calculateTotal={calculateTotal}
            />
          )}

          {/* Payment Mode */}
          <PaymentSection
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            paidCash={paidCash}
            setPaidCash={setPaidCash}
            paidOnline={paidOnline}
            setPaidOnline={setPaidOnline}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            total={calculateTotal()}
          />

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t-2 border-gray-200">
            <Button
              className="w-full gap-2"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-5 w-5" /> Preview
            </Button>

            <Button
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={async () => {
                // Save and open preview
                await handleSave();
              }}
            >
              Save & Open Preview
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
      <PreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        invoiceNo={invoiceNo}
        date={date}
        supplier={selectedSupplier}
        items={items}
        total={calculateTotal()}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default LocalPurchaseForm;
