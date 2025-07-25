import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

const {
  FiArrowLeft,
  FiBuilding,
  FiPhone,
  FiMail,
  FiGlobe,
  FiCheck,
  FiX,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiFileText,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit3
} = FiIcons;

function LenderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lenders, transactions, loanOfficers, updateLender } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTransactionDetails, setShowTransactionDetails] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const lender = lenders.find(l => l.id === parseInt(id));

  if (!lender) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Lender not found</p>
        <button
          onClick={() => navigate('/lenders')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Lender Directory
        </button>
      </div>
    );
  }

  // Get all transactions for this lender
  const lenderTransactions = transactions.filter(t => t.lenderId === parseInt(id));

  // Get available years from transactions
  const availableYears = [...new Set(lenderTransactions.map(t => {
    const date = t.closingDate || t.applicationDate;
    return new Date(date).getFullYear();
  }))].sort().reverse();

  // Filter transactions by year and status
  const filteredTransactions = lenderTransactions.filter(t => {
    const transactionDate = new Date(t.closingDate || t.applicationDate);
    const matchesYear = transactionDate.getFullYear() === selectedYear;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesYear && matchesStatus;
  });

  // Extract state from property address
  const extractState = (property) => {
    if (!property) return 'Unknown';
    const parts = property.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 1].trim().split(' ')[0];
    }
    return 'Unknown';
  };

  // Calculate lender statistics for selected year
  const calculateYearStats = (year) => {
    const yearTransactions = lenderTransactions.filter(t => {
      const transactionDate = new Date(t.closingDate || t.applicationDate);
      return transactionDate.getFullYear() === year;
    });

    const closedTransactions = yearTransactions.filter(t => t.status === 'Closed');
    const totalVolume = yearTransactions.reduce((sum, t) => sum + t.loanAmount, 0);
    const totalCommission = closedTransactions.reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0);

    // Group by state
    const stateBreakdown = {};
    yearTransactions.forEach(t => {
      const state = extractState(t.property);
      if (!stateBreakdown[state]) {
        stateBreakdown[state] = {
          count: 0,
          volume: 0,
          commission: 0,
          addresses: []
        };
      }
      stateBreakdown[state].count += 1;
      stateBreakdown[state].volume += t.loanAmount;
      if (t.status === 'Closed') {
        stateBreakdown[state].commission += (t.loanAmount * t.commissionRate / 100);
      }
      stateBreakdown[state].addresses.push({
        property: t.property,
        clientName: t.clientName,
        loanAmount: t.loanAmount,
        status: t.status,
        closingDate: t.closingDate
      });
    });

    // Group by loan officer
    const loanOfficerBreakdown = {};
    yearTransactions.forEach(t => {
      const officer = loanOfficers.find(lo => lo.id === t.loanOfficerId);
      const officerName = officer ? officer.name : 'Unknown';
      if (!loanOfficerBreakdown[officerName]) {
        loanOfficerBreakdown[officerName] = {
          count: 0,
          volume: 0,
          commission: 0
        };
      }
      loanOfficerBreakdown[officerName].count += 1;
      loanOfficerBreakdown[officerName].volume += t.loanAmount;
      if (t.status === 'Closed') {
        loanOfficerBreakdown[officerName].commission += (t.loanAmount * t.commissionRate / 100);
      }
    });

    // Loan type breakdown
    const loanTypeBreakdown = {};
    yearTransactions.forEach(t => {
      if (!loanTypeBreakdown[t.loanType]) {
        loanTypeBreakdown[t.loanType] = {
          count: 0,
          volume: 0,
          commission: 0
        };
      }
      loanTypeBreakdown[t.loanType].count += 1;
      loanTypeBreakdown[t.loanType].volume += t.loanAmount;
      if (t.status === 'Closed') {
        loanTypeBreakdown[t.loanType].commission += (t.loanAmount * t.commissionRate / 100);
      }
    });

    return {
      totalTransactions: yearTransactions.length,
      closedTransactions: closedTransactions.length,
      totalVolume,
      totalCommission,
      averageLoanAmount: yearTransactions.length > 0 ? totalVolume / yearTransactions.length : 0,
      conversionRate: yearTransactions.length > 0 ? (closedTransactions.length / yearTransactions.length) * 100 : 0,
      stateBreakdown,
      loanOfficerBreakdown,
      loanTypeBreakdown
    };
  };

  const yearStats = calculateYearStats(selectedYear);

  // Initialize edit form data
  const initializeEditForm = () => {
    setEditFormData({
      name: lender.name || '',
      accountExecutive: lender.accountExecutive || '',
      contactNumber: lender.contactNumber || '',
      aeEmail: lender.aeEmail || '',
      website: lender.website || '',
      loanTypes: lender.loanTypes || [],
      brokerCompPercentage: lender.brokerCompPercentage?.toString() || '',
      flatFeeAmount: lender.flatFeeAmount?.toString() || '',
      isInArive: lender.isInArive || false,
      isVaApproved: lender.isVaApproved || false,
      notes: lender.notes || ''
    });
  };

  // Handle edit form submission
  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedLender = {
      ...editFormData,
      brokerCompPercentage: parseFloat(editFormData.brokerCompPercentage) || 0,
      flatFeeAmount: parseFloat(editFormData.flatFeeAmount) || 0
    };
    updateLender(parseInt(id), updatedLender);
    setShowEditForm(false);
  };

  // Export transaction data
  const exportTransactionData = () => {
    const data = filteredTransactions.map(t => {
      const loanOfficer = loanOfficers.find(lo => lo.id === t.loanOfficerId);
      return {
        'Client Name': t.clientName,
        'Loan Officer': loanOfficer?.name || 'Unknown',
        'Property Address': t.property,
        'State': extractState(t.property),
        'Loan Amount': t.loanAmount,
        'Loan Type': t.loanType,
        'Purpose': t.purpose,
        'Interest Rate': t.rate || 'N/A',
        'Commission Rate': t.commissionRate,
        'Commission Amount': (t.loanAmount * t.commissionRate / 100),
        'Status': t.status,
        'Application Date': t.applicationDate,
        'Closing Date': t.closingDate || 'N/A',
        'Notes': t.notes || ''
      };
    });

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${lender.name.replace(/\s+/g, '_')}_transactions_${selectedYear}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const loanTypeOptions = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'HELOC', 'Construction'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/lenders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="text-gray-600" />
          </button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">{lender.name}</h1>
            <p className="text-gray-600 mt-1">Lender Profile & Performance</p>
          </motion.div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => {
              initializeEditForm();
              setShowEditForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <SafeIcon icon={FiEdit3} />
            <span>Edit</span>
          </button>
          <button
            onClick={exportTransactionData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Lender Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <SafeIcon icon={FiBuilding} className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{lender.name}</h2>
              {lender.accountExecutive && (
                <div className="flex items-center space-x-2 mt-1">
                  <SafeIcon icon={FiUser} className="text-blue-600 text-sm" />
                  <p className="text-lg text-gray-700">
                    <span className="font-medium">Account Executive:</span> {lender.accountExecutive}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <SafeIcon 
                  icon={lender.isInArive ? FiCheck : FiX} 
                  className={`text-sm ${lender.isInArive ? 'text-green-600' : 'text-red-600'}`} 
                />
                <span className="text-sm text-gray-600">ARIVE</span>
              </div>
              <div className="flex items-center space-x-1">
                <SafeIcon 
                  icon={lender.isVaApproved ? FiCheck : FiX} 
                  className={`text-sm ${lender.isVaApproved ? 'text-green-600' : 'text-red-600'}`} 
                />
                <span className="text-sm text-gray-600">VA Approved</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2">
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
                  >
                    {lender.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Loan Types */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Loan Types</h3>
            <div className="flex flex-wrap gap-1">
              {lender.loanTypes?.map((type, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Compensation */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Compensation</h3>
            <div className="space-y-1 text-sm">
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

          {/* Notes */}
          {lender.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {lender.notes}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Performance Stats for Selected Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value={yearStats.totalTransactions}
          icon={FiTrendingUp}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Closed Deals"
          value={yearStats.closedTransactions}
          icon={FiCheck}
          color="green"
          delay={0.2}
        />
        <StatCard
          title="Total Volume"
          value={`$${(yearStats.totalVolume / 1000000).toFixed(1)}M`}
          icon={FiDollarSign}
          color="purple"
          delay={0.3}
        />
        <StatCard
          title="Conversion Rate"
          value={`${yearStats.conversionRate.toFixed(1)}%`}
          icon={FiCalendar}
          color="yellow"
          delay={0.4}
        />
      </div>

      {/* Breakdown Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* State Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance by State ({selectedYear})
          </h3>
          <div className="space-y-4">
            {Object.entries(yearStats.stateBreakdown)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([state, data]) => (
                <div key={state} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiMapPin} className="text-blue-600" />
                      <h4 className="font-medium text-gray-900">{state}</h4>
                    </div>
                    <span className="text-sm text-gray-500">{data.count} transactions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Volume:</span>
                      <span className="ml-2 font-medium">${(data.volume / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Commission:</span>
                      <span className="ml-2 font-medium text-green-600">${data.commission.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setShowTransactionDetails(showTransactionDetails === state ? null : state)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <SafeIcon icon={FiEye} />
                      <span>{showTransactionDetails === state ? 'Hide' : 'Show'} Addresses</span>
                    </button>
                    {showTransactionDetails === state && (
                      <div className="mt-3 space-y-2">
                        {data.addresses.map((addr, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                            <div className="font-medium">{addr.property}</div>
                            <div className="text-gray-600">
                              {addr.clientName} • ${addr.loanAmount.toLocaleString()} • {addr.status}
                              {addr.closingDate && ` • Closed: ${format(new Date(addr.closingDate), 'MM/dd/yyyy')}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Loan Officer Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance by Loan Officer ({selectedYear})
          </h3>
          <div className="space-y-3">
            {Object.entries(yearStats.loanOfficerBreakdown)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([officer, data]) => (
                <div key={officer} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {officer.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{officer}</div>
                      <div className="text-sm text-gray-600">{data.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">${(data.volume / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-green-600">${data.commission.toLocaleString()}</div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Loan Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance by Loan Type ({selectedYear})
          </h3>
          <div className="space-y-3">
            {Object.entries(yearStats.loanTypeBreakdown)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([loanType, data]) => (
                <div key={loanType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{loanType}</div>
                    <div className="text-sm text-gray-600">{data.count} transactions</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">${(data.volume / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-green-600">${data.commission.toLocaleString()}</div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Transaction History ({selectedYear})
            </h3>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Application">Application</option>
                <option value="In Process">In Process</option>
                <option value="Underwriting">Underwriting</option>
                <option value="Approved">Approved</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <span className="text-sm text-gray-600">
                {filteredTransactions.length} transactions
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client & Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Officer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No transactions found for {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const loanOfficer = loanOfficers.find(lo => lo.id === transaction.loanOfficerId);
                  return (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 + index * 0.02 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{transaction.clientName}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate" title={transaction.property}>
                            {transaction.property}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {extractState(transaction.property)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-900">
                        {loanOfficer?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            ${transaction.loanAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.loanType} • {transaction.purpose}
                          </div>
                          {transaction.rate && (
                            <div className="text-xs text-gray-500">
                              {transaction.rate}% rate
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-green-600">
                            ${(transaction.loanAmount * transaction.commissionRate / 100).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.commissionRate}% rate
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'Closed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                          transaction.status === 'Application' ? 'bg-blue-100 text-blue-800' :
                          transaction.status === 'Underwriting' ? 'bg-purple-100 text-purple-800' :
                          transaction.status === 'Approved' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        <div>App: {format(new Date(transaction.applicationDate), 'MM/dd/yyyy')}</div>
                        {transaction.closingDate && (
                          <div>Close: {format(new Date(transaction.closingDate), 'MM/dd/yyyy')}</div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Lender Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Lender</h2>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lender Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                    value={editFormData.accountExecutive}
                    onChange={(e) => setEditFormData({ ...editFormData, accountExecutive: e.target.value })}
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
                    value={editFormData.contactNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AE Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.aeEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, aeEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editFormData.website}
                    onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
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
                        checked={editFormData.loanTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditFormData({ ...editFormData, loanTypes: [...editFormData.loanTypes, type] });
                          } else {
                            setEditFormData({ ...editFormData, loanTypes: editFormData.loanTypes.filter(t => t !== type) });
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
                    value={editFormData.brokerCompPercentage}
                    onChange={(e) => setEditFormData({ ...editFormData, brokerCompPercentage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    value={editFormData.flatFeeAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, flatFeeAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      checked={editFormData.isInArive}
                      onChange={(e) => setEditFormData({ ...editFormData, isInArive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Is in ARIVE?</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.isVaApproved}
                      onChange={(e) => setEditFormData({ ...editFormData, isVaApproved: e.target.checked })}
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
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Lender
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, delay }) {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    yellow: 'from-yellow-500 to-orange-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]}`}>
          <SafeIcon icon={icon} className="text-white text-xl" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default LenderProfile;