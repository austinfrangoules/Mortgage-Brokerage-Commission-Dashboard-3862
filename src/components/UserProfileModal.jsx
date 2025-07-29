import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';

const { 
  FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiAward, FiShield, 
  FiEdit3, FiUsers, FiDollarSign, FiTrendingUp, FiTarget, FiCheck, 
  FiEye, FiSettings, FiDownload, FiBarChart3, FiPlus, FiTrash2,
  FiUserCheck, FiBriefcase, FiStar, FiClock
} = FiIcons;

function UserProfileModal({ user, userType, onClose, onEdit, onEditPermissions }) {
  const { transactions, loanOfficers } = useData();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate statistics for loan officers
  const calculateLOStats = (officerId) => {
    if (userType !== 'loan_officer') return null;

    const officerTransactions = transactions.filter(t => t.loanOfficerId === officerId);
    const closedTransactions = officerTransactions.filter(t => t.status === 'Closed');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const yearTransactions = officerTransactions.filter(t => 
      new Date(t.applicationDate).getFullYear() === currentYear
    );

    const monthTransactions = officerTransactions.filter(t => {
      const date = new Date(t.applicationDate);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    const yearCommission = yearTransactions
      .filter(t => t.status === 'Closed')
      .reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0);

    const monthCommission = monthTransactions
      .filter(t => t.status === 'Closed')
      .reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0);

    return {
      totalTransactions: officerTransactions.length,
      closedTransactions: closedTransactions.length,
      totalVolume: officerTransactions.reduce((sum, t) => sum + t.loanAmount, 0),
      totalCommission: closedTransactions.reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0),
      yearCommission,
      monthCommission,
      conversionRate: officerTransactions.length > 0 ? (closedTransactions.length / officerTransactions.length) * 100 : 0,
      avgDealSize: officerTransactions.length > 0 ? officerTransactions.reduce((sum, t) => sum + t.loanAmount, 0) / officerTransactions.length : 0
    };
  };

  const stats = calculateLOStats(user.id);

  // Permission categories with icons and descriptions
  const getPermissionCategories = () => {
    const baseCategories = {
      dashboard: {
        label: 'Dashboard',
        icon: FiBarChart3,
        color: 'blue',
        description: 'Access to main dashboard and overview'
      },
      transactions: {
        label: 'Transactions',
        icon: FiDollarSign,
        color: 'green',
        description: 'Manage mortgage transactions and deals'
      },
      statistics: {
        label: 'Statistics',
        icon: FiBarChart3,
        color: 'purple',
        description: 'View performance analytics and reports'
      },
      lenders: {
        label: 'Lender Directory',
        icon: FiUsers,
        color: 'amber',
        description: 'Manage lender relationships and information'
      },
      goals: {
        label: 'Goals',
        icon: FiTarget,
        color: 'teal',
        description: 'Set and track performance goals'
      },
      contacts: {
        label: 'Contacts',
        icon: FiUsers,
        color: 'rose',
        description: 'Manage realtor and settlement contacts'
      },
      profile: {
        label: 'Profile',
        icon: FiUser,
        color: 'gray',
        description: 'Personal profile management'
      },
      payments: {
        label: 'Payments',
        icon: FiDollarSign,
        color: 'green',
        description: 'Commission and payment tracking'
      }
    };

    if (userType === 'admin') {
      return {
        ...baseCategories,
        loanOfficers: {
          label: 'Loan Officers',
          icon: FiUsers,
          color: 'indigo',
          description: 'Manage loan officer team and roster'
        },
        settings: {
          label: 'Settings',
          icon: FiSettings,
          color: 'gray',
          description: 'System configuration and settings'
        },
        reports: {
          label: 'Reports',
          icon: FiDownload,
          color: 'blue',
          description: 'Generate and export business reports'
        }
      };
    }

    return baseCategories;
  };

  const permissionCategories = getPermissionCategories();

  // Count active permissions
  const getActivePermissionsCount = () => {
    if (!user.permissions) return 0;
    return Object.values(user.permissions).reduce((total, categoryPerms) => 
      total + Object.values(categoryPerms).filter(Boolean).length, 0
    );
  };

  const getTotalPermissionsCount = () => {
    return Object.values(permissionCategories).reduce((total, category) => 
      total + Object.keys(category.permissions || {}).length, 0
    );
  };

  // Get permission icon
  const getPermissionIcon = (permKey) => {
    const iconMap = {
      view: FiEye,
      edit: FiEdit3,
      delete: FiTrash2,
      create: FiPlus,
      export: FiDownload,
      process: FiSettings,
      schedule: FiClock
    };
    return iconMap[permKey] || FiShield;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'permissions', label: 'Permissions', icon: FiShield },
    ...(userType === 'loan_officer' && stats ? [{ id: 'performance', label: 'Performance', icon: FiTrendingUp }] : [])
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 ${
          userType === 'loan_officer' 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
            : 'bg-gradient-to-r from-purple-500 to-pink-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{user.name}</h2>
                <p className="text-blue-100">
                  {userType === 'loan_officer' ? 'Loan Officer' : `${user.role?.replace('_', ' ').toUpperCase()} Administrator`}
                </p>
                {user.department && (
                  <p className="text-sm text-blue-100">{user.department} Department</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditPermissions(userType, user)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg flex items-center space-x-2"
                title="Edit Permissions"
              >
                <SafeIcon icon={FiShield} />
                <span className="hidden sm:inline">Permissions</span>
              </button>
              <button
                onClick={() => onEdit(user)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg flex items-center space-x-2"
                title="Edit Profile"
              >
                <SafeIcon icon={FiEdit3} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SafeIcon icon={tab.icon} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                  
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiMail} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{user.email || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiPhone} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {user.hireDate && (
                    <div className="flex items-center space-x-3">
                      <SafeIcon icon={FiCalendar} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Hire Date</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(user.hireDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  {userType === 'admin' && user.role && (
                    <div className="flex items-center space-x-3">
                      <SafeIcon icon={FiUserCheck} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {user.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    {userType === 'loan_officer' ? 'Professional Details' : 'Administrative Details'}
                  </h3>

                  {userType === 'loan_officer' && (
                    <>
                      {user.nmlsNumber && (
                        <div className="flex items-center space-x-3">
                          <SafeIcon icon={FiAward} className="text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">NMLS Number</p>
                            <p className="font-medium text-gray-900">{user.nmlsNumber}</p>
                          </div>
                        </div>
                      )}

                      {user.licenseStates && user.licenseStates.length > 0 && (
                        <div className="flex items-start space-x-3">
                          <SafeIcon icon={FiMapPin} className="text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Licensed States</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.licenseStates.map(state => (
                                <span key={state} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {state}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {user.specialties && user.specialties.length > 0 && (
                        <div className="flex items-start space-x-3">
                          <SafeIcon icon={FiStar} className="text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Specialties</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.specialties.map(specialty => (
                                <span key={specialty} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {userType === 'admin' && user.department && (
                    <div className="flex items-center space-x-3">
                      <SafeIcon icon={FiBriefcase} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium text-gray-900">{user.department}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals (Loan Officers) */}
              {userType === 'loan_officer' && (user.monthlyGoal > 0 || user.yearlyGoal > 0) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.monthlyGoal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Monthly Goal</span>
                          <span className="font-medium">
                            ${stats ? stats.monthCommission.toLocaleString() : '0'} / ${user.monthlyGoal.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${stats ? Math.min((stats.monthCommission / user.monthlyGoal) * 100, 100) : 0}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {stats ? ((stats.monthCommission / user.monthlyGoal) * 100).toFixed(1) : 0}% completed
                        </p>
                      </div>
                    )}

                    {user.yearlyGoal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Yearly Goal</span>
                          <span className="font-medium">
                            ${stats ? stats.yearCommission.toLocaleString() : '0'} / ${user.yearlyGoal.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${stats ? Math.min((stats.yearCommission / user.yearlyGoal) * 100, 100) : 0}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {stats ? ((stats.yearCommission / user.yearlyGoal) * 100).toFixed(1) : 0}% completed
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {user.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{user.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Permission Overview</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {getActivePermissionsCount()}/{getTotalPermissionsCount()}
                  </div>
                  <div className="text-sm text-gray-600">Active Permissions</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                  const userCategoryPerms = user.permissions?.[categoryKey] || {};
                  const categoryPermissions = {
                    dashboard: { view: 'View Dashboard', edit: 'Edit Dashboard Settings' },
                    transactions: { view: 'View Transactions', edit: 'Edit Transactions', delete: 'Delete Transactions', create: 'Create Transactions' },
                    statistics: { view: 'View Statistics', export: 'Export Reports' },
                    lenders: { view: 'View Lenders', edit: 'Edit Lenders', delete: 'Delete Lenders', create: 'Add Lenders' },
                    goals: { view: 'View Goals', edit: 'Edit Goals', delete: 'Delete Goals', create: 'Create Goals' },
                    contacts: { view: 'View Contacts', edit: 'Edit Contacts', delete: 'Delete Contacts', create: 'Add Contacts' },
                    profile: { view: 'View Profile', edit: 'Edit Profile' },
                    payments: { view: 'View Payments', edit: 'Edit Payment Records', process: 'Process Payments' },
                    loanOfficers: { view: 'View Loan Officers', edit: 'Edit Loan Officers', delete: 'Delete Loan Officers', create: 'Add Loan Officers' },
                    settings: { view: 'View Settings', edit: 'Modify Settings' },
                    reports: { view: 'View Reports', export: 'Export Reports', schedule: 'Schedule Reports' }
                  };

                  const permissions = categoryPermissions[categoryKey] || {};
                  const activePerms = Object.keys(permissions).filter(perm => userCategoryPerms[perm]);
                  const hasAnyPermission = activePerms.length > 0;

                  return (
                    <div
                      key={categoryKey}
                      className={`border rounded-lg p-4 ${
                        hasAnyPermission 
                          ? `bg-${category.color}-50 border-${category.color}-200` 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          hasAnyPermission 
                            ? `bg-${category.color}-100` 
                            : 'bg-gray-100'
                        }`}>
                          <SafeIcon 
                            icon={category.icon} 
                            className={`text-lg ${
                              hasAnyPermission 
                                ? `text-${category.color}-600` 
                                : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className={`font-medium ${
                            hasAnyPermission 
                              ? `text-${category.color}-900` 
                              : 'text-gray-900'
                          }`}>
                            {category.label}
                          </h4>
                          <p className="text-xs text-gray-600">{category.description}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Object.entries(permissions).map(([permKey, permLabel]) => {
                          const isEnabled = userCategoryPerms[permKey] || false;
                          return (
                            <div key={permKey} className="flex items-center space-x-2">
                              <SafeIcon 
                                icon={isEnabled ? FiCheck : FiX} 
                                className={`text-sm ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}
                              />
                              <SafeIcon 
                                icon={getPermissionIcon(permKey)} 
                                className="text-xs text-gray-500" 
                              />
                              <span className={`text-sm ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                {permLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-right">
                        <span className={`text-xs font-medium ${
                          hasAnyPermission 
                            ? `text-${category.color}-600` 
                            : 'text-gray-500'
                        }`}>
                          {activePerms.length}/{Object.keys(permissions).length} active
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Performance Tab (Loan Officers only) */}
          {activeTab === 'performance' && userType === 'loan_officer' && stats && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Statistics</h3>

              {/* Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiTrendingUp} className="text-blue-600 text-xl" />
                    <div>
                      <p className="text-sm text-blue-600">Total Deals</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalTransactions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiCheck} className="text-green-600 text-xl" />
                    <div>
                      <p className="text-sm text-green-600">Closed Deals</p>
                      <p className="text-2xl font-bold text-green-900">{stats.closedTransactions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiDollarSign} className="text-purple-600 text-xl" />
                    <div>
                      <p className="text-sm text-purple-600">Total Volume</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ${(stats.totalVolume / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiTarget} className="text-yellow-600 text-xl" />
                    <div>
                      <p className="text-sm text-yellow-600">Conversion</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {stats.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Commission Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Commission:</span>
                      <span className="font-medium">${stats.totalCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Year:</span>
                      <span className="font-medium">${stats.yearCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Month:</span>
                      <span className="font-medium">${stats.monthCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg per Deal:</span>
                      <span className="font-medium">
                        ${stats.closedTransactions > 0 ? (stats.totalCommission / stats.closedTransactions).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Deal Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Deal Size:</span>
                      <span className="font-medium">${stats.avgDealSize.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Largest Deal:</span>
                      <span className="font-medium">
                        ${transactions
                          .filter(t => t.loanOfficerId === user.id)
                          .reduce((max, t) => Math.max(max, t.loanAmount), 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pipeline Value:</span>
                      <span className="font-medium">
                        ${transactions
                          .filter(t => t.loanOfficerId === user.id && !['Closed', 'Cancelled'].includes(t.status))
                          .reduce((sum, t) => sum + t.loanAmount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {userType === 'loan_officer' ? 'Loan Officer Profile' : 'Administrator Profile'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(user)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <SafeIcon icon={FiEdit3} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default UserProfileModal;