"use client";

import React, { useState } from "react";
import LocalPurchaseForm from "@/components/LocalPurchaseForm";
import PurchaseList from "@/components/PurchaseList";

export default function Home() {
  const [tab, setTab] = useState<"form" | "list">("form");

  return (
    <main className="overflow-hidden p-4">
      <div className="mb-4">
        <div className="inline-flex rounded-md bg-gray-100 p-1">
          <button
            onClick={() => setTab("form")}
            className={`px-4 py-2 rounded-md font-medium ${tab === "form" ? "bg-white shadow" : "text-gray-600"}`}
          >
            Purchase Form
          </button>
          <button
            onClick={() => setTab("list")}
            className={`px-4 py-2 rounded-md font-medium ${tab === "list" ? "bg-white shadow" : "text-gray-600"}`}
          >
            Purchase List
          </button>
        </div>
      </div>

      <div>
        {tab === "form" ? <LocalPurchaseForm /> : <PurchaseList />}
      </div>
    </main>
  );
}
