"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Home,
  Menu,
  PanelLeft,
  Search,
  Wand2,
  X,
  ShoppingCart,
  ShoppingBag,
  Banknote,
  Receipt,
  Package,
  BarChart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import LocalPurchaseForm from "./LocalPurchaseForm";

type sidebarItemsType = {
  title: string;
  icon?: React.ReactNode;
  badge?: string | number;
  isActive?: boolean;
  url?: string;
  items?: {
    title: string;
    url?: string;
    badge?: string | number;
    tab?: string;
  }[];
};
const sidebarItems: sidebarItemsType[] = [
  {
    title: "Dashboard",
    icon: <Home />,
  },
  {
    title: "Purchase",
    icon: <ShoppingCart />,
    items: [
      {
        title: "Local Purchase",
        tab: "local-purchase",
        url: "/purchase/local-purchase",
      },
      {
        title: "Party Purchase",
        tab: "party-purchase",
        url: "/purchase/party-purchase",
      },
      {
        title: "Mill Purchase",
        tab: "mill-purchase",
        url: "/purchase/mill-purchase",
      },
      {
        title: "Purchase History",
        tab: "purchase-history",
        url: "/purchase/purchase-history",
      },
    ],
  },
  {
    title: "Sales",
    icon: <ShoppingBag />,
    items: [
      { title: "New Sale", tab: "new-sale", url: "/sales/new-sale" },
      {
        title: "Sales History",
        tab: "sales-history",
        url: "/sales/sales-history",
      },
    ],
  },
  {
    title: "Payments",
    icon: <Banknote />,
    items: [
      {
        title: "Make Payment",
        tab: "make-payment",
        url: "/payments/make-payment",
      },
      {
        title: "Payment History",
        tab: "payment-history",
        url: "/payments/payment-history",
      },
    ],
  },
  {
    title: "Receipts",
    icon: <Receipt />,
    items: [
      {
        title: "New Receipt",
        tab: "new-receipt",
        url: "/receipts/new-receipt",
      },
      {
        title: "Receipt History",
        tab: "receipt-history",
        url: "/receipts/receipt-history",
      },
    ],
  },
  {
    title: "Stocks",
    icon: <Package />,
    items: [
      {
        title: "Current Stock",
        tab: "current-stock",
        url: "/stocks/current-stock",
      },
      {
        title: "Stock Adjustments",
        tab: "stock-adjustments",
        url: "/stocks/stock-adjustments",
      },
    ],
  },
  {
    title: "Reports",
    icon: <BarChart />,
    items: [
      {
        title: "Purchase Report",
        tab: "purchase-report",
        url: "/reports/purchase-report",
      },
      {
        title: "Sales Report",
        tab: "sales-report",
        url: "/reports/sales-report",
      },
      { title: "Profit/Loss", tab: "profit-loss", url: "/reports/profit-loss" },
    ],
  },
];

export function Dashboard() {
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  // Simulate progress loading
  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
          ],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col border-r">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                <Wand2 className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">PB & ST</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-2xl bg-muted pl-9 pr-4 py-2"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <div key={item.title} className="mb-1">
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium",
                      item.isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => item.items && toggleExpanded(item.title)}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>

                    {item.items && (
                      <ChevronDown
                        className={cn(
                          "ml-2 h-4 w-4 transition-transform",
                          expandedItems[item.title] ? "rotate-180" : ""
                        )}
                      />
                    )}
                  </button>

                  {item.items && expandedItems[item.title] && (
                    <div className="mt-1 ml-6 space-y-1 border-l pl-3">
                      {item.items.map((subItem) => (
                        <a
                          key={subItem.title}
                          href={subItem.url}
                          className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted"
                        >
                          {subItem.title}
                          {subItem.badge && (
                            <Badge
                              variant="outline"
                              className="ml-auto rounded-full px-2 py-0.5 text-xs"
                            >
                              {subItem.badge}
                            </Badge>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:block",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                <Wand2 className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">PB & ST</h2>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <div key={item.title} className="mb-1">
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium",
                      item.isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => item.items && toggleExpanded(item.title)}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className="ml-auto rounded-full px-2 py-0.5 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.items && (
                      <ChevronDown
                        className={cn(
                          "ml-2 h-4 w-4 transition-transform",
                          expandedItems[item.title] ? "rotate-180" : ""
                        )}
                      />
                    )}
                  </button>

                  {item.items && expandedItems[item.title] && (
                    <div className="mt-1 ml-6 space-y-1 border-l pl-3">
                      {item.items.map((subItem) => (
                        <a
                          key={subItem.title}
                          href={subItem.url}
                          className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted"
                        >
                          {subItem.title}
                          {subItem.badge && (
                            <Badge
                              variant="outline"
                              className="ml-auto rounded-full px-2 py-0.5 text-xs"
                            >
                              {subItem.badge}
                            </Badge>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:pl-64" : "md:pl-0"
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-xl font-semibold">PB & ST</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Tabs
            defaultValue="dashboard"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className=" mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <TabsList className="grid w-full max-w-[900px] md:grid-cols-6 grid-cols-2 h-fit rounded-2xl md:p-1 p-2 max-md:space-x-2 max-md:space-y-2.5">
                <TabsTrigger
                  value="dashboard"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="purchase"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Purchase
                </TabsTrigger>
                <TabsTrigger
                  value="sales"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Sales
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Payments
                </TabsTrigger>
                <TabsTrigger
                  value="receipts"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Receipts
                </TabsTrigger>
                <TabsTrigger
                  value="stocks"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Stocks
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* --- Dashboard Content --- */}
                <TabsContent value="dashboard" className="space-y-8 mt-0">
                  <section>
                    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-white">
                      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-4">
                          <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-xl">
                            Overview
                          </Badge>
                          <h2 className="text-3xl font-bold">
                            Welcome, Subham!
                          </h2>
                          <p className="max-w-[600px] text-white/80">
                            Manage your daily operations efficiently with Patra
                            Bhandar and Subham Traders system.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Button className="rounded-2xl bg-white text-indigo-700 hover:bg-white/90">
                              Quick Sale
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-2xl bg-transparent border-white text-white hover:bg-white/10"
                            >
                              Add Purchase
                            </Button>
                          </div>
                        </div>
                        {/* Placeholder for animated element */}
                        <div className="hidden lg:block h-40 w-40 rounded-full bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </section>
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">Quick Stats</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="rounded-3xl p-6">
                        <CardTitle className="text-lg">Today's Sales</CardTitle>
                        <CardDescription className="text-3xl font-bold mt-2">
                          ₹ 15,200
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          +12% from yesterday
                        </p>
                      </Card>
                      <Card className="rounded-3xl p-6">
                        <CardTitle className="text-lg">
                          Current Stock Value
                        </CardTitle>
                        <CardDescription className="text-3xl font-bold mt-2">
                          ₹ 2,40,000
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          245 items in stock
                        </p>
                      </Card>
                      <Card className="rounded-3xl p-6">
                        <CardTitle className="text-lg">
                          Pending Payments
                        </CardTitle>
                        <CardDescription className="text-3xl font-bold mt-2">
                          ₹ 35,000
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          3 payments due
                        </p>
                      </Card>
                    </div>
                  </section>
                </TabsContent>

                {/* --- Purchase Content --- */}
                <TabsContent value="purchase" className="space-y-8 mt-0">
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      Add Purchase
                    </h2>
                    <LocalPurchaseForm />
                  </section>
                </TabsContent>
                {/* --- Sales Content --- */}
                <TabsContent value="sales" className="space-y-8 mt-0">
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">Sales</h2>
                  </section>
                </TabsContent>
                {/* --- Payments Content --- */}
                <TabsContent value="payments" className="space-y-8 mt-0">
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">Payments</h2>
                  </section>
                </TabsContent>
                {/* --- Receipts Content --- */}
                <TabsContent value="receipts" className="space-y-8 mt-0">
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">Receipts</h2>
                  </section>
                </TabsContent>
                {/* --- Stocks Content --- */}
                <TabsContent value="stocks" className="space-y-8 mt-0">
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">Stocks</h2>
                  </section>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
