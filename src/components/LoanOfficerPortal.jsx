import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval, subMonths } from 'date-fns';

const { FiTarget, FiTrendingUp, FiDollarSign, FiCalendar, FiUsers } = FiIcons;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function LoanOfficerPortal() {
  const { id } = useParams();
  const { transactions, loanOfficers, referralSources } = useData();
  const [timeRange, setTimeRange] = useState('12months');
  
  const loanOfficer = loanOfficers.find(lo => lo.id === parseInt(id));
  
  if (!loanOfficer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loan officer not found</p>
      </div>
    );
  }

  // Filter transactions by time range
  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate;
    
    if (timeRange === '3months') {
      startDate = subMonths(now, 3);
    } else if (timeRange === '6months') {
      startDate = subMonths(now, 6);
    } else {
      startDate = subMonths(now, 12);
    }
    
    return transactions
      .filter(t => t.loanOfficerId === parseInt(id))
      .filter(t => {
        const transactionDate = parseISO(t.applicationDate);
        return isWithinInterval(transactionDate, { start: startDate, end: now });
      });
  };

  const officerTransactions = getFilteredTransactions();

  // Calculate current month and year performance
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const monthTransactions = officerTransactions.filter(t => {
    const date = new Date(t.applicationDate);
    return date >= monthStart && date <= monthEnd;
  });

  const yearTransactions = officerTransactions.filter(t => {
    const date = new Date(t.applicationDate);
    return date >= yearStart && date <= yearEnd;
  });

  const monthlyCommission = monthTransactions
    .filter(t => t.status === 'Closed')
    .reduce((sum, t) => sum + t.commissionAmount, 0);

  const yearlyCommission = yearTransactions
    .filter(t => t.status === 'Closed')
    .reduce((sum, t) => sum + t.commissionAmount, 0);

  const monthlyProgress = (monthlyCommission / loanOfficer.monthlyGoal) * 100;
  const yearlyProgress = (yearlyCommission / loanOfficer.yearlyGoal) * 100;

  // Status distribution for this officer
  const getStatusData = () => {
    const statuses = {};
    officerTransactions.forEach(t => {
      statuses[t.status] = (statuses[t.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  };

  // Referral source distribution
  const getReferralSourceData = () => {
    const sources = {};
    officerTransactions.forEach(t => {
      if (t.referralSourceId) {
        const source = referralSources.find(rs => rs.id === t.referralSourceId);
        if (source) {
          sources[source.name] = (sources[source.name] || 0) + 1;
        } else {
          sources['Unknown'] = (sources['Unknown'] || 0) + 1;
        }
      } else {
        sources['Unknown'] = (sources['Unknown'] || 0) + 1;
      }
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  };

  // Monthly performance over the year
  const getMonthlyPerformance = () => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTxns = transactions.filter(t => {
        const txnDate = new Date(t.applicationDate);
        return t.loanOfficerId === parseInt(id) && txnDate >= monthStart && txnDate <= monthEnd;
      });

      const closedTxns = monthTxns.filter(t => t.status === 'Closed');
      
      months.push({
        month: format(date, 'MMM'),
        commission: closedTxns.reduce((sum, t) => sum + t.commissionAmount, 0),
        transactions: monthTxns.length,
        goal: loanOfficer.monthlyGoal
      });
    }
    return months;
  };

  const statusData = getStatusData();
  const referralSourceData = getReferralSourceData();
  const monthlyPerformance = getMonthlyPerformance();

  return (
    <div className="space-y-8">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">{loanOfficer.name}</h1>
          <p className="text-gray-600 mt-1">{loanOfficer.email}</p>
        </motion.div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
        </select>
      </div>

      {/* Performance Overview */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Goal Progress */}
          <div className="bg-white bg-opacity-20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Goal</h3>
              <SafeIcon icon={FiCalendar} className="text-2xl" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{monthlyProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-white h-3 rounded-full"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>${monthlyCommission.toLocaleString()}</span>
                <span>${loanOfficer.monthlyGoal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Yearly Goal Progress */}
          <div className="bg-white bg-opacity-20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Yearly Goal</h3>
              <SafeIcon icon={FiTarget} className="text-2xl" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{yearlyProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(yearlyProgress, 100)}%` }}
                  transition={{ delay: 0.7, duration: 1 }}
                  className="bg-white h-3 rounded-full"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>${yearlyCommission.toLocaleString()}</span>
                <span>${loanOfficer.yearlyGoal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value={officerTransactions.length}
          icon={FiTrendingUp}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Closed Deals"
          value={officerTransactions.filter(t => t.status === 'Closed').length}
          icon={FiTarget}
          color="green"
          delay={0.2}
        />
        <StatCard
          title="Total Commission"
          value={`$${officerTransactions
            .filter(t => t.status === 'Closed')
            .reduce((sum, t) => sum + t.commissionAmount, 0)
            .toLocaleString()}`}
          icon={FiDollarSign}
          color="purple"
          delay={0.3}
        />
        <StatCard
          title="Avg Deal Size"
          value={`$${officerTransactions.length > 0 
            ? Math.round(officerTransactions.reduce((sum, t) => sum + t.loanAmount, 0) / officerTransactions.length).toLocaleString() 
            : 0}`}
          icon={FiUsers}
          color="yellow"
          delay={0.4}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Performance vs Goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance vs Goal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'commission' ? `$${value.toLocaleString()}` : value,
                name === 'commission' ? 'Commission' : name === 'goal' ? 'Goal' : 'Transactions'
              ]} />
              <Bar dataKey="commission" fill="#3b82f6" name="commission" />
              <Bar dataKey="goal" fill="#e5e7eb" name="goal" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Transaction Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Referral Source Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={referralSourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {referralSourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officerTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No transactions found in the selected time period
                  </td>
                </tr>
              ) : (
                officerTransactions.slice(0, 10).map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${transaction.loanAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${transaction.commissionAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.applicationDate), 'MM/dd/yyyy')}
                    </td>
                  </tr>
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

export default LoanOfficerPortal;