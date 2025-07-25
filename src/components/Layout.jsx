import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiHome, 
  FiPlus, 
  FiBarChart3, 
  FiUsers, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiChevronDown,
  FiTarget,
  FiBuilding,
  FiDollarSign
} = FiIcons;

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FiHome },
    { name: 'New Transaction', href: '/transactions/new', icon: FiPlus },
    { name: 'Statistics', href: '/statistics', icon: FiBarChart3 },
    { name: 'Goals', href: '/goals', icon: FiTarget },
    { name: 'Lender Directory', href: '/lenders', icon: FiBuilding },
    ...(user?.type === 'admin' 
      ? [
          { name: 'Loan Officers', href: '/loan-officers', icon: FiUsers },
          { name: 'LO Payments', href: '/loan-officer-payments', icon: FiDollarSign }
        ] 
      : []
    )
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:hidden"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">Mortgage Tracker</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <SafeIcon icon={FiX} className="text-gray-600" />
          </button>
        </div>
        <SidebarContent 
          navigation={navigation} 
          location={location} 
          navigate={navigate} 
          user={user}
          onLogout={handleLogout}
        />
      </motion.div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-80 lg:bg-white lg:shadow-xl">
        <div className="flex items-center p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Mortgage Tracker</h1>
        </div>
        <SidebarContent 
          navigation={navigation} 
          location={location} 
          navigate={navigate} 
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <SafeIcon icon={FiMenu} className="text-gray-600" />
            </button>

            {/* User dropdown menu */}
            <div className="flex-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">
                Welcome back, {user?.name}
              </h2>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block font-medium text-gray-700">{user?.name}</span>
                  <SafeIcon icon={FiChevronDown} className="text-gray-500" />
                </button>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
                  >
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                      <p className="text-xs text-blue-600 capitalize">{user?.type?.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-red-700 hover:bg-red-50 text-sm"
                    >
                      <SafeIcon icon={FiLogOut} className="mr-2" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, location, navigate, user, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <motion.button
              key={item.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <SafeIcon icon={item.icon} className="mr-3 text-lg" />
              {item.name}
            </motion.button>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-600">{user?.email}</p>
          <p className="text-xs text-blue-600 capitalize">{user?.type?.replace('_', ' ')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <SafeIcon icon={FiLogOut} className="mr-3" />
          Sign Out
        </motion.button>
      </div>
    </div>
  );
}

export default Layout;