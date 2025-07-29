import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';

const { 
  FiPlus, FiEdit3, FiTrash2, FiDollarSign, FiTrendingUp, FiClock, FiCheck, 
  FiFilter, FiSearch, FiDownload, FiEye, FiX, FiMaximize2, FiMinimize2, 
  FiMapPin, FiUser, FiHome, FiCalendar, FiFileText, FiPhone, FiMail, 
  FiBuilding, FiCreditCard, FiClipboard, FiAlertCircle, FiCheckCircle, 
  FiInfo, FiUsers
} = FiIcons;

function Dashboard() {
  const navigate = useNavigate();
  const { transactions, loanOfficers, lenders, referralSources, deleteTransaction } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [loanTypeFilter, setLoanTypeFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [loanOfficerFilter, setLoanOfficerFilter] = useState('all');
  const [sortField, setSortField] = useState('applicationDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [viewMode, setViewMode] = useState('comprehensive');
  const [expandedView, setExpandedView] = useState(false);

  // Extract state from property address
  const extractState = (property) => {
    if (!property) return 'Unknown';
    const parts = property.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 1].trim().split(' ')[0];
    }
    return 'Unknown';
  };

  // Filter transactions based on user role and filters
  const filteredTransactions = transactions
    .filter(t => user?.type === 'loan_officer' ? t.loanOfficerId === user.id : true)
    .filter(t => statusFilter === 'all' ? true : t.status === statusFilter)
    .filter(t => stateFilter === 'all' ? true : extractState(t.property) === stateFilter)
    .filter(t => loanTypeFilter === 'all' ? true : t.loanType === loanTypeFilter)
    .filter(t => purposeFilter === 'all' ? true : t.purpose === purposeFilter)
    .filter(t => loanOfficerFilter === 'all' ? true : t.loanOfficerId === parseInt(loanOfficerFilter))
    .filter(t => searchTerm === '' ? true : t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          t.property.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortField === 'closingDate') {
        const dateA = new Date(a.closingDate || '1900-01-01');
        const dateB = new Date(b.closingDate || '1900-01-01');
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'loanAmount') {
        return sortDirection === 'asc' ? a.loanAmount - b.loanAmount : b.loanAmount - a.loanAmount;
      } else if (sortField === 'commissionAmount') {
        return sortDirection === 'asc' ? a.commissionAmount - b.commissionAmount : b.commissionAmount - a.commissionAmount;
      }
      return 0;
    });

  // Group transactions by state
  const transactionsByState = filteredTransactions.reduce((acc, transaction) => {
    const state = extractState(transaction.property);
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(transaction);
    return acc;
  }, {});

  // Get unique values for filters
  const uniqueStates = [...new Set(transactions.map(t => extractState(t.property)))].sort();
  const uniqueLoanTypes = [...new Set(transactions.map(t => t.loanType))].sort();
  const uniquePurposes = [...new Set(transactions.map(t => t.purpose))].sort();

  // Calculate totals for all filtered transactions
  const calculateTotals = (transactions) => {
    const totalLoanAmount = transactions.reduce((sum, t) => sum + t.loanAmount, 0);
    const totalCommission = transactions.filter(t => t.status === 'Closed').reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
    const totalPayouts = transactions.filter(t => t.status === 'Closed').reduce((sum, t) => sum + (t.loFinalPayout || 0), 0);
    const companyProfit = transactions.filter(t => t.status === 'Closed').reduce((sum, t) => sum + (t.companyProfit || 0), 0);
    const avgRate = transactions.filter(t => t.rate).reduce((sum, t, _, arr) => sum + t.rate / arr.length, 0);
    
    return {
      totalLoanAmount,
      totalCommission,
      totalPayouts,
      companyProfit,
      avgRate: avgRate || 0,
      transactionCount: transactions.length
    };
  };

  const overallTotals = calculateTotals(filteredTransactions);

  const handleEdit = (id) => {
    navigate(`/transactions/edit/${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const data = filteredTransactions.map(t => {
      const loanOfficer = loanOfficers.find(lo => lo.id === t.loanOfficerId);
      const referralSource = referralSources.find(rs => rs.id === t.referralSourceId);
      const lender = lenders.find(l => l.id === t.lenderId);
      
      return {
        'State': extractState(t.property),
        'Client Name': t.clientName,
        'Loan Officer': loanOfficer?.name || '',
        'Loan Amount': t.loanAmount,
        'Loan Type': t.loanType,
        'Purpose': t.purpose,
        'Interest Rate': t.rate || '',
        'Commission Rate': t.commissionRate,
        'Total Commission': t.commissionAmount || 0,
        'LO Commission %': t.loCommissionPercentage || 0,
        'LO Final Payout': t.loFinalPayout || 0,
        'Company Profit': t.companyProfit || 0,
        'Status': t.status,
        'Closing Date': t.closingDate || '',
        'Date Paid LO': t.datePaidLO || '',
        'Settlement Company': t.settlementAgent || '',
        'Date We Got Paid': t.dateWePaid || '',
        'Property': t.property,
        'Referral Source': referralSource?.name || '',
        'Lender': lender?.name || '',
        'Realtor': t.realtor || '',
        'Realtor Company': t.realtorCompany || '',
        'Notes': t.notes || ''
      };
    });

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(value => `"${value}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `mortgage_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {user?.type === 'admin' ? 'Overview of all transactions' : 'Your transaction overview'}
          </p>
        </motion.div>

        <div className="flex space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('comprehensive')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'comprehensive' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
              }`}
            >
              By State
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'detailed' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
              }`}
            >
              Cards
            </button>
          </div>
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            title={expandedView ? 'Collapse View' : 'Expand View'}
          >
            <SafeIcon icon={expandedView ? FiMinimize2 : FiMaximize2} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} />
            <span className="hidden sm:inline">Export</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/transactions/new')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
          >
            <SafeIcon icon={FiPlus} />
            <span>New Transaction</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-4"
      >
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="relative w-full md:w-auto">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <SafeIcon icon={FiFilter} className="text-gray-600" />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              <select
                value={loanTypeFilter}
                onChange={(e) => setLoanTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Loan Types</option>
                {uniqueLoanTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Purposes</option>
                {uniquePurposes.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>

              {user?.type === 'admin' && (
                <select
                  value={loanOfficerFilter}
                  onChange={(e) => setLoanOfficerFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Loan Officers</option>
                  {loanOfficers.map(officer => (
                    <option key={officer.id} value={officer.id}>{officer.name}</option>
                  ))}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="Application">Application</option>
                <option value="In Process">In Process</option>
                <option value="Underwriting">Underwriting</option>
                <option value="Approved">Approved</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleSort('closingDate')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                sortField === 'closingDate' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Closing Date {sortField === 'closingDate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('loanAmount')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                sortField === 'loanAmount' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Loan Amount {sortField === 'loanAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('commissionAmount')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                sortField === 'commissionAmount' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Commission {sortField === 'commissionAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Transactions Display */}
      {viewMode === 'table' ? (
        <TableView
          transactions={filteredTransactions}
          user={user}
          loanOfficers={loanOfficers}
          referralSources={referralSources}
          lenders={lenders}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={setSelectedTransaction}
          extractState={extractState}
        />
      ) : viewMode === 'comprehensive' ? (
        <StateBasedView
          transactionsByState={transactionsByState}
          user={user}
          loanOfficers={loanOfficers}
          referralSources={referralSources}
          lenders={lenders}
          onEdit={handleEdit}
          onDelete={handleDelete}
          expandedView={expandedView}
          calculateTotals={calculateTotals}
          overallTotals={overallTotals}
          setSelectedTransaction={setSelectedTransaction}
        />
      ) : (
        <DetailedView
          transactions={filteredTransactions}
          user={user}
          loanOfficers={loanOfficers}
          referralSources={referralSources}
          lenders={lenders}
          onEdit={handleEdit}
          onDelete={handleDelete}
          extractState={extractState}
        />
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          loanOfficers={loanOfficers}
          referralSources={referralSources}
          lenders={lenders}
          onClose={() => setSelectedTransaction(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}

function StateBasedView({ transactionsByState, user, loanOfficers, referralSources, lenders, onEdit, onDelete, expandedView, calculateTotals, overallTotals, setSelectedTransaction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-6"
    >
      {Object.entries(transactionsByState)
        .sort(([stateA, transactionsA], [stateB, transactionsB]) => {
          // Sort by total loan amount (descending)
          const totalsA = calculateTotals(transactionsA);
          const totalsB = calculateTotals(transactionsB);
          return totalsB.totalLoanAmount - totalsA.totalLoanAmount;
        })
        .map(([state, transactions], stateIndex) => {
        const stateTotals = calculateTotals(transactions);
        return (
          <div key={state} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiMapPin} className="text-xl" />
                <h2 className="text-xl font-semibold">{state}</h2>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {transactions.length} transactions
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total Commission</p>
                <p className="text-lg font-bold">${stateTotals.totalCommission.toLocaleString()}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    {user?.type === 'admin' && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loan Officer
                      </th>
                    )}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Amount
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type/Purpose
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission %
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission $
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LO Payout
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Closing Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions
                    .sort((a, b) => {
                      // Sort by closing date (most recent first)
                      const dateA = new Date(a.closingDate || '9999-12-31');
                      const dateB = new Date(b.closingDate || '9999-12-31');
                      return dateA - dateB;
                    })
                    .map((transaction, index) => {
                    const loanOfficer = loanOfficers.find(lo => lo.id === transaction.loanOfficerId);
                    return (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + (stateIndex * 0.1) + (index * 0.02) }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                            {transaction.clientName}
                          </div>
                        </td>
                        {user?.type === 'admin' && (
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 max-w-[100px] truncate">
                            {loanOfficer?.name}
                          </td>
                        )}
                        <td className="px-3 py-4 text-sm text-gray-900 max-w-[150px]">
                          <div className="truncate" title={transaction.property}>
                            {transaction.property}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${transaction.loanAmount.toLocaleString()}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{transaction.loanType}</div>
                          <div className="text-xs text-gray-500">{transaction.purpose}</div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.rate ? `${transaction.rate}%` : 'N/A'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.commissionRate}%
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ${(transaction.commissionAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          ${(transaction.loFinalPayout || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'Closed'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'In Process'
                                ? 'bg-yellow-100 text-yellow-800'
                                : transaction.status === 'Application'
                                ? 'bg-blue-100 text-blue-800'
                                : transaction.status === 'Underwriting'
                                ? 'bg-purple-100 text-purple-800'
                                : transaction.status === 'Approved'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.closingDate ? format(new Date(transaction.closingDate), 'MM/dd/yyyy') : 'N/A'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(transaction.id);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit"
                          >
                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(transaction.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
                {/* State Totals Row */}
                <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                  <tr className="font-semibold text-blue-900">
                    <td className="px-3 py-3" colSpan={user?.type === 'admin' ? 2 : 1}>
                      {state} Totals
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {stateTotals.transactionCount} Transactions
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      ${stateTotals.totalLoanAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {stateTotals.avgRate.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 whitespace-nowrap text-green-700">
                      ${stateTotals.totalCommission.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-blue-700">
                      ${stateTotals.totalPayouts.toLocaleString()}
                    </td>
                    <td className="px-3 py-3" colSpan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}

      {/* Overall Totals Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Overall Totals</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center">
            <p className="text-sm opacity-90">Total Transactions</p>
            <p className="text-2xl font-bold">{overallTotals.transactionCount}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90">Total Loan Amount</p>
            <p className="text-2xl font-bold">${overallTotals.totalLoanAmount.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90">Average Rate</p>
            <p className="text-2xl font-bold">{overallTotals.avgRate.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90">Total Payouts</p>
            <p className="text-2xl font-bold">${overallTotals.totalPayouts.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90">Company Profit</p>
            <p className="text-2xl font-bold">${overallTotals.companyProfit.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TableView({ transactions, user, loanOfficers, referralSources, lenders, onEdit, onDelete, onViewDetails, extractState }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client & State
              </th>
              {user?.type === 'admin' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Officer
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loan Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                LO Payout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={user?.type === 'admin' ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                  No transactions found matching your criteria
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => {
                const loanOfficer = loanOfficers.find(lo => lo.id === transaction.loanOfficerId);
                return (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewDetails(transaction)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.clientName}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {transaction.property}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {extractState(transaction.property)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {transaction.closingDate ? format(new Date(transaction.closingDate), 'MM/dd/yyyy') : 'No closing date'}
                        </div>
                      </div>
                    </td>
                    {user?.type === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loanOfficer?.name}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${transaction.loanAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.loanType} • {transaction.purpose} • {transaction.rate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${(transaction.commissionAmount || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.commissionRate}% rate
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        ${(transaction.loFinalPayout || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.loCommissionPercentage || 0}% + adj.
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'Closed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'In Process'
                            ? 'bg-yellow-100 text-yellow-800'
                            : transaction.status === 'Application'
                            ? 'bg-blue-100 text-blue-800'
                            : transaction.status === 'Underwriting'
                            ? 'bg-purple-100 text-purple-800'
                            : transaction.status === 'Approved'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(transaction.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                      >
                        <SafeIcon icon={FiEdit3} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(transaction.id);
                        }}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function DetailedView({ transactions, user, loanOfficers, referralSources, lenders, onEdit, onDelete, extractState }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-6"
    >
      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
          No transactions found matching your criteria
        </div>
      ) : (
        transactions.map((transaction, index) => {
          const loanOfficer = loanOfficers.find(lo => lo.id === transaction.loanOfficerId);
          const referralSource = referralSources.find(rs => rs.id === transaction.referralSourceId);
          const lender = lenders.find(l => l.id === transaction.lenderId);
          
          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{transaction.clientName}</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {extractState(transaction.property)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{transaction.property}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      transaction.status === 'Closed'
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'In Process'
                        ? 'bg-yellow-100 text-yellow-800'
                        : transaction.status === 'Application'
                        ? 'bg-blue-100 text-blue-800'
                        : transaction.status === 'Underwriting'
                        ? 'bg-purple-100 text-purple-800'
                        : transaction.status === 'Approved'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {transaction.status}
                  </span>
                  <button
                    onClick={() => onEdit(transaction.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Edit"
                  >
                    <SafeIcon icon={FiEdit3} />
                  </button>
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete"
                  >
                    <SafeIcon icon={FiTrash2} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Loan Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Loan Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">${transaction.loanAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span>{transaction.loanType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purpose:</span>
                        <span>{transaction.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rate:</span>
                        <span>{transaction.rate}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Commission Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Commission Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rate:</span>
                        <span>{transaction.commissionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium text-green-600">${(transaction.commissionAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">LO Percentage:</span>
                        <span className="font-medium">{transaction.loCommissionPercentage || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">LO Final Payout:</span>
                        <span className="font-medium text-blue-600">${(transaction.loFinalPayout || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company Profit:</span>
                        <span className="font-medium text-purple-600">${(transaction.companyProfit || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Partners & Timeline */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Partners & Timeline</h4>
                    <div className="space-y-2 text-sm">
                      {user?.type === 'admin' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Loan Officer:</span>
                          <span>{loanOfficer?.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Referral Source:</span>
                        <span>{referralSource?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lender:</span>
                        <span>{lender?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Closing:</span>
                        <span>{transaction.closingDate ? format(new Date(transaction.closingDate), 'MM/dd/yyyy') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Adjustments */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">LO Adjustments</h4>
                    <div className="space-y-2 text-sm">
                      {/* Reimbursements */}
                      {transaction.loReimbursements && transaction.loReimbursements.length > 0 && (
                        <div>
                          <span className="text-green-600 font-medium">Reimbursements:</span>
                          {transaction.loReimbursements.map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-600 ml-2">
                              {item.description}: +${item.amount}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Deductions */}
                      {transaction.loDeductions && transaction.loDeductions.length > 0 && (
                        <div>
                          <span className="text-red-600 font-medium">Deductions:</span>
                          {transaction.loDeductions.map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-600 ml-2">
                              {item.description}: -${item.amount}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                {(transaction.realtor || transaction.realtorCompany || transaction.notes) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(transaction.realtor || transaction.realtorCompany) && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Realtor Information</h4>
                          <div className="text-sm space-y-1">
                            {transaction.realtor && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Realtor:</span>
                                <span>{transaction.realtor}</span>
                              </div>
                            )}
                            {transaction.realtorCompany && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Company:</span>
                                <span>{transaction.realtorCompany}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {transaction.notes && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {transaction.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}

function TransactionDetailModal({ transaction, loanOfficers, referralSources, lenders, onClose, onEdit }) {
  const loanOfficer = loanOfficers.find(lo => lo.id === transaction.loanOfficerId);
  const referralSource = referralSources.find(rs => rs.id === transaction.referralSourceId);
  const lender = lenders.find(l => l.id === transaction.lenderId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold">{transaction.clientName}</h2>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-blue-100">{transaction.property}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                transaction.status === 'Closed' ? 'bg-green-500' :
                transaction.status === 'In Process' ? 'bg-yellow-500' :
                transaction.status === 'Application' ? 'bg-blue-400' :
                transaction.status === 'Underwriting' ? 'bg-purple-500' :
                transaction.status === 'Approved' ? 'bg-indigo-500' : 'bg-gray-500'
              }`}>
                {transaction.status}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onEdit(transaction.id);
                onClose();
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <SafeIcon icon={FiEdit3} />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg"
            >
              <SafeIcon icon={FiX} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Main content grid - Using By State table-like structure */}
          <div className="overflow-x-auto mb-8 bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Officer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type/Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LO Payout</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.clientName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{loanOfficer?.name || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="max-w-[200px] truncate" title={transaction.property}>
                      {transaction.property}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${transaction.loanAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{transaction.loanType}</div>
                    <div className="text-xs text-gray-500">{transaction.purpose}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.rate ? `${transaction.rate}%` : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${(transaction.commissionAmount || 0).toLocaleString()}
                    <div className="text-xs text-gray-500">{transaction.commissionRate}%</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    ${(transaction.loFinalPayout || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'Closed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'Application' ? 'bg-blue-100 text-blue-800' :
                      transaction.status === 'Underwriting' ? 'bg-purple-100 text-purple-800' :
                      transaction.status === 'Approved' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.closingDate ? format(new Date(transaction.closingDate), 'MM/dd/yyyy') : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Client & Property Information */}
              <div className="bg-gray-50 rounded-lg p-6 shadow">
                <div className="flex items-center mb-4">
                  <SafeIcon icon={FiHome} className="text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Client & Property Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Client Name</label>
                    <p className="text-gray-900 font-medium">{transaction.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Property Address</label>
                    <p className="text-gray-900">{transaction.property}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Loan Number</label>
                    <p className="text-gray-900">{transaction.loanNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Interest Rate</label>
                    <p className="text-gray-900">{transaction.rate}%</p>
                  </div>
                </div>
              </div>

              {/* Team & Partners */}
              <div className="bg-gray-50 rounded-lg p-6 shadow">
                <div className="flex items-center mb-4">
                  <SafeIcon icon={FiUsers} className="text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Team & Partners</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Loan Officer:</span>
                    <span className="font-medium">{loanOfficer?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Referral Source:</span>
                    <span className="font-medium">{referralSource?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Lender:</span>
                    <span className="font-medium">{lender?.name || 'N/A'}</span>
                  </div>
                  {transaction.realtor && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Realtor:</span>
                      <span className="font-medium">{transaction.realtor}</span>
                    </div>
                  )}
                  {transaction.realtorCompany && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Realtor Company:</span>
                      <span className="font-medium">{transaction.realtorCompany}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-6 shadow">
                <div className="flex items-center mb-4">
                  <SafeIcon icon={FiCalendar} className="text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Application Date:</span>
                    <span className="font-medium">
                      {transaction.applicationDate ? format(new Date(transaction.applicationDate), 'MM/dd/yyyy') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Closing Date:</span>
                    <span className="font-medium">
                      {transaction.closingDate ? format(new Date(transaction.closingDate), 'MM/dd/yyyy') : 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date Paid LO:</span>
                    <span className="font-medium">
                      {transaction.datePaidLO ? format(new Date(transaction.datePaidLO), 'MM/dd/yyyy') : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {transaction.notes && (
                <div className="bg-gray-50 rounded-lg p-6 shadow">
                  <div className="flex items-center mb-4">
                    <SafeIcon icon={FiFileText} className="text-gray-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{transaction.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Settlement Information */}
              {(transaction.settlementCompany || transaction.settlementPOC) && (
                <div className="bg-gray-50 rounded-lg p-6 shadow">
                  <div className="flex items-center mb-4">
                    <SafeIcon icon={FiBuilding} className="text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Settlement Information</h3>
                  </div>
                  <div className="space-y-3">
                    {transaction.settlementCompany && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Settlement Company:</span>
                        <span className="font-medium">{transaction.settlementCompany}</span>
                      </div>
                    )}
                    {transaction.settlementPOC && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Point of Contact:</span>
                        <span className="font-medium">{transaction.settlementPOC}</span>
                      </div>
                    )}
                    {transaction.settlementEmail && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Email:</span>
                        <a href={`mailto:${transaction.settlementEmail}`} className="text-blue-600 hover:text-blue-800">
                          {transaction.settlementEmail}
                        </a>
                      </div>
                    )}
                    {transaction.settlementPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phone:</span>
                        <a href={`tel:${transaction.settlementPhone}`} className="text-blue-600 hover:text-blue-800">
                          {transaction.settlementPhone}
                        </a>
                      </div>
                    )}
                    {transaction.settlementAmount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount Received:</span>
                        <span className="font-medium text-green-600">${transaction.settlementAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {transaction.settlementDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Date:</span>
                        <span className="font-medium">{format(new Date(transaction.settlementDate), 'MM/dd/yyyy')}</span>
                      </div>
                    )}
                    {transaction.settlementMethod && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {transaction.settlementMethod}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Commission Breakdown */}
              <div className="bg-gray-50 rounded-lg p-6 shadow">
                <div className="flex items-center mb-4">
                  <SafeIcon icon={FiDollarSign} className="text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Commission Breakdown</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Broker Compensation:</span>
                    <span className="font-medium text-green-600">${transaction.brokerCompensation?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">LO Base Commission ({transaction.loCommissionPercentage}%):</span>
                    <span className="font-medium">
                      ${((transaction.brokerCompensation * (transaction.loCommissionPercentage / 100)) || 0).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Reimbursements */}
                  {transaction.loReimbursements && transaction.loReimbursements.length > 0 && (
                    <>
                      <div className="pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-700">Reimbursements:</span>
                      </div>
                      {transaction.loReimbursements.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pl-4">
                          <span className="text-gray-600">{item.description}:</span>
                          <span className="font-medium text-green-600">+${parseFloat(item.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center border-t pt-1 border-gray-200">
                        <span className="text-gray-600">Total Reimbursements:</span>
                        <span className="font-medium text-green-600">
                          +${transaction.loReimbursements.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* Deductions */}
                  {transaction.loDeductions && transaction.loDeductions.length > 0 && (
                    <>
                      <div className="pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-700">Deductions:</span>
                      </div>
                      {transaction.loDeductions.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pl-4">
                          <span className="text-gray-600">{item.description}:</span>
                          <span className="font-medium text-red-600">-${parseFloat(item.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center border-t pt-1 border-gray-200">
                        <span className="text-gray-600">Total Deductions:</span>
                        <span className="font-medium text-red-600">
                          -${transaction.loDeductions.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 font-semibold">LO Final Payout:</span>
                      <span className="font-bold text-blue-600">${transaction.loFinalPayout?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discrepancy Information */}
              {Math.abs(
                (transaction.settlementAmount || 0) - (transaction.brokerCompensation || 0)
              ) > 0.01 && (
                <div className="bg-gray-50 rounded-lg p-6 shadow">
                  <div className="flex items-center mb-4">
                    <SafeIcon 
                      icon={(transaction.settlementAmount || 0) > (transaction.brokerCompensation || 0) ? FiCheckCircle : FiAlertCircle} 
                      className={(transaction.settlementAmount || 0) > (transaction.brokerCompensation || 0) ? 'text-green-600' : 'text-red-600'} 
                      mr-2 
                    />
                    <h3 className="text-lg font-semibold text-gray-900">Payment Discrepancy</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expected Amount:</span>
                      <span className="font-medium">${transaction.brokerCompensation?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount Received:</span>
                      <span className="font-medium">${transaction.settlementAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-gray-600">Discrepancy:</span>
                      <span className={`font-bold ${(transaction.settlementAmount || 0) > (transaction.brokerCompensation || 0) ? 'text-green-600' : 'text-red-600'}`}>
                        {(transaction.settlementAmount || 0) > (transaction.brokerCompensation || 0) ? '+' : ''}
                        ${Math.abs((transaction.settlementAmount || 0) - (transaction.brokerCompensation || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Discrepancy Allocations */}
                  {transaction.discrepancyAllocations && transaction.discrepancyAllocations.length > 0 && (
                    <>
                      <div className="pt-3 mt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-700">Discrepancy Allocations:</span>
                      </div>
                      {transaction.discrepancyAllocations.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pl-4">
                          <span className="text-gray-600">
                            {item.description} ({item.allocationType === 'loan_officer' ? 'LO' : 
                                              item.allocationType === 'company' ? 'Company' : 'Expense'}):
                          </span>
                          <span className="font-medium">
                            ${parseFloat(item.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Audit Checklist */}
              {transaction.auditChecklist && (
                <div className="bg-gray-50 rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <SafeIcon icon={FiClipboard} className="text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Audit Checklist</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Completion</div>
                      <div className="text-xl font-bold text-blue-600">
                        {Math.round(
                          (Object.values(transaction.auditChecklist).filter(Boolean).length / 
                          Object.values(transaction.auditChecklist).length) * 100
                        )}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(transaction.auditChecklist).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <SafeIcon 
                          icon={value ? FiCheckCircle : FiClock} 
                          className={value ? 'text-green-600' : 'text-gray-400'} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Company Profit Summary */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg shadow border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">Final Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total Received</div>
                <div className="text-xl font-bold text-gray-900">
                  ${(transaction.settlementAmount || transaction.brokerCompensation || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">LO Payout</div>
                <div className="text-xl font-bold text-blue-600">
                  ${(transaction.loFinalPayout || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Realtor Partner</div>
                <div className="text-xl font-bold text-purple-600">
                  ${(transaction.realtorPartnerCommission || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Company Profit</div>
                <div className="text-xl font-bold text-green-600">
                  ${(transaction.companyProfit || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEdit(transaction.id);
                onClose();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Edit Transaction
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;