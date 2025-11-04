import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import PurchaseForm from './components/purchase/PurchaseForm';
import ItemsPage from './components/items/ItemsPage';
import CustomerTable from './components/customer/CustomerTable';
import SupplierTable from './components/suppliers/SupplierTable';
import PurchaseTable from './components/purchase/PurchaseTable';
import SalesPage from './components/sales/SalesPage';
import Navbar from './components/Navbar';
import HomePage from './components/home/HomePage';
import AccountsPage from './components/accounts/AccountsPage';
import PaymentTable from './components/payments/PaymentTable';
import PaymentForm from './components/payments/PaymentForm';
import ReceiptTable from './components/receipt/ReceiptTable';
import ReceiptForm from './components/receipt/ReceiptForm';
import DatabasePage from './components/database/DatabasePage';
import { CustomerProvider } from './contexts/CustomerContext';
import { SupplierProvider } from './contexts/SupplierContext';
import { ItemProvider } from './contexts/ItemContext';
import ReportsPage from './components/reports/ReportsPage';
import PurchaseInvoice from './components/purchase/PurchaseInvoice';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <CustomerProvider>
        <SupplierProvider>
          <ItemProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
              <Navbar />
              {/* Main Content Area */}
              <main className="flex-1 p-4 md:ml-0">
                <div className="max-w-7xl mx-auto">
                  {/* Define the Routes */}
                  <Routes>
                  {/* Home Page */}
                  <Route path="/" element={<HomePage />} />

                  {/* Purchase Routes */}
                  <Route path="/purchases" element={<PurchaseTable />} />
                  <Route path="/purchases/new" element={<PurchaseForm />} />
                  <Route path="/purchases/invoice/:purchaseId" element={<PurchaseInvoice />} />

                  {/* Sales Routes */}
                  <Route path="/sales/*" element={<SalesPage />} />

                  {/* Items Route */}
                  <Route path="/items" element={<ItemsPage />} />

                  {/* Database Management Route */}
                  <Route path="/database" element={<DatabasePage />} />

                  {/* Customers Route */}
                  <Route path="/customers" element={<CustomerTable />} />

                  {/* Suppliers Route */}
                  <Route path="/suppliers" element={<SupplierTable />} />

                  {/* Accounts Route */}
                  <Route path="/accounts" element={<AccountsPage />} />

                  {/* Payments Routes */}
                  <Route path="/payments" element={<PaymentTable />} />
                  <Route path="/payments/new" element={<PaymentForm />} />

                  {/* Receipts Routes */}
                  <Route path="/receipts" element={<ReceiptTable />} />
                  <Route path="/receipts/new" element={<ReceiptForm />} />

                  <Route path="/reports" element={<ReportsPage />} />

                  {/* 404 Route */}
                  <Route path="*" element={
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">404 Page Not Found</h2>
                      <Link to="/" className="text-blue-600 hover:text-blue-800">Return to Home</Link>
                    </div>
                  } />
                  </Routes>
                </div>
              </main>
            </div>
          </ItemProvider>
        </SupplierProvider>
      </CustomerProvider>
    </ToastProvider>
  );
}

export default App;