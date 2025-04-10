import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import {
  FiShoppingCart,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiCreditCard,
  FiActivity,
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiFileText
} from 'react-icons/fi';

const HomePage = () => {
  const navigate = useNavigate();

  const navCards = [
    {
      id: 'sales',
      title: 'Sales Management',
      description: 'Create and manage sales, view sale history, print receipts',
      icon: <FiShoppingCart />,
      path: '/sales',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      id: 'new-sale',
      title: 'Create New Sale',
      description: 'Record a new sale transaction with customer details',
      icon: <FiShoppingCart />,
      path: '/sales/new',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
    },
    {
      id: 'purchases',
      title: 'Purchases Management',
      description: 'Create and manage purchases, view supplier purchases',
      icon: <FiShoppingBag />,
      path: '/purchases',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      id: 'new-purchase',
      title: 'Create New Purchase',
      description: 'Record a new purchase from suppliers',
      icon: <FiShoppingBag />,
      path: '/purchases/new',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      description: 'Add and manage items, view current stock levels',
      icon: <FiPackage />,
      path: '/items',
      color: 'bg-gradient-to-br from-amber-500 to-amber-600'
    },
    {
      id: 'customers',
      title: 'Customer Management',
      description: 'Manage customer details and credit history',
      icon: <FiUsers />,
      path: '/customers',
      color: 'bg-gradient-to-br from-rose-500 to-rose-600'
    },
    {
      id: 'accounts',
      title: 'Accounts Management',
      description: 'Manage business accounts and transactions',
      icon: <FiCreditCard />,
      path: '/accounts',
      color: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600'
    },
    {
      id: 'payments',
      title: 'Payments Management',
      description: 'Record and track payments to suppliers',
      icon: <FiDollarSign />,
      path: '/payments',
      color: 'bg-gradient-to-br from-sky-500 to-sky-600'
    },
    {
      id: 'new-payment',
      title: 'Create New Payment',
      description: 'Record a new payment to suppliers',
      icon: <FiDollarSign />,
      path: '/payments/new',
      color: 'bg-gradient-to-br from-teal-500 to-teal-600'
    },
    {
      id: 'receipts',
      title: 'Receipts Management',
      description: 'Record and track receipts from customers',
      icon: <FiFileText />,
      path: '/receipts',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600'
    },
    {
      id: 'new-receipt',
      title: 'Create New Receipt',
      description: 'Record a new receipt from customers',
      icon: <FiFileText />,
      path: '/receipts/new',
      color: 'bg-gradient-to-br from-red-500 to-red-600'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'View sales, purchases and inventory reports',
      icon: <FiBarChart2 />,
      path: '/reports',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      id: 'dashboard',
      title: 'Business Dashboard',
      description: 'Overview of sales, purchases, and stock levels',
      icon: <FiActivity />,
      path: '/dashboard',
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600'
    }
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  // Get today's date in a readable format
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="text-3xl font-bold text-gray-800">Patra Bhandar System</h1>
        <p className="text-gray-600">{today}</p>
      </div>
      <div className="cards-container">
        {navCards.map(card => (
          <div
            key={card.id}
            className="nav-card hover:scale-105 transition-transform duration-300"
            onClick={() => handleCardClick(card.path)}
          >
            <div className={`card-icon ${card.color}`}>
              {card.icon}
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
