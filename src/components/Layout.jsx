import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import * as BiIcons from 'react-icons/bi';
import * as AiIcons from 'react-icons/ai';
import * as HiIcons from 'react-icons/hi';
import * as RiIcons from 'react-icons/ri';

const { FiHome, FiLogOut, FiMenu, FiX, FiChevronDown, FiUsers, FiSettings, FiPlus, FiBell, FiUser } = FiIcons;

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, message: 'New transaction submitted by John Smith', type: 'transaction', time: '5 min ago' },
    { id: 2, message: 'Lender directory update pending approval', type: 'approval', time: '1 hour ago' }
  ]);

  // Navigation items based on user role
  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: AiIcons.AiOutlineDashboard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'LO Payments',
      href: '/loan-officer-payments',
      icon: RiIcons.RiMoneyDollarCircleLine,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      adminOnly: true
    },
    {
      name: 'My Payments', // For loan officers
      href: '/my-payments',
      icon: RiIcons.RiMoneyDollarCircleLine,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      loanOfficerOnly: true
    },
    {
      name: 'Statistics',
      href: '/statistics',
      icon: BiIcons.BiBarChartAlt2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Company Roster',
      href: '/loan-officers',
      icon: FiUsers,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100'
    },
    {
      name: 'Lender Directory',
      href: '/lenders',
      icon: HiIcons.HiOfficeBuilding,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100'
    },
    {
      name: 'Goals',
      href: '/goals',
      icon: BiIcons.BiTargetLock,
      color: 'text-teal-500',
      bgColor: 'bg-teal-100'
    },
    {
      name: 'Contacts',
      href: '/contacts',
      icon: BiIcons.BiBookContent,
      color: 'text-rose-500',
      bgColor: 'bg-rose-100'
    },
    {
      name: 'My Profile',
      href: '/profile',
      icon: FiUser,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      loanOfficerOnly: true
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && user?.type !== 'admin') {
      return false;
    }
    if (item.loanOfficerOnly && user?.type !== 'loan_officer') {
      return false;
    }
    return true;
  });

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
          navigation={filteredNavigation}
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
          navigation={filteredNavigation}
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
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">
                  Welcome back, {user?.name}
                </h2>
                <button
                  onClick={() => navigate('/transactions/new')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 shadow-sm"
                >
                  <SafeIcon icon={FiPlus} className="text-sm" />
                  <span>New Transaction</span>
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications for admin */}
                {user?.type === 'admin' && (
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                      <SafeIcon icon={FiBell} className="text-xl" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* User menu */}
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
                        <p className="text-xs text-blue-600 capitalize">
                          {user?.type?.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="px-3 py-2">
                        {user?.type === 'loan_officer' && (
                          <button
                            onClick={() => navigate('/profile')}
                            className="w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <SafeIcon icon={FiUser} className="mr-2 text-gray-500" />
                            My Profile
                          </button>
                        )}
                        <button className="w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                          <SafeIcon icon={FiSettings} className="mr-2 text-gray-500" />
                          Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-2 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <SafeIcon icon={FiLogOut} className="mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, location, navigate, user, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 space-y-1 p-4">
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
                  ? `bg-${item.color.split('-')[1]}-50 ${item.color} font-medium`
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`p-2 rounded-md ${isActive ? item.bgColor : 'bg-gray-100'} mr-3`}>
                <SafeIcon
                  icon={item.icon}
                  className={`text-lg ${isActive ? item.color : 'text-gray-600'}`}
                />
              </div>
              {item.name}
            </motion.button>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-600">{user?.email}</p>
          <p className="text-xs text-blue-600 capitalize">
            {user?.type?.replace('_', ' ')}
          </p>
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