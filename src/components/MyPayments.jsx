import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

const { FiDollarSign, FiTrendingUp, FiCalendar, FiDownload, FiEye, FiClock, FiCheckCircle } = FiIcons;

function MyPayments() {
  const { transactions } = useData();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter transactions for current loan officer
  const myTransactions = transactions.filter(t => t.loanOfficerId === user.id);

  // Get available years from transactions
  const availableYears = [...new Set(myTransactions.map(t => 
    new Date(t.closingDate || t.applicationDate).getFullYear()
  ))].sort().reverse();

  // Filter by selected year and only closed transactions
  const yearTransactions = myTransactions.filter(t => {
    const transactionYear = new Date(t.closingDate || t.applicationDate).getFullYear();
    return transactionYear === selectedYear && t.status === 'Closed';
  });

  // Calculate payment statistics
  const calculateStats = () => {
    const totalCommissionEarned = yearTransactions.reduce((sum, t) => sum + (t.loFinalPayout || 0), 0);
    const totalTransactions = yearTransactions.length;
    const paidTransactions = yearTransactions.filter(t => t.datePaidLO).length;
    const pendingPayments = totalTransactions - paidTransactions;
    const totalVolume = yearTransactions.reduce((sum, t) => sum + t.loanAmount, 0);

    // Monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, month) => {
      const monthTransactions = yearTransactions.filter(t => {
        const date = new Date(t.closingDate || t.applicationDate);
        return date.getMonth() === month;
      });

      return {
        month: month + 1,
        monthName: format(new Date(selectedYear, month, 1), 'MMM'),
        transactions: monthTransactions.length,
        commission: monthTransactions.reduce((sum, t) => sum + (t.loFinalPayout || 0), 0),
        volume: monthTransactions.reduce((sum, t) => sum + t.loanAmount, 0),
        paid: monthTransactions.filter(t => t.datePaidLO).length,
        pending: monthTransactions.filter(t => !t.datePaidLO).length
      };
    });

    return {
      totalCommissionEarned,
      totalTransactions,
      totalVolume,
      paidTransactions,
      pendingPayments,
      monthlyBreakdown,
      averageCommissionPerDeal: totalTransactions > 0 ? totalCommissionEarned / totalTransactions : 0
    };
  };

  const stats = calculateStats();

  const exportPaymentData = () => {
    const data = yearTransactions.map(t => ({
      'Client Name': t.clientName,
      'Property': t.property,
      'Loan Amount': t.loanAmount,
      'Loan Type': t.loanType,
      'Closing Date': t.closingDate ? format(new Date(t.closingDate), 'MM/dd/yyyy') : 'N/A',
      'Commission Earned': t.loFinalPayout || 0,
      'Date Paid': t.datePaidLO ? format(new Date(t.datePaidLO), 'MM/dd/yyyy') : 'Pending',
      'Status': t.datePaidLO ? 'Paid' : 'Pending',
      'Notes': t.notes || ''
    }));

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
    a.setAttribute('download', `my_payments_${selectedYear}.csv`);
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
          <h1 className="text-3xl font-bold text-gray-900">My Payments</h1>
          <p className="text-gray-600 mt-1">Track your commission payments and earnings</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earned"
          value={`$${stats.totalCommissionEarned.toLocaleString()}`}
          icon={FiDollarSign}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="Transactions Closed"
          value={stats.totalTransactions}
          icon={FiTrendingUp}
          color="blue"
          delay={0.2}
        />
        <StatCard
          title="Payments Received"
          value={stats.paidTransactions}
          icon={FiCheckCircle}
          color="green"
          delay={0.3}
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={FiClock}
          color="yellow"
          delay={0.4}
        />
      </div>

      {/* Monthly Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown - {selectedYear}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.monthlyBreakdown.map(month => (
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
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-blue-600">{month.paid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-yellow-600">{month.pending}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Transaction Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Payment Details - {selectedYear}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client & Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Earned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {yearTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No closed transactions found for {selectedYear}
                  </td>
                </tr>
              ) : (
                yearTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.clientName}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]" title={transaction.property}>
                          {transaction.property}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        ${transaction.loanAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.loanType} • {transaction.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-green-600">
                        ${(transaction.loFinalPayout || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.loCommissionPercentage || 0}% base + adjustments
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.datePaidLO ? (
                        <div>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(transaction.datePaidLO), 'MM/dd/yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.closingDate ? format(new Date(transaction.closingDate), 'MM/dd/yyyy') : 'N/A'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
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

export default MyPayments;