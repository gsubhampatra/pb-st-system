// src/App.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom'; // Import routing components
import PurchaseForm from './components/purchase/PurchaseForm'; // Assuming path is correct
import ItemsPage from './components/items/ItemsPage';
import CustomerTable from './components/customer/CustomerTable';
import PurchaseTable from './components/purchase/PurchaseTable';
import Navbar from './components/Navbar';
// Import other components/pages you might create later
// import HomePage from './pages/HomePage';
// import ItemList from './components/item/ItemList';
// import PurchaseList from './components/purchase/PurchaseList';

function HomePagePlaceholder() {
  return <h1 className="text-2xl font-bold">Welcome!</h1>;
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Main Content Area */}
      <main className="container mx-auto p-4">
        {/* Define the Routes */}
        <Routes>
          {/* Route for the homepage */}
          <Route path="/" element={<HomePagePlaceholder />} />

          {/* Route for the Purchase Form */}
          <Route path="/purchases/new" element={<PurchaseForm />} />


          <Route path='/items' element={<ItemsPage />} />

          <Route path='/customers' element={<CustomerTable />} />

          <Route path="/purchases" element={<PurchaseTable />} />

          <Route path="*" element={<div><h2>404 Page Not Found</h2><Link to="/">Go Home</Link></div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;