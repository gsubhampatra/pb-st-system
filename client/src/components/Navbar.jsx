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
  FiChevronLeft
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
    { path: '/sales', label: 'Sales', icon: <FiShoppingCart size={18} /> },
    { path: '/sales/new', label: 'New Sale', icon: <FiPlus size={18} /> },
    { path: '/payments', label: 'Payments', icon: <FiDollarSign size={18} /> },
    { path: '/payments/new', label: 'New Payment', icon: <FiPlus size={18} /> },
    { path: '/receipts', label: 'Receipts', icon: <FiFileText size={18} /> },
    { path: '/receipts/new', label: 'New Receipt', icon: <FiPlus size={18} /> },
    { path: '/accounts', label: 'Accounts', icon: <FiCreditCard size={18} /> },
    { path: '/items', label: 'Items', icon: <FiPackage size={18} /> },
    { path: '/customers', label: 'Customers', icon: <FiUsers size={18} /> },
    { path:  '/reports', label: 'Reports', icon: <FiFileText size={18} /> },
  ];

  // Check if a path is active (exact match or starts with path for nested routes)
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* Mobile Navbar */}
      <nav className="md:hidden bg-white border-b shadow-md sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-800">
            <Link to="/" className="flex items-center">
              <span className="text-blue-600 mr-2">PB</span>
              Patra Bhandar
            </Link>
          </div>

          {/* Mobile Toggle Button */}
          <button 
            className="text-2xl text-gray-700 p-2" 
            onClick={toggleMenu}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="bg-white border-t">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-3 ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-white shadow-md fixed left-0 top-0 h-screen z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
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
              className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-md ${
                isActive(link.path)
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
