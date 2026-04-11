import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  FiMenu,
  FiX,
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiPlus,
  FiDollarSign,
  FiCreditCard,
  FiFileText,
  FiChevronLeft,
  FiSettings,
  FiMoreHorizontal
} from 'react-icons/fi';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setOpen(!open);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const navLinks = [
    { path: '/', label: 'Home', icon: <FiHome size={18} /> },
    { path: '/purchases', label: 'Purchases', icon: <FiShoppingBag size={18} /> },
    { path: '/purchases/new', label: 'New Purchase', icon: <FiPlus size={18} /> },
    // { path: '/sales', label: 'Sales', icon: <FiShoppingCart size={18} /> },
    // { path: '/sales/new', label: 'New Sale', icon: <FiPlus size={18} /> },
    { path: '/payments', label: 'Payments', icon: <FiDollarSign size={18} /> },
    { path: '/payments/new', label: 'New Payment', icon: <FiPlus size={18} /> },
    { path: '/receipts', label: 'Receipts', icon: <FiFileText size={18} /> },
    { path: '/receipts/new', label: 'New Receipt', icon: <FiPlus size={18} /> },
    // { path: '/accounts', label: 'Accounts', icon: <FiCreditCard size={18} /> },
    { path: '/items', label: 'Items', icon: <FiPackage size={18} /> },
    // { path: '/customers', label: 'Customers', icon: <FiUsers size={18} /> },
    { path: '/suppliers', label: 'Suppliers', icon: <FiUsers size={18} /> },
    { path: '/reports', label: 'Reports', icon: <FiFileText size={18} /> },
    { path: '/database', label: 'Database', icon: <FiSettings size={18} /> },
  ];

  // Check if a path is active (exact match or starts with path for nested routes)
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path));
  };

  const mobileNavLinks = [
    { path: '/', label: 'Home', icon: <FiHome size={20} /> },
    { path: '/purchases', label: 'Purchases', icon: <FiShoppingBag size={20} /> },
    { path: '/payments', label: 'Payments', icon: <FiDollarSign size={20} /> },
    { path: '/receipts', label: 'Receipts', icon: <FiFileText size={20} /> },
    { path: '/suppliers', label: 'More', icon: <FiMoreHorizontal size={20} />, action: 'menu' },
  ];

  return (
    <>
      {/* Mobile Navbar */}
      <nav className="md:hidden sticky top-0 z-50 border-b border-white/60 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between px-4 py-3 safe-top">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              PB
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-gray-900">Patra Bhandar</span>
              <span className="block text-[11px] text-gray-500">Business management</span>
            </span>
          </Link>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm active:scale-95"
            onClick={toggleMenu}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        <div className="mx-4 mb-3 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-80" />

        {/* Mobile Menu */}
        {open && (
          <div className="border-t border-gray-100 bg-white px-3 py-2 shadow-2xl">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={`flex items-center rounded-2xl px-4 py-3.5 text-sm ${isActive(link.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-5 gap-1">
            {mobileNavLinks.map((link) => {
              if (link.action === 'menu') {
                return (
                  <button
                    key={link.path}
                    onClick={toggleMenu}
                    className={`flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-medium transition ${open ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                  >
                    <span className="mb-1">{link.icon}</span>
                    {link.label}
                  </button>
                );
              }

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className={`flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-medium transition active:scale-95 ${isActive(link.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <span className="mb-1">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white/95 backdrop-blur-xl shadow-md fixed left-0 top-0 h-screen z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b flex ${sidebarCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center text-xl font-semibold text-gray-800">
              <span className="text-blue-600 mr-2">PB</span>
              Patra Bhandar
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/" className="flex items-center text-xl font-semibold text-gray-800">
              <span className="text-blue-600">PB</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className={`text-gray-500 hover:text-gray-700 ${sidebarCollapsed ? 'ml-0 rotate-180' : ''}`}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FiChevronLeft size={20} />
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="flex-grow overflow-y-auto py-4">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-md ${isActive(link.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? link.label : ''}
            >
              <span className={sidebarCollapsed ? '' : 'mr-3'}>{link.icon}</span>
              {!sidebarCollapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </div>
      </aside>

      {/* Push content for desktop */}
      <div className="hidden md:block" style={{
        width: sidebarCollapsed ? '5rem' : '16rem',
        height: '1px'
      }} />
    </>
  );
};

export default Navbar;
