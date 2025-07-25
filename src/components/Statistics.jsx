import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, parseISO, isWithinInterval } from 'date-fns';

const { FiCalendar, FiTrendingUp, FiDollarSign, FiUsers, FiPieChart } = FiIcons;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function Statistics() {
  const { transactions, loanOfficers, referralSources, lenders } = useData();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('12months');
  const [dataView, setDataView] = useState('commission'); // commission, volume, count

  // Filter transactions based on user role
  const userTransactions = user?.type === 'loan_officer' 
    ? transactions.filter(t => t.loanOfficerId === user.id)
    : transactions;

  // Filter by time range
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
    
    return userTransactions.filter(t => {
      const transactionDate = parseISO(t.applicationDate);
      return isWithinInterval(transactionDate, { start: startDate, end: now });
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Monthly performance data
  const getMonthlyData = () => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), timeRange === '3months' ? 2 : timeRange === '6months' ? 5 : 11),
      end: new Date()
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = userTransactions.filter(t => {
        const date = new Date(t.applicationDate);
        return date >= monthStart && date <= monthEnd;
      });

      const closedTransactions = monthTransactions.filter(t => t.status === 'Closed');
      
      return {
        month: format(month, 'MMM yyyy'),
        transactions: monthTransactions.length,
        commission: closedTransactions.reduce((sum, t) => sum + t.commissionAmount, 0),
        loanVolume: monthTransactions.reduce((sum, t) => sum + t.loanAmount, 0)
      };
    });
  };

  // Loan type distribution
  const getLoanTypeData = () => {
    const loanTypes = {};
    filteredTransactions.forEach(t => {
      loanTypes[t.loanType] = (loanTypes[t.loanType] || 0) + 1;
    });

    return Object.entries(loanTypes).map(([name, value]) => ({ name, value }));
  };

  // Status distribution
  const getStatusData = () => {
    const statuses = {};
    filteredTransactions.forEach(t => {
      statuses[t.status] = (statuses[t.status] || 0) + 1;
    });

    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  };

  // Referral source distribution
  const getReferralSourceData = () => {
    const sources = {};
    filteredTransactions.forEach(t => {
      if (t.referralSourceId) {
        const source = referralSources.find(rs => rs.id === t.referralSourceId);
        if (source) {
          sources[source.name] = (sources[source.name] || 0) + 1;
        }
      }
    });

    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  };

  // Lender distribution
  const getLenderData = () => {
    const lenderStats = {};
    filteredTransactions.forEach(t => {
      if (t.lenderId) {
        const lender = lenders.find(l => l.id === t.lenderId);
        if (lender) {
          if (!lenderStats[lender.name]) {
            lenderStats[lender.name] = {
              count: 0,
              volume: 0,
              commission: 0
            };
          }
          lenderStats[lender.name].count += 1;
          lenderStats[lender.name].volume += t.loanAmount;
          lenderStats[lender.name].commission += t.commissionAmount;
        }
      }
    });

    return Object.entries(lenderStats).map(([name, stats]) => ({
      name,
      count: stats.count,
      volume: stats.volume,
      commission: stats.commission
    }));
  };

  // Loan officer performance (admin only)
  const getLoanOfficerData = () => {
    if (user?.type !== 'admin') return [];

    return loanOfficers.map(officer => {
      const officerTransactions = filteredTransactions.filter(t => t.loanOfficerId === officer.id);
      const closedTransactions = officerTransactions.filter(t => t.status === 'Closed');
      
      return {
        name: officer.name,
        transactions: officerTransactions.length,
        commission: closedTransactions.reduce((sum, t) => sum + t.commissionAmount, 0),
        loanVolume: officerTransactions.reduce((sum, t) => sum + t.loanAmount, 0)
      };
    });
  };

  const monthlyData = getMonthlyData();
  const loanTypeData = getLoanTypeData();
  const statusData = getStatusData();
  const referralSourceData = getReferralSourceData();
  const lenderData = getLenderData();
  const loanOfficerData = getLoanOfficerData();

  const totalStats = {
    totalCommission: filteredTransactions.filter(t => t.status === 'Closed').reduce((sum, t) => sum + t.commissionAmount, 0),
    totalVolume: filteredTransactions.reduce((sum, t) => sum + t.loanAmount, 0),
    avgCommission: filteredTransactions.length > 0 ? filteredTransactions.reduce((sum, t) => sum + t.commissionAmount, 0) / filteredTransactions.length : 0,
    conversionRate: filteredTransactions.length > 0 ? (filteredTransactions.filter(t => t.status === 'Closed').length / filteredTransactions.length) * 100 : 0
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-1">
            {user?.type === 'admin' ? 'Company performance overview' : 'Your performance overview'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
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
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Commission"
          value={`$${totalStats.totalCommission.toLocaleString()}`}
          icon={FiDollarSign}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="Total Volume"
          value={`$${(totalStats.totalVolume / 1000000).toFixed(1)}M`}
          icon={FiTrendingUp}
          color="blue"
          delay={0.2}
        />
        <StatCard
          title="Avg Commission"
          value={`$${Math.round(totalStats.avgCommission).toLocaleString()}`}
          icon={FiCalendar}
          color="purple"
          delay={0.3}
        />
        <StatCard
          title="Conversion Rate"
          value={`${totalStats.conversionRate.toFixed(1)}%`}
          icon={FiUsers}
          color="yellow"
          delay={0.4}
        />
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex space-x-1">
          <button
            onClick={() => setDataView('commission')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              dataView === 'commission'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Commission
          </button>
          <button
            onClick={() => setDataView('volume')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              dataView === 'volume'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Loan Volume
          </button>
          <button
            onClick={() => setDataView('count')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              dataView === 'count'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transaction Count
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly {dataView === 'commission' ? 'Commission' : dataView === 'volume' ? 'Loan Volume' : 'Transactions'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [
                  dataView === 'commission' || dataView === 'volume'
                    ? `$${value.toLocaleString()}`
                    : value,
                  dataView === 'commission'
                    ? 'Commission'
                    : dataView === 'volume'
                    ? 'Loan Volume'
                    : 'Transactions'
                ]} 
              />
              <Bar 
                dataKey={
                  dataView === 'commission'
                    ? 'commission'
                    : dataView === 'volume'
                    ? 'loanVolume'
                    : 'transactions'
                } 
                fill={
                  dataView === 'commission'
                    ? '#3b82f6'
                    : dataView === 'volume'
                    ? '#10b981'
                    : '#8b5cf6'
                } 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Loan Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {loanTypeData.map((entry, index) => (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Source Distribution</h3>
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

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Lender Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white p-6 rounded-xl shadow-lg col-span-1 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lender Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lenderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'commission') return [`$${value.toLocaleString()}`, 'Commission'];
                  if (name === 'volume') return [`$${(value / 1000000).toFixed(2)}M`, 'Volume'];
                  return [value, 'Transactions'];
                }}
              />
              <Bar dataKey={dataView === 'commission' ? 'commission' : dataView === 'volume' ? 'volume' : 'count'} 
                fill={dataView === 'commission' ? '#3b82f6' : dataView === 'volume' ? '#10b981' : '#8b5cf6'} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Loan Officer Performance (Admin Only) */}
      {user?.type === 'admin' && loanOfficerData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Officer Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={loanOfficerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => {
                if (name === 'commission') return [`$${value.toLocaleString()}`, 'Commission'];
                if (name === 'loanVolume') return [`$${(value / 1000000).toFixed(2)}M`, 'Volume'];
                return [value, 'Transactions'];
              }} />
              <Bar dataKey={dataView === 'commission' ? 'commission' : dataView === 'volume' ? 'loanVolume' : 'transactions'} 
                fill={dataView === 'commission' ? '#3b82f6' : dataView === 'volume' ? '#10b981' : '#8b5cf6'} />
            </BarChart>
          </ResponsiveContainer>
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

export default Statistics;