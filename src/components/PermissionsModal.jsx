import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShield, FiX, FiCheck, FiEye, FiEdit3, FiTrash2, FiPlus, FiDownload, FiSettings, FiUsers, FiDollarSign, FiBarChart3 } = FiIcons;

function PermissionsModal({ user, onSave, onClose }) {
  const [permissions, setPermissions] = useState({});
  const [activeCategory, setActiveCategory] = useState('dashboard');

  // Define permission categories and their icons
  const permissionCategories = {
    dashboard: {
      label: 'Dashboard',
      icon: FiBarChart3,
      color: 'blue',
      permissions: {
        view: 'View Dashboard',
        edit: 'Edit Dashboard Settings'
      }
    },
    transactions: {
      label: 'Transactions',
      icon: FiDollarSign,
      color: 'green',
      permissions: {
        view: 'View Transactions',
        edit: 'Edit Transactions',
        delete: 'Delete Transactions',
        create: 'Create Transactions'
      }
    },
    statistics: {
      label: 'Statistics',
      icon: FiBarChart3,
      color: 'purple',
      permissions: {
        view: 'View Statistics',
        export: 'Export Reports'
      }
    },
    lenders: {
      label: 'Lender Directory',
      icon: FiUsers,
      color: 'amber',
      permissions: {
        view: 'View Lenders',
        edit: 'Edit Lenders',
        delete: 'Delete Lenders',
        create: 'Add Lenders'
      }
    },
    goals: {
      label: 'Goals',
      icon: FiShield,
      color: 'teal',
      permissions: {
        view: 'View Goals',
        edit: 'Edit Goals',
        delete: 'Delete Goals',
        create: 'Create Goals'
      }
    },
    contacts: {
      label: 'Contacts',
      icon: FiUsers,
      color: 'rose',
      permissions: {
        view: 'View Contacts',
        edit: 'Edit Contacts',
        delete: 'Delete Contacts',
        create: 'Add Contacts'
      }
    },
    profile: {
      label: 'Profile',
      icon: FiUsers,
      color: 'gray',
      permissions: {
        view: 'View Profile',
        edit: 'Edit Profile'
      }
    },
    payments: {
      label: 'Payments',
      icon: FiDollarSign,
      color: 'green',
      permissions: {
        view: 'View Payments',
        edit: 'Edit Payment Records',
        process: 'Process Payments'
      }
    }
  };

  // Admin-specific permissions
  const adminPermissions = {
    loanOfficers: {
      label: 'Loan Officers',
      icon: FiUsers,
      color: 'indigo',
      permissions: {
        view: 'View Loan Officers',
        edit: 'Edit Loan Officers',
        delete: 'Delete Loan Officers',
        create: 'Add Loan Officers'
      }
    },
    settings: {
      label: 'Settings',
      icon: FiSettings,
      color: 'gray',
      permissions: {
        view: 'View Settings',
        edit: 'Modify Settings'
      }
    },
    reports: {
      label: 'Reports',
      icon: FiDownload,
      color: 'blue',
      permissions: {
        view: 'View Reports',
        export: 'Export Reports',
        schedule: 'Schedule Reports'
      }
    }
  };

  // Combine permissions based on user type
  const allPermissions = user.type === 'admin' 
    ? { ...permissionCategories, ...adminPermissions }
    : permissionCategories;

  useEffect(() => {
    setPermissions(user.data.permissions || {});
  }, [user]);

  const handlePermissionChange = (category, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value
      }
    }));
  };

  const handleCategoryToggle = (category, enabled) => {
    const categoryPerms = allPermissions[category].permissions;
    setPermissions(prev => ({
      ...prev,
      [category]: Object.keys(categoryPerms).reduce((acc, perm) => ({
        ...acc,
        [perm]: enabled
      }), {})
    }));
  };

  const isCategoryFullyEnabled = (category) => {
    const categoryPerms = allPermissions[category].permissions;
    const userCategoryPerms = permissions[category] || {};
    return Object.keys(categoryPerms).every(perm => userCategoryPerms[perm] === true);
  };

  const isCategoryPartiallyEnabled = (category) => {
    const categoryPerms = allPermissions[category].permissions;
    const userCategoryPerms = permissions[category] || {};
    const enabledPerms = Object.keys(categoryPerms).filter(perm => userCategoryPerms[perm] === true);
    return enabledPerms.length > 0 && enabledPerms.length < Object.keys(categoryPerms).length;
  };

  const getPermissionCount = (category) => {
    const categoryPerms = allPermissions[category].permissions;
    const userCategoryPerms = permissions[category] || {};
    const enabledCount = Object.keys(categoryPerms).filter(perm => userCategoryPerms[perm] === true).length;
    return `${enabledCount}/${Object.keys(categoryPerms).length}`;
  };

  const handleSave = () => {
    onSave(permissions);
  };

  const getColorClasses = (color) => ({
    bg: `bg-${color}-100`,
    text: `text-${color}-800`,
    border: `border-${color}-200`,
    ring: `ring-${color}-500`
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiShield} className="text-2xl" />
              <div>
                <h2 className="text-xl font-semibold">Edit Permissions</h2>
                <p className="text-blue-100">
                  {user.data.name} - {user.type === 'admin' ? 'Administrator' : 'Loan Officer'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Categories Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Permission Categories</h3>
              <div className="space-y-1">
                {Object.entries(allPermissions).map(([key, category]) => {
                  const isFullyEnabled = isCategoryFullyEnabled(key);
                  const isPartiallyEnabled = isCategoryPartiallyEnabled(key);
                  const colors = getColorClasses(category.color);
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        activeCategory === key
                          ? `${colors.bg} ${colors.text} ${colors.border} border`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={category.icon} className="text-sm" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">
                          {getPermissionCount(key)}
                        </span>
                        {isFullyEnabled && (
                          <SafeIcon icon={FiCheck} className="text-green-500 text-xs" />
                        )}
                        {isPartiallyEnabled && (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Permissions Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeCategory && allPermissions[activeCategory] && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getColorClasses(allPermissions[activeCategory].color).bg}`}>
                        <SafeIcon 
                          icon={allPermissions[activeCategory].icon} 
                          className={`text-xl ${getColorClasses(allPermissions[activeCategory].color).text}`}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {allPermissions[activeCategory].label}
                        </h3>
                        <p className="text-gray-600">
                          Configure {allPermissions[activeCategory].label.toLowerCase()} permissions
                        </p>
                      </div>
                    </div>
                    
                    {/* Category Toggle */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCategoryToggle(activeCategory, false)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Disable All
                      </button>
                      <button
                        onClick={() => handleCategoryToggle(activeCategory, true)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Enable All
                      </button>
                    </div>
                  </div>

                  {/* Individual Permissions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(allPermissions[activeCategory].permissions).map(([permKey, permLabel]) => {
                      const isEnabled = permissions[activeCategory]?.[permKey] || false;
                      
                      return (
                        <div
                          key={permKey}
                          className={`border rounded-lg p-4 transition-colors ${
                            isEnabled 
                              ? `${getColorClasses(allPermissions[activeCategory].color).bg} ${getColorClasses(allPermissions[activeCategory].color).border} border-2`
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                isEnabled 
                                  ? `${getColorClasses(allPermissions[activeCategory].color).bg}`
                                  : 'bg-gray-100'
                              }`}>
                                <SafeIcon 
                                  icon={getPermissionIcon(permKey)} 
                                  className={`text-sm ${
                                    isEnabled 
                                      ? getColorClasses(allPermissions[activeCategory].color).text
                                      : 'text-gray-500'
                                  }`}
                                />
                              </div>
                              <div>
                                <h4 className={`font-medium ${
                                  isEnabled 
                                    ? getColorClasses(allPermissions[activeCategory].color).text
                                    : 'text-gray-900'
                                }`}>
                                  {permLabel}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {getPermissionDescription(permKey, permLabel)}
                                </p>
                              </div>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => handlePermissionChange(activeCategory, permKey, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className={`w-11 h-6 rounded-full peer transition-colors ${
                                isEnabled 
                                  ? `bg-${allPermissions[activeCategory].color}-500`
                                  : 'bg-gray-200'
                              } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${allPermissions[activeCategory].color}-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Permission Dependencies Warning */}
                  {activeCategory === 'transactions' && permissions.transactions?.delete && !permissions.transactions?.edit && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiShield} className="text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Delete permission typically requires edit permission for security.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {Object.values(permissions).reduce((total, categoryPerms) => 
              total + Object.values(categoryPerms).filter(Boolean).length, 0
            )} permissions enabled
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiCheck} />
              <span>Save Permissions</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function getPermissionIcon(permKey) {
  const iconMap = {
    view: FiEye,
    edit: FiEdit3,
    delete: FiTrash2,
    create: FiPlus,
    export: FiDownload,
    process: FiSettings,
    schedule: FiSettings
  };
  
  return iconMap[permKey] || FiShield;
}

function getPermissionDescription(permKey, permLabel) {
  const descriptions = {
    view: 'Can view and browse content',
    edit: 'Can modify and update existing records',
    delete: 'Can permanently remove records',
    create: 'Can add new records and entries',
    export: 'Can export data and generate reports',
    process: 'Can execute and complete actions',
    schedule: 'Can set up automated tasks'
  };
  
  return descriptions[permKey] || `Allows access to ${permLabel.toLowerCase()}`;
}

export default PermissionsModal;