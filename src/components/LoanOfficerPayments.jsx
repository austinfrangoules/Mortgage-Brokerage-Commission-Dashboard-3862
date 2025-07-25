import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

const { FiDollarSign, FiTrendingUp, FiCalendar, FiUser, FiDownload, FiEye } = FiIcons;

function LoanOfficerPayments() {
  const navigate = useNavigate();
  const { transactions, loanOfficers } = useData();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedOfficer, setSelectedOfficer] = useState('all');

  // Get available years from transactions
  const availableYears = [...new Set(transactions.map(t => new Date(t.closingDate || t.applicationDate).getFullYear()))].sort().reverse();

  // Filter transactions by year and officer
  const filteredTransactions = transactions.filter(t => {
    const transactionYear = new Date(t.closingDate || t.applicationDate).getFullYear();
    const matchesYear = transactionYear === selectedYear;
    const matchesOfficer = selectedOfficer === 'all' || t.loanOfficerId === parseInt(selectedOfficer);
    return matchesYear && matchesOfficer && t.status === 'Closed';
  });

  // Calculate payment statistics for each loan officer
  const calculateOfficerStats = (officerId, year) => {
    const officerTransactions = transactions.filter(t => 
      t.loanOfficerId === officerId && 
      t.status === 'Closed' &&
      new Date(t.closingDate || t.applicationDate).getFullYear() === year
    );

    const totalCommissionPaid = officerTransactions.reduce((sum, t) => sum + (t.loCommission || 0), 0);
    const totalTransactions = officerTransactions.length;
    const totalVolume = officerTransactions.reduce((sum, t) => sum + t.loanAmount, 0);
    const paymentsMade = officerTransactions.filter(t => t.datePaidLO).length;
    const pendingPayments = totalTransactions - paymentsMade;

    // Calculate monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, month) => {
      const monthTransactions = officerTransactions.filter(t => {
        const date = new Date(t.closingDate || t.applicationDate);
        return date.getMonth() === month;
      });
      
      return {
        month: month + 1,
        monthName: format(new Date(year, month, 1), 'MMM'),
        transactions: monthTransactions.length,
        commission: monthTransactions.reduce((sum, t) => sum + (t.loCommission || 0), 0),
        volume: monthTransactions.reduce((sum, t) => sum + t.loanAmount, 0)
      };
    });

    return {
      totalCommissionPaid,
      totalTransactions,
      totalVolume,
      paymentsMade,
      pendingPayments,
      monthlyBreakdown,
      averageCommissionPerDeal: totalTransactions > 0 ? totalCommissionPaid / totalTransactions : 0
    };
  };

  // Get loan officer payment data
  const officerPaymentData = loanOfficers.map(officer => {
    const stats = calculateOfficerStats(officer.id, selectedYear);
    return {
      ...officer,
      ...stats
    };
  }).filter(officer => officer.totalTransactions > 0);

  // Calculate overall totals
  const overallTotals = {
    totalCommissionPaid: officerPaymentData.reduce((sum, officer) => sum + officer.totalCommissionPaid, 0),
    totalTransactions: officerPaymentData.reduce((sum, officer) => sum + officer.totalTransactions, 0),
    totalVolume: officerPaymentData.reduce((sum, officer) => sum + officer.totalVolume, 0),
    totalPaymentsMade: officerPaymentData.reduce((sum, officer) => sum + officer.paymentsMade, 0),
    totalPendingPayments: officerPaymentData.reduce((sum, officer) => sum + officer.pendingPayments, 0)
  };

  const exportPaymentData = () => {
    const data = officerPaymentData.map(officer => ({
      'Loan Officer': officer.name,
      'Email': officer.email,
      'Total Transactions': officer.totalTransactions,
      'Total Volume': officer.totalVolume,
      'Total Commission Paid': officer.totalCommissionPaid,
      'Payments Made': officer.paymentsMade,
      'Pending Payments': officer.pendingPayments,
      'Average Commission Per Deal': officer.averageCommissionPerDeal,
      'Year': selectedYear
    }));

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(value => `"${value}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `loan_officer_payments_${selectedYear}.csv`);
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
          <h1 className="text-3xl font-bold text-gray-900">Loan Officer Payments</h1>
          <p className="text-gray-600 mt-1">Track commission payments and performance</p>
        </motion.div>
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
          <select
            value={selectedOfficer}
            onChange={(e) => setSelectedOfficer(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Loan Officers</option>
            {loanOfficers.map(officer => (
              <option key={officer.id} value={officer.id}>{officer.name}</option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportPaymentData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} />
            <span>Export</span>
          </motion.button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Commission Paid"
          value={`$${overallTotals.totalCommissionPaid.toLocaleString()}`}
          icon={FiDollarSign}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="Total Transactions"
          value={overallTotals.totalTransactions}
          icon={FiTrendingUp}
          color="blue"
          delay={0.2}
        />
        <StatCard
          title="Total Volume"
          value={`$${(overallTotals.totalVolume / 1000000).toFixed(1)}M`}
          icon={FiCalendar}
          color="purple"
          delay={0.3}
        />
        <StatCard
          title="Payments Made"
          value={overallTotals.totalPaymentsMade}
          icon={FiUser}
          color="green"
          delay={0.4}
        />
        <StatCard
          title="Pending Payments"
          value={overallTotals.totalPendingPayments}
          icon={FiUser}
          color="yellow"
          delay={0.5}
        />
      </div>

      {/* Loan Officer Payment Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Payment Summary by Loan Officer</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Officer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Per Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payments Made
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officerPaymentData.map((officer, index) => (
                <motion.tr
                  key={officer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {officer.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                        <div className="text-sm text-gray-500">{officer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {officer.totalTransactions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(officer.totalVolume / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${officer.totalCommissionPaid.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Math.round(officer.averageCommissionPerDeal).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {officer.paymentsMade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      officer.pendingPayments > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {officer.pendingPayments}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/loan-officer/${officer.id}`)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View Details"
                    >
                      <SafeIcon icon={FiEye} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Monthly Breakdown Chart */}
      {selectedOfficer !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Breakdown - {loanOfficers.find(o => o.id === parseInt(selectedOfficer))?.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {officerPaymentData.find(o => o.id === parseInt(selectedOfficer))?.monthlyBreakdown.map(month => (
              <div key={month.month} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{month.monthName}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deals:</span>
                    <span className="font-medium">{month.transactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-medium text-green-600">${month.commission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium">${(month.volume / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
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

export default LoanOfficerPayments;