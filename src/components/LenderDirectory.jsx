import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiBuilding, 
  FiPhone, 
  FiMail, 
  FiGlobe, 
  FiFilter, 
  FiSearch, 
  FiList, 
  FiGrid, 
  FiChevronDown, 
  FiChevronUp,
  FiCheck, 
  FiX,
  FiSliders,
  FiRefreshCw
} = FiIcons;

function LenderDirectory() {
  const navigate = useNavigate();
  const { lenders, addLender, updateLender, deleteLender, transactions } = useData();
  const [showLenderForm, setShowLenderForm] = useState(false);
  const [editingLender, setEditingLender] = useState(null);
  
  // Get stored view preference or default to table
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem('lenderDirectoryViewMode');
    return savedViewMode || 'table'; // Default to table view
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [filters, setFilters] = useState({
    isInArive: 'all', // 'all', 'yes', 'no'
    isVaApproved: 'all', // 'all', 'yes', 'no'
    minBrokerComp: '',
    maxBrokerComp: '',
    loanTypes: []
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    accountExecutive: '',
    contactNumber: '',
    aeEmail: '',
    website: '',
    loanTypes: [],
    brokerCompPercentage: '',
    flatFeeAmount: '',
    isInArive: false,
    isVaApproved: false,
    notes: ''
  });

  // Save view mode preference when it changes
  useEffect(() => {
    localStorage.setItem('lenderDirectoryViewMode', viewMode);
  }, [viewMode]);

  // Format phone number to (111) 111-1111 style
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Strip all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if we have the right length
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    } else if (cleaned.length > 10) {
      // For numbers with country code or extra digits
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    }
    
    // If the number doesn't match the format, return the original
    return phoneNumber;
  };

  // Calculate lender statistics
  const getLenderStats = (lenderId) => {
    const currentYear = new Date().getFullYear();
    const lenderTransactions = transactions.filter(t => t.lenderId === lenderId);
    const currentYearTransactions = lenderTransactions.filter(t => {
      const transactionDate = new Date(t.applicationDate);
      return transactionDate.getFullYear() === currentYear;
    });
    
    const closedTransactions = lenderTransactions.filter(t => t.status === 'Closed');
    return {
      totalTransactions: lenderTransactions.length,
      currentYearTransactions: currentYearTransactions.length,
      closedTransactions: closedTransactions.length,
      totalVolume: lenderTransactions.reduce((sum, t) => sum + t.loanAmount, 0),
      avgLoanAmount: lenderTransactions.length > 0 ? 
        lenderTransactions.reduce((sum, t) => sum + t.loanAmount, 0) / lenderTransactions.length : 0,
      conversionRate: lenderTransactions.length > 0 ? 
        (closedTransactions.length / lenderTransactions.length) * 100 : 0
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format phone number before saving
    const formattedContactNumber = formatPhoneNumber(formData.contactNumber);
    
    const lenderData = {
      ...formData,
      contactNumber: formattedContactNumber,
      brokerCompPercentage: parseFloat(formData.brokerCompPercentage) || 0,
      flatFeeAmount: parseFloat(formData.flatFeeAmount) || 0
    };
    
    if (editingLender) {
      updateLender(editingLender.id, lenderData);
      setEditingLender(null);
    } else {
      addLender(lenderData);
    }
    
    setShowLenderForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      accountExecutive: '',
      contactNumber: '',
      aeEmail: '',
      website: '',
      loanTypes: [],
      brokerCompPercentage: '',
      flatFeeAmount: '',
      isInArive: false,
      isVaApproved: false,
      notes: ''
    });
  };

  const handleEdit = (lender, e) => {
    if (e) e.stopPropagation();
    setEditingLender(lender);
    setFormData({
      ...lender,
      loanTypes: lender.loanTypes || [],
      brokerCompPercentage: lender.brokerCompPercentage?.toString() || '',
      flatFeeAmount: lender.flatFeeAmount?.toString() || '',
      isInArive: lender.isInArive || false,
      isVaApproved: lender.isVaApproved || false
    });
    setShowLenderForm(true);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this lender?')) {
      deleteLender(id);
    }
  };

  const handleViewProfile = (lenderId) => {
    navigate(`/lenders/${lenderId}`);
  };

  const resetFilters = () => {
    setFilters({
      isInArive: 'all',
      isVaApproved: 'all',
      minBrokerComp: '',
      maxBrokerComp: '',
      loanTypes: []
    });
    setSearchTerm('');
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setShowSortOptions(false);
  };

  const filteredLenders = useMemo(() => {
    let results = [...lenders];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(lender => 
        lender.name.toLowerCase().includes(searchLower) ||
        (lender.accountExecutive && lender.accountExecutive.toLowerCase().includes(searchLower)) ||
        (lender.notes && lender.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply ARIVE filter
    if (filters.isInArive !== 'all') {
      results = results.filter(lender => 
        (filters.isInArive === 'yes' ? lender.isInArive : !lender.isInArive)
      );
    }
    
    // Apply VA Approved filter
    if (filters.isVaApproved !== 'all') {
      results = results.filter(lender => 
        (filters.isVaApproved === 'yes' ? lender.isVaApproved : !lender.isVaApproved)
      );
    }
    
    // Apply Broker Comp range filter
    if (filters.minBrokerComp !== '') {
      results = results.filter(lender => 
        lender.brokerCompPercentage >= parseFloat(filters.minBrokerComp)
      );
    }
    
    if (filters.maxBrokerComp !== '') {
      results = results.filter(lender => 
        lender.brokerCompPercentage <= parseFloat(filters.maxBrokerComp)
      );
    }
    
    // Apply loan type filters
    if (filters.loanTypes.length > 0) {
      results = results.filter(lender => 
        filters.loanTypes.some(type => lender.loanTypes?.includes(type))
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      results.sort((a, b) => {
        // For transaction count sorting
        if (sortConfig.key === 'transactions') {
          const statsA = getLenderStats(a.id);
          const statsB = getLenderStats(b.id);
          return sortConfig.direction === 'asc' 
            ? statsA.currentYearTransactions - statsB.currentYearTransactions
            : statsB.currentYearTransactions - statsA.currentYearTransactions;
        }
        
        // For broker comp sorting
        if (sortConfig.key === 'brokerCompPercentage') {
          const valueA = a.brokerCompPercentage || 0;
          const valueB = b.brokerCompPercentage || 0;
          return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // Default string sorting
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return results;
  }, [lenders, searchTerm, filters, sortConfig]);
  
  const loanTypeOptions = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'HELOC', 'Construction'];
  const sortOptions = [
    { key: 'name', label: 'Lender Name' },
    { key: 'brokerCompPercentage', label: 'Broker Comp %' },
    { key: 'transactions', label: 'Transaction Count' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Lender Directory</h1>
          <p className="text-gray-600 mt-1">Manage your lending partners and their information</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLenderForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Lender</span>
        </motion.button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-96">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search lenders by name, AE, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                title="Grid View"
              >
                <SafeIcon icon={FiGrid} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                title="Table View"
              >
                <SafeIcon icon={FiList} />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${showFilters ? 'bg-blue-50 text-blue-500 border-blue-200' : ''}`}
              title="Toggle Filters"
            >
              <SafeIcon icon={FiFilter} className="text-gray-600" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${showSortOptions ? 'bg-blue-50 text-blue-500 border-blue-200' : ''}`}
                title="Sort Options"
              >
                <SafeIcon icon={FiSliders} className="text-gray-600" />
              </button>
              {showSortOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">Sort by</p>
                  </div>
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handleSort(option.key)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      {sortConfig.key === option.key && (
                        <SafeIcon 
                          icon={sortConfig.direction === 'asc' ? FiChevronUp : FiChevronDown} 
                          className="text-blue-500" 
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={resetFilters}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Reset Filters"
            >
              <SafeIcon icon={FiRefreshCw} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-4 rounded-lg space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  In ARIVE
                </label>
                <select
                  value={filters.isInArive}
                  onChange={(e) => setFilters({ ...filters, isInArive: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VA Approved
                </label>
                <select
                  value={filters.isVaApproved}
                  onChange={(e) => setFilters({ ...filters, isVaApproved: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              
              <div className="flex space-x-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Broker Comp %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={filters.minBrokerComp}
                    onChange={(e) => setFilters({ ...filters, minBrokerComp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min %"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Broker Comp %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={filters.maxBrokerComp}
                    onChange={(e) => setFilters({ ...filters, maxBrokerComp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Max %"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Types
              </label>
              <div className="flex flex-wrap gap-2">
                {loanTypeOptions.map(type => (
                  <label key={type} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.loanTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, loanTypes: [...filters.loanTypes, type] });
                        } else {
                          setFilters({ 
                            ...filters, 
                            loanTypes: filters.loanTypes.filter(t => t !== type) 
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        <div className="flex justify-between items-center text-sm">
          <p className="text-gray-600">
            {filteredLenders.length} lenders found
          </p>
          <p className="text-gray-600">
            Sorted by: <span className="font-medium">{
              sortOptions.find(option => option.key === sortConfig.key)?.label || 'Name'
            }</span> ({sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'})
          </p>
        </div>
      </div>

      {filteredLenders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No lenders found matching your criteria</p>
          <button 
            onClick={resetFilters}
            className="text-blue-500 hover:text-blue-700 font-medium flex items-center justify-center mx-auto"
          >
            <SafeIcon icon={FiRefreshCw} className="mr-2" />
            Reset filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLenders.map((lender, index) => {
            const stats = getLenderStats(lender.id);
            return (
              <motion.div
                key={lender.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleViewProfile(lender.id)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{lender.name}</h3>
                    {lender.accountExecutive && (
                      <p className="text-sm text-gray-600">{lender.accountExecutive}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => handleEdit(lender, e)}
                      className="p-1 text-blue-600 hover:text-blue-900"
                      title="Edit Lender"
                    >
                      <SafeIcon icon={FiEdit3} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(lender.id, e)}
                      className="p-1 text-red-600 hover:text-red-900"
                      title="Delete Lender"
                    >
                      <SafeIcon icon={FiTrash2} />
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  {lender.contactNumber && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <SafeIcon icon={FiPhone} className="text-xs" />
                      <span>{lender.contactNumber}</span>
                    </div>
                  )}
                  {lender.aeEmail && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <SafeIcon icon={FiMail} className="text-xs" />
                      <span>{lender.aeEmail}</span>
                    </div>
                  )}
                  {lender.website && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <SafeIcon icon={FiGlobe} className="text-xs" />
                      <a
                        href={lender.website.startsWith('http') ? lender.website : `https://${lender.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lender.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div className="mb-4">
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-1">
                      <SafeIcon 
                        icon={lender.isInArive ? FiCheck : FiX} 
                        className={`text-xs ${lender.isInArive ? 'text-green-600' : 'text-red-600'}`} 
                      />
                      <span className="text-xs text-gray-600">ARIVE</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <SafeIcon 
                        icon={lender.isVaApproved ? FiCheck : FiX} 
                        className={`text-xs ${lender.isVaApproved ? 'text-green-600' : 'text-red-600'}`} 
                      />
                      <span className="text-xs text-gray-600">VA Approved</span>
                    </div>
                  </div>
                </div>

                {/* Compensation Information */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Compensation</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {lender.brokerCompPercentage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Broker Comp:</span>
                        <span className="font-medium">{lender.brokerCompPercentage}%</span>
                      </div>
                    )}
                    {lender.flatFeeAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flat Fee:</span>
                        <span className="font-medium">${lender.flatFeeAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan Types */}
                {lender.loanTypes && lender.loanTypes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Loan Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {lender.loanTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Year:</span>
                      <span className="font-medium">{stats.currentYearTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">All-time:</span>
                      <span className="font-medium">{stats.totalTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium">${(stats.totalVolume / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conv. Rate:</span>
                      <span className="font-medium">{stats.conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {lender.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {lender.notes}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Lender</span>
                      {sortConfig.key === 'name' && (
                        <SafeIcon 
                          icon={sortConfig.direction === 'asc' ? FiChevronUp : FiChevronDown} 
                          className="text-blue-500" 
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('brokerCompPercentage')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Comp %</span>
                      {sortConfig.key === 'brokerCompPercentage' && (
                        <SafeIcon 
                          icon={sortConfig.direction === 'asc' ? FiChevronUp : FiChevronDown} 
                          className="text-blue-500" 
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certifications
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Types
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('transactions')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Transactions</span>
                      {sortConfig.key === 'transactions' && (
                        <SafeIcon 
                          icon={sortConfig.direction === 'asc' ? FiChevronUp : FiChevronDown} 
                          className="text-blue-500" 
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLenders.map((lender, index) => {
                  const stats = getLenderStats(lender.id);
                  return (
                    <motion.tr 
                      key={lender.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewProfile(lender.id)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-1">
                            <div className="font-medium text-gray-900">{lender.name}</div>
                            {lender.accountExecutive && (
                              <div className="text-sm text-gray-500">{lender.accountExecutive}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          {lender.contactNumber && (
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiPhone} className="text-xs text-gray-400" />
                              <span>{lender.contactNumber}</span>
                            </div>
                          )}
                          {lender.aeEmail && (
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiMail} className="text-xs text-gray-400" />
                              <span>{lender.aeEmail}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {lender.brokerCompPercentage > 0 ? `${lender.brokerCompPercentage}%` : 'N/A'}
                        </div>
                        {lender.flatFeeAmount > 0 && (
                          <div className="text-xs text-gray-500">
                            + ${lender.flatFeeAmount.toLocaleString()} flat
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-3">
                          <div className="flex items-center space-x-1">
                            <SafeIcon 
                              icon={lender.isInArive ? FiCheck : FiX} 
                              className={`text-xs ${lender.isInArive ? 'text-green-600' : 'text-red-600'}`} 
                            />
                            <span className="text-xs text-gray-600">ARIVE</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <SafeIcon 
                              icon={lender.isVaApproved ? FiCheck : FiX} 
                              className={`text-xs ${lender.isVaApproved ? 'text-green-600' : 'text-red-600'}`} 
                            />
                            <span className="text-xs text-gray-600">VA</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {lender.loanTypes?.map((type, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{stats.currentYearTransactions} this year</div>
                          <div className="text-xs text-gray-500">{stats.totalTransactions} total</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEdit(lender, e)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Lender"
                        >
                          <SafeIcon icon={FiEdit3} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(lender.id, e)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Lender"
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
        </div>
      )}

      {/* Lender Form Modal */}
      {showLenderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingLender ? 'Edit Lender' : 'Add New Lender'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lender Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Executive
                  </label>
                  <input
                    type="text"
                    value={formData.accountExecutive}
                    onChange={(e) => setFormData({ ...formData, accountExecutive: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AE Email
                  </label>
                  <input
                    type="email"
                    value={formData.aeEmail}
                    onChange={(e) => setFormData({ ...formData, aeEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Loan Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {loanTypeOptions.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.loanTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, loanTypes: [...formData.loanTypes, type] });
                          } else {
                            setFormData({ ...formData, loanTypes: formData.loanTypes.filter(t => t !== type) });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compensation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Broker Comp Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.brokerCompPercentage}
                    onChange={(e) => setFormData({ ...formData, brokerCompPercentage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flat Fee Amount ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.flatFeeAmount}
                    onChange={(e) => setFormData({ ...formData, flatFeeAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isInArive}
                      onChange={(e) => setFormData({ ...formData, isInArive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Is in ARIVE?</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isVaApproved}
                      onChange={(e) => setFormData({ ...formData, isVaApproved: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Is VA Approved?</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional information about this lender..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLenderForm(false);
                    setEditingLender(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingLender ? 'Update Lender' : 'Add Lender'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default LenderDirectory;