import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import UserProfileModal from './UserProfileModal';
import PermissionsModal from './PermissionsModal';
import UserFormModal from './UserFormModal';
import { format } from 'date-fns';

const { 
  FiPlus, FiEdit3, FiTrash2, FiUser, FiPhone, FiMail, FiMapPin, 
  FiAward, FiTrendingUp, FiDollarSign, FiEye, FiSettings, FiShield, 
  FiUsers, FiUserCheck, FiSearch, FiFilter, FiRefreshCw, FiGrid, 
  FiList, FiStar, FiCalendar, FiBriefcase, FiCheckCircle, FiAlertCircle,
  FiClock, FiTarget, FiBarChart
} = FiIcons;

function UserManagement() {
  const { 
    loanOfficers, 
    adminUsers, 
    transactions, 
    addLoanOfficer, 
    updateLoanOfficer, 
    deleteLoanOfficer,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser
  } = useData();
  const { user } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('loan_officers');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [licenseStateFilter, setLicenseStateFilter] = useState('all');

  // Modal states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userType, setUserType] = useState('loan_officer');

  // Calculate user statistics
  const calculateUserStats = (userId, type) => {
    if (type !== 'loan_officer') return null;

    const userTransactions = transactions.filter(t => t.loanOfficerId === userId);
    const closedTransactions = userTransactions.filter(t => t.status === 'Closed');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const yearTransactions = userTransactions.filter(t => 
      new Date(t.applicationDate).getFullYear() === currentYear
    );
    
    const monthTransactions = userTransactions.filter(t => {
      const date = new Date(t.applicationDate);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    return {
      totalTransactions: userTransactions.length,
      closedTransactions: closedTransactions.length,
      totalVolume: userTransactions.reduce((sum, t) => sum + t.loanAmount, 0),
      totalCommission: closedTransactions.reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0),
      yearTransactions: yearTransactions.length,
      monthTransactions: monthTransactions.length,
      conversionRate: userTransactions.length > 0 ? (closedTransactions.length / userTransactions.length) * 100 : 0,
      avgDealSize: userTransactions.length > 0 ? userTransactions.reduce((sum, t) => sum + t.loanAmount, 0) / userTransactions.length : 0
    };
  };

  // Filter and sort users
  const getFilteredUsers = () => {
    const users = activeTab === 'loan_officers' ? loanOfficers : adminUsers;
    
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive !== false) ||
        (statusFilter === 'inactive' && user.isActive === false);

      const matchesDepartment = departmentFilter === 'all' || 
        user.department === departmentFilter;

      const matchesLicenseState = licenseStateFilter === 'all' || 
        (user.licenseStates && user.licenseStates.includes(licenseStateFilter));

      return matchesSearch && matchesStatus && matchesDepartment && matchesLicenseState;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'hireDate':
          aValue = new Date(a.hireDate || '1970-01-01');
          bValue = new Date(b.hireDate || '1970-01-01');
          break;
        case 'performance':
          if (activeTab === 'loan_officers') {
            const statsA = calculateUserStats(a.id, 'loan_officer');
            const statsB = calculateUserStats(b.id, 'loan_officer');
            aValue = statsA?.totalCommission || 0;
            bValue = statsB?.totalCommission || 0;
          } else {
            aValue = a.name;
            bValue = b.name;
          }
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    const users = activeTab === 'loan_officers' ? loanOfficers : adminUsers;
    const values = [...new Set(users.map(user => user[field]).filter(Boolean))];
    return values.sort();
  };

  const getUniqueLicenseStates = () => {
    const states = [...new Set(
      loanOfficers
        .flatMap(user => user.licenseStates || [])
        .filter(Boolean)
    )];
    return states.sort();
  };

  // Event handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setUserType(activeTab === 'loan_officers' ? 'loan_officer' : 'admin');
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserType(activeTab === 'loan_officers' ? 'loan_officer' : 'admin');
    setShowUserForm(true);
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    if (activeTab === 'loan_officers') {
      deleteLoanOfficer(userId);
    } else {
      deleteAdminUser(userId);
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser({ data: user, type: activeTab === 'loan_officers' ? 'loan_officer' : 'admin' });
    setShowProfileModal(true);
  };

  const handleEditPermissions = (user) => {
    setSelectedUser({ data: user, type: activeTab === 'loan_officers' ? 'loan_officer' : 'admin' });
    setShowPermissionsModal(true);
  };

  const handlePermissionsSave = (updatedPermissions) => {
    if (selectedUser.type === 'loan_officer') {
      updateLoanOfficer(selectedUser.data.id, { ...selectedUser.data, permissions: updatedPermissions });
    } else {
      updateAdminUser(selectedUser.data.id, { ...selectedUser.data, permissions: updatedPermissions });
    }
    setShowPermissionsModal(false);
    setSelectedUser(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setLicenseStateFilter('all');
    setSortBy('name');
    setSortDirection('asc');
  };

  const getPermissionsSummary = (permissions) => {
    if (!permissions) return '0/0';
    const totalPermissions = Object.keys(permissions).length;
    const activePermissions = Object.values(permissions).filter(perm => 
      Object.values(perm).some(value => value === true)
    ).length;
    return `${activePermissions}/${totalPermissions}`;
  };

  const filteredUsers = getFilteredUsers();

  const tabs = [
    { 
      id: 'loan_officers', 
      label: 'Loan Officers', 
      icon: FiUsers, 
      count: loanOfficers.length 
    },
    { 
      id: 'admins', 
      label: 'Administrators', 
      icon: FiShield, 
      count: adminUsers.length 
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage team members, roles, and permissions</p>
        </motion.div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddUser}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add {activeTab === 'loan_officers' ? 'Loan Officer' : 'Admin'}</span>
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SafeIcon icon={tab.icon} className="mr-2" />
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex items-center space-x-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-96">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <SafeIcon icon={FiGrid} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <SafeIcon icon={FiList} />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-100 ${
                  showFilters ? 'bg-blue-50 text-blue-500 border-blue-200' : ''
                }`}
              >
                <SafeIcon icon={FiFilter} />
              </button>
              <button
                onClick={resetFilters}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                title="Reset Filters"
              >
                <SafeIcon icon={FiRefreshCw} />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {activeTab === 'admins' && (
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {getUniqueValues('department').map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                )}

                {activeTab === 'loan_officers' && (
                  <select
                    value={licenseStateFilter}
                    onChange={(e) => setLicenseStateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All States</option>
                    {getUniqueLicenseStates().map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                )}

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                  <option value="hireDate">Sort by Hire Date</option>
                  {activeTab === 'loan_officers' && (
                    <option value="performance">Sort by Performance</option>
                  )}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User List/Grid */}
        <div className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <SafeIcon icon={FiUsers} className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  userType={activeTab === 'loan_officers' ? 'loan_officer' : 'admin'}
                  stats={activeTab === 'loan_officers' ? calculateUserStats(user.id, 'loan_officer') : null}
                  index={index}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onViewProfile={handleViewProfile}
                  onEditPermissions={handleEditPermissions}
                  getPermissionsSummary={getPermissionsSummary}
                />
              ))}
            </div>
          ) : (
            <UserTable
              users={filteredUsers}
              userType={activeTab === 'loan_officers' ? 'loan_officer' : 'admin'}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onViewProfile={handleViewProfile}
              onEditPermissions={handleEditPermissions}
              calculateUserStats={calculateUserStats}
              getPermissionsSummary={getPermissionsSummary}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserForm && (
        <UserFormModal
          user={editingUser}
          userType={userType}
          onSave={(userData) => {
            if (editingUser) {
              if (userType === 'loan_officer') {
                updateLoanOfficer(editingUser.id, userData);
              } else {
                updateAdminUser(editingUser.id, userData);
              }
            } else {
              if (userType === 'loan_officer') {
                addLoanOfficer(userData);
              } else {
                addAdminUser(userData);
              }
            }
            setShowUserForm(false);
            setEditingUser(null);
          }}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {showPermissionsModal && selectedUser && (
        <PermissionsModal
          user={selectedUser}
          onSave={handlePermissionsSave}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showProfileModal && selectedUser && (
        <UserProfileModal
          user={selectedUser.data}
          userType={selectedUser.type}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUser(null);
          }}
          onEdit={(userData) => {
            setEditingUser(userData);
            setUserType(selectedUser.type);
            setShowProfileModal(false);
            setSelectedUser(null);
            setShowUserForm(true);
          }}
          onEditPermissions={(userType, userData) => {
            setSelectedUser({ data: userData, type: userType });
            setShowProfileModal(false);
            setShowPermissionsModal(true);
          }}
        />
      )}
    </div>
  );
}

// User Card Component
function UserCard({ 
  user, 
  userType, 
  stats, 
  index, 
  onEdit, 
  onDelete, 
  onViewProfile, 
  onEditPermissions, 
  getPermissionsSummary 
}) {
  const isLoanOfficer = userType === 'loan_officer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer"
      onClick={() => onViewProfile(user)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
            isLoanOfficer ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-purple-500 to-pink-600'
          }`}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-600">
              {isLoanOfficer ? 'Loan Officer' : user.role?.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEditPermissions(user)}
            className="p-1 text-green-600 hover:text-green-900"
            title="Edit Permissions"
          >
            <SafeIcon icon={FiShield} />
          </button>
          <button
            onClick={() => onEdit(user)}
            className="p-1 text-blue-600 hover:text-blue-900"
            title="Edit User"
          >
            <SafeIcon icon={FiEdit3} />
          </button>
          <button
            onClick={() => onDelete(user.id)}
            className="p-1 text-red-600 hover:text-red-900"
            title="Delete User"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        {user.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <SafeIcon icon={FiMail} className="text-xs" />
            <span>{user.email}</span>
          </div>
        )}
        {user.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <SafeIcon icon={FiPhone} className="text-xs" />
            <span>{user.phone}</span>
          </div>
        )}
        {isLoanOfficer && user.nmlsNumber && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <SafeIcon icon={FiAward} className="text-xs" />
            <span>NMLS: {user.nmlsNumber}</span>
          </div>
        )}
        {!isLoanOfficer && user.department && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <SafeIcon icon={FiBriefcase} className="text-xs" />
            <span>{user.department}</span>
          </div>
        )}
      </div>

      {/* License States (Loan Officers) */}
      {isLoanOfficer && user.licenseStates && user.licenseStates.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <SafeIcon icon={FiMapPin} className="text-xs" />
            <span>Licensed in:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {user.licenseStates.slice(0, 4).map(state => (
              <span key={state} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {state}
              </span>
            ))}
            {user.licenseStates.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{user.licenseStates.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Permissions Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Permissions</span>
          <span className="text-xs text-blue-600 font-medium">
            {getPermissionsSummary(user.permissions || {})}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(user.permissions || {}).slice(0, 3).map(([key, perms]) => (
            <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
              {key}
            </span>
          ))}
          {Object.keys(user.permissions || {}).length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{Object.keys(user.permissions || {}).length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Performance Stats (Loan Officers) */}
      {isLoanOfficer && stats && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Deals:</span>
              <span className="font-medium">{stats.totalTransactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Closed:</span>
              <span className="font-medium">{stats.closedTransactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume:</span>
              <span className="font-medium">${(stats.totalVolume / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commission:</span>
              <span className="font-medium">${(stats.totalCommission / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      )}

      {/* Hire Date */}
      {user.hireDate && (
        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          Hired: {format(new Date(user.hireDate), 'MMM d, yyyy')}
        </div>
      )}
    </motion.div>
  );
}

// User Table Component
function UserTable({ 
  users, 
  userType, 
  onEdit, 
  onDelete, 
  onViewProfile, 
  onEditPermissions, 
  calculateUserStats, 
  getPermissionsSummary 
}) {
  const isLoanOfficer = userType === 'loan_officer';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            {isLoanOfficer && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Licenses
              </th>
            )}
            {!isLoanOfficer && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role & Department
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Permissions
            </th>
            {isLoanOfficer && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user, index) => {
            const stats = isLoanOfficer ? calculateUserStats(user.id, 'loan_officer') : null;
            
            return (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewProfile(user)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      isLoanOfficer ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-purple-500 to-pink-600'
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">
                        {isLoanOfficer ? 'Loan Officer' : user.role?.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div>{user.email || 'No email'}</div>
                    <div className="text-gray-500">{user.phone || 'No phone'}</div>
                  </div>
                </td>

                {isLoanOfficer && (
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.nmlsNumber && (
                        <div className="font-medium">NMLS: {user.nmlsNumber}</div>
                      )}
                      {user.licenseStates && user.licenseStates.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.licenseStates.slice(0, 3).map(state => (
                            <span key={state} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {state}
                            </span>
                          ))}
                          {user.licenseStates.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{user.licenseStates.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}

                {!isLoanOfficer && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium capitalize">{user.role?.replace('_', ' ')}</div>
                      {user.department && (
                        <div className="text-gray-500">{user.department}</div>
                      )}
                    </div>
                  </td>
                )}

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">{getPermissionsSummary(user.permissions || {})}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.keys(user.permissions || {}).slice(0, 2).map(key => (
                        <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>

                {isLoanOfficer && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {stats && (
                        <>
                          <div className="font-medium">{stats.totalTransactions} deals</div>
                          <div className="text-gray-500">${(stats.totalVolume / 1000000).toFixed(1)}M volume</div>
                        </>
                      )}
                    </div>
                  </td>
                )}

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditPermissions(user)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Edit Permissions"
                  >
                    <SafeIcon icon={FiShield} />
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Edit User"
                  >
                    <SafeIcon icon={FiEdit3} />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete User"
                  >
                    <SafeIcon icon={FiTrash2} />
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;