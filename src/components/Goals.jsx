import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

const { FiTarget, FiTrendingUp, FiDollarSign, FiCalendar, FiPlus, FiEdit3, FiTrash2, FiAward } = FiIcons;

function Goals() {
  const { transactions, loanOfficers, goals, addGoal, updateGoal, deleteGoal } = useData();
  const { user } = useAuth();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    loanOfficerId: user?.type === 'loan_officer' ? user.id : '',
    type: 'volume', // volume, commission, units
    period: 'monthly', // weekly, monthly, yearly
    target: '',
    loanTypes: [], // specific loan types or empty for all
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // Filter goals based on user role
  const userGoals = user?.type === 'loan_officer' 
    ? goals.filter(g => g.loanOfficerId === user.id)
    : goals;

  // Calculate progress for each goal
  const calculateGoalProgress = (goal) => {
    const now = new Date();
    let startDate, endDate;

    if (goal.period === 'weekly') {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    } else if (goal.period === 'monthly') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    }

    // Filter transactions for this goal
    let relevantTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.applicationDate);
      const isInPeriod = isWithinInterval(transactionDate, { start: startDate, end: endDate });
      const isCorrectOfficer = t.loanOfficerId === goal.loanOfficerId;
      const isCorrectLoanType = goal.loanTypes.length === 0 || goal.loanTypes.includes(t.loanType);
      
      return isInPeriod && isCorrectOfficer && isCorrectLoanType;
    });

    // Calculate progress based on goal type
    let current = 0;
    if (goal.type === 'volume') {
      current = relevantTransactions.reduce((sum, t) => sum + t.loanAmount, 0);
    } else if (goal.type === 'commission') {
      current = relevantTransactions
        .filter(t => t.status === 'Closed')
        .reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0);
    } else if (goal.type === 'units') {
      current = relevantTransactions.filter(t => t.status === 'Closed').length;
    }

    const progress = (current / goal.target) * 100;
    
    return {
      current,
      target: goal.target,
      progress: Math.min(progress, 100),
      isComplete: progress >= 100,
      periodStart: startDate,
      periodEnd: endDate
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const goalData = {
      ...formData,
      target: parseFloat(formData.target),
      loanOfficerId: parseInt(formData.loanOfficerId)
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, goalData);
      setEditingGoal(null);
    } else {
      addGoal(goalData);
    }

    setShowGoalForm(false);
    setFormData({
      loanOfficerId: user?.type === 'loan_officer' ? user.id : '',
      type: 'volume',
      period: 'monthly',
      target: '',
      loanTypes: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      ...goal,
      target: goal.target.toString(),
      startDate: goal.startDate || new Date().toISOString().split('T')[0],
      endDate: goal.endDate || ''
    });
    setShowGoalForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-600 mt-1">
            {user?.type === 'admin' ? 'Manage loan officer goals' : 'Track your performance goals'}
          </p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowGoalForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
        >
          <SafeIcon icon={FiPlus} />
          <span>New Goal</span>
        </motion.button>
      </div>

      {/* Active Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userGoals.map((goal, index) => {
          const progress = calculateGoalProgress(goal);
          const loanOfficer = loanOfficers.find(lo => lo.id === goal.loanOfficerId);
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                progress.isComplete ? 'border-green-500' : 'border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    progress.isComplete ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <SafeIcon 
                      icon={progress.isComplete ? FiAward : FiTarget} 
                      className={`text-lg ${
                        progress.isComplete ? 'text-green-600' : 'text-blue-600'
                      }`} 
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {goal.period} {goal.type} Goal
                    </h3>
                    {user?.type === 'admin' && (
                      <p className="text-sm text-gray-600">{loanOfficer?.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-1 text-blue-600 hover:text-blue-900"
                    title="Edit Goal"
                  >
                    <SafeIcon icon={FiEdit3} />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1 text-red-600 hover:text-red-900"
                    title="Delete Goal"
                  >
                    <SafeIcon icon={FiTrash2} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className={`font-medium ${
                    progress.isComplete ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {progress.progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.progress}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                    className={`h-3 rounded-full ${
                      progress.isComplete ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Goal Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-medium">
                    {goal.type === 'volume' || goal.type === 'commission' 
                      ? `$${progress.current.toLocaleString()}`
                      : progress.current
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target:</span>
                  <span className="font-medium">
                    {goal.type === 'volume' || goal.type === 'commission' 
                      ? `$${progress.target.toLocaleString()}`
                      : progress.target
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium">
                    {goal.type === 'volume' || goal.type === 'commission' 
                      ? `$${Math.max(0, progress.target - progress.current).toLocaleString()}`
                      : Math.max(0, progress.target - progress.current)
                    }
                  </span>
                </div>
                {goal.loanTypes.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loan Types:</span>
                    <span className="font-medium text-xs">
                      {goal.loanTypes.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Period Info */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                Period: {format(progress.periodStart, 'MMM d')} - {format(progress.periodEnd, 'MMM d, yyyy')}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {user?.type === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Officer *
                  </label>
                  <select
                    value={formData.loanOfficerId}
                    onChange={(e) => setFormData({ ...formData, loanOfficerId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Loan Officer</option>
                    {loanOfficers.map(officer => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="volume">Loan Volume</option>
                    <option value="commission">Commission Earned</option>
                    <option value="units">Units Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period *
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target {formData.type === 'units' ? 'Amount' : 'Value'} *
                </label>
                <input
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.type === 'units' ? '10' : '500000'}
                  min="0"
                  step={formData.type === 'units' ? '1' : '1000'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Loan Types (Optional)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.loanTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              loanTypes: [...formData.loanTypes, type]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              loanTypes: formData.loanTypes.filter(t => t !== type)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave unchecked to include all loan types
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalForm(false);
                    setEditingGoal(null);
                    setFormData({
                      loanOfficerId: user?.type === 'loan_officer' ? user.id : '',
                      type: 'volume',
                      period: 'monthly',
                      target: '',
                      loanTypes: [],
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Goals;