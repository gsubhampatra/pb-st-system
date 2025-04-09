import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/purchases', label: 'Purchases' },
    { path: '/purchases/new', label: 'New Purchase' },
    { path: '/items', label: 'Items' },
    { path: '/customers', label: 'Customers' },
  ];

  return (
    <nav className="bg-white border-b shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-xl font-semibold text-gray-800">
          <Link to="/">Patra Bhandar</Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle Button */}
        <button className="md:hidden text-2xl text-gray-700" onClick={toggleMenu}>
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
