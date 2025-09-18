import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, isAfter, subMonths } from 'date-fns';

const {
  FiTrendingDown, FiTrendingUp, FiPercent, FiCalendar, FiPhone, FiMail,
  FiDollarSign, FiAlertTriangle, FiCheckCircle, FiX, FiPlus, FiEdit3,
  FiTrash2, FiBell, FiSettings, FiRefreshCw, FiEye, FiUsers
} = FiIcons;

function InterestRateSidebar({ isOpen, onClose }) {
  const { transactions, loanOfficers, interestRates, rateAlerts, 
          addInterestRate, updateInterestRate, addRateAlert, 
          updateRateAlert, deleteRateAlert } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('rates');
  const [showRateForm, setShowRateForm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  
  const [rateFormData, setRateFormData] = useState({
    conventional30: '',
    conventional15: '',
    fha30: '',
    va30: '',
    jumbo30: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [alertFormData, setAlertFormData] = useState({
    loanType: 'Conventional',
    targetRate: '',
    description: '',
    isActive: true
  });

  // Get today's rates
  const todaysRates = interestRates.find(rate => 
    rate.date === new Date().toISOString().split('T')[0]
  );

  // Get previous rates for comparison
  const previousRates = interestRates
    .filter(rate => rate.date < new Date().toISOString().split('T')[0])
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  // Calculate rate change
  const getRateChange = (current, previous, loanType) => {
    if (!current || !previous) return null;
    const currentRate = parseFloat(current[loanType]) || 0;
    const previousRate = parseFloat(previous[loanType]) || 0;
    return currentRate - previousRate;
  };

  // Find refinance opportunities
  const findRefinanceOpportunities = () => {
    if (!todaysRates) return [];

    const opportunities = [];
    const cutoffDate = subMonths(new Date(), 6); // Only consider loans from 6+ months ago

    transactions.forEach(transaction => {
      if (transaction.status !== 'Closed' || !transaction.closingDate || !transaction.rate) return;
      
      const closingDate = new Date(transaction.closingDate);
      if (isAfter(cutoffDate, closingDate)) return; // Too recent

      const currentRate = parseFloat(transaction.rate);
      let todaysRate = 0;

      // Map loan type to current rates
      switch (transaction.loanType) {
        case 'Conventional':
          todaysRate = parseFloat(todaysRates.conventional30) || 0;
          break;
        case 'FHA':
          todaysRate = parseFloat(todaysRates.fha30) || 0;
          break;
        case 'VA':
          todaysRate = parseFloat(todaysRates.va30) || 0;
          break;
        case 'Jumbo':
          todaysRate = parseFloat(todaysRates.jumbo30) || 0;
          break;
        default:
          todaysRate = parseFloat(todaysRates.conventional30) || 0;
      }

      const rateDifference = currentRate - todaysRate;
      
      // Consider it an opportunity if rate difference is 0.5% or more
      if (rateDifference >= 0.5) {
        const loanOfficer = loanOfficers.find(lo => lo.id === transaction.loanOfficerId);
        
        opportunities.push({
          ...transaction,
          currentRate,
          todaysRate,
          rateDifference,
          potentialSavings: (rateDifference / 100) * transaction.loanAmount * 0.01, // Rough monthly savings
          loanOfficerName: loanOfficer?.name || 'Unknown',
          loanOfficerPhone: loanOfficer?.phone || '',
          loanOfficerEmail: loanOfficer?.email || ''
        });
      }
    });

    return opportunities.sort((a, b) => b.rateDifference - a.rateDifference);
  };

  // Check triggered alerts
  const getTriggeredAlerts = () => {
    if (!todaysRates) return [];

    return rateAlerts.filter(alert => {
      if (!alert.isActive) return false;
      
      let currentRate = 0;
      switch (alert.loanType) {
        case 'Conventional':
          currentRate = parseFloat(todaysRates.conventional30) || 0;
          break;
        case 'FHA':
          currentRate = parseFloat(todaysRates.fha30) || 0;
          break;
        case 'VA':
          currentRate = parseFloat(todaysRates.va30) || 0;
          break;
        case 'Jumbo':
          currentRate = parseFloat(todaysRates.jumbo30) || 0;
          break;
        default:
          currentRate = parseFloat(todaysRates.conventional30) || 0;
      }

      return currentRate <= parseFloat(alert.targetRate);
    });
  };

  const refinanceOpportunities = findRefinanceOpportunities();
  const triggeredAlerts = getTriggeredAlerts();

  const handleRateSubmit = (e) => {
    e.preventDefault();
    const rateData = {
      ...rateFormData,
      conventional30: parseFloat(rateFormData.conventional30) || 0,
      conventional15: parseFloat(rateFormData.conventional15) || 0,
      fha30: parseFloat(rateFormData.fha30) || 0,
      va30: parseFloat(rateFormData.va30) || 0,
      jumbo30: parseFloat(rateFormData.jumbo30) || 0
    };

    const existingRate = interestRates.find(rate => rate.date === rateData.date);
    if (existingRate) {
      updateInterestRate(existingRate.id, rateData);
    } else {
      addInterestRate(rateData);
    }

    setShowRateForm(false);
    setRateFormData({
      conventional30: '',
      conventional15: '',
      fha30: '',
      va30: '',
      jumbo30: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAlertSubmit = (e) => {
    e.preventDefault();
    const alertData = {
      ...alertFormData,
      targetRate: parseFloat(alertFormData.targetRate),
      createdBy: user?.name || 'Unknown',
      createdAt: new Date().toISOString()
    };

    if (editingAlert) {
      updateRateAlert(editingAlert.id, alertData);
      setEditingAlert(null);
    } else {
      addRateAlert(alertData);
    }

    setShowAlertForm(false);
    setAlertFormData({
      loanType: 'Conventional',
      targetRate: '',
      description: '',
      isActive: true
    });
  };

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setAlertFormData({
      loanType: alert.loanType,
      targetRate: alert.targetRate.toString(),
      description: alert.description,
      isActive: alert.isActive
    });
    setShowAlertForm(true);
  };

  const tabs = [
    { id: 'rates', label: 'Current Rates', icon: FiPercent },
    { id: 'opportunities', label: 'Refinance Ops', icon: FiTrendingDown, count: refinanceOpportunities.length },
    { id: 'alerts', label: 'Rate Alerts', icon: FiBell, count: triggeredAlerts.length }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiPercent} className="text-xl" />
                  <h2 className="text-lg font-semibold">Interest Rates</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <SafeIcon icon={FiX} />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <SafeIcon icon={tab.icon} className="mr-1" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Current Rates Tab */}
              {activeTab === 'rates' && (
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Today's Rates</h3>
                    <button
                      onClick={() => setShowRateForm(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <SafeIcon icon={FiPlus} className="text-xs" />
                      <span>Update</span>
                    </button>
                  </div>

                  {todaysRates ? (
                    <div className="space-y-3">
                      {[
                        { key: 'conventional30', label: 'Conventional 30yr' },
                        { key: 'conventional15', label: 'Conventional 15yr' },
                        { key: 'fha30', label: 'FHA 30yr' },
                        { key: 'va30', label: 'VA 30yr' },
                        { key: 'jumbo30', label: 'Jumbo 30yr' }
                      ].map(({ key, label }) => {
                        const change = getRateChange(todaysRates, previousRates, key);
                        return (
                          <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">{label}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-gray-900">
                                  {todaysRates[key]}%
                                </span>
                                {change !== null && (
                                  <div className={`flex items-center space-x-1 text-xs ${
                                    change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    <SafeIcon icon={change > 0 ? FiTrendingUp : FiTrendingDown} />
                                    <span>{Math.abs(change).toFixed(2)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <SafeIcon icon={FiPercent} className="text-gray-400 text-3xl mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No rates entered for today</p>
                      <button
                        onClick={() => setShowRateForm(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Add today's rates
                      </button>
                    </div>
                  )}

                  {/* Recent Rate History */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Recent History</h4>
                    <div className="space-y-2">
                      {interestRates
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5)
                        .map((rate, index) => (
                          <div key={rate.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">
                              {format(new Date(rate.date), 'MMM d, yyyy')}
                            </span>
                            <span className="text-sm font-medium">
                              {rate.conventional30}%
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Refinance Opportunities Tab */}
              {activeTab === 'opportunities' && (
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Refinance Opportunities</h3>
                    <span className="text-sm text-gray-500">{refinanceOpportunities.length} found</span>
                  </div>

                  {refinanceOpportunities.length > 0 ? (
                    <div className="space-y-3">
                      {refinanceOpportunities.map((opportunity, index) => (
                        <motion.div
                          key={opportunity.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-green-50 border border-green-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{opportunity.clientName}</h4>
                              <p className="text-sm text-gray-600">{opportunity.loanType} • ${opportunity.loanAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                -{opportunity.rateDifference.toFixed(2)}%
                              </div>
                              <div className="text-xs text-gray-500">rate difference</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div>
                              <span className="text-gray-600">Current Rate:</span>
                              <div className="font-medium">{opportunity.currentRate}%</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Today's Rate:</span>
                              <div className="font-medium">{opportunity.todaysRate}%</div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Potential Monthly Savings: </span>
                            ${opportunity.potentialSavings.toLocaleString()}
                          </div>

                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Loan Officer: </span>
                            {opportunity.loanOfficerName}
                          </div>

                          <div className="flex space-x-2">
                            {opportunity.loanOfficerPhone && (
                              <a
                                href={`tel:${opportunity.loanOfficerPhone}`}
                                className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                              >
                                <SafeIcon icon={FiPhone} />
                                <span>Call</span>
                              </a>
                            )}
                            {opportunity.loanOfficerEmail && (
                              <a
                                href={`mailto:${opportunity.loanOfficerEmail}?subject=Refinance Opportunity - ${opportunity.clientName}&body=Hi, I wanted to reach out about a potential refinance opportunity for ${opportunity.clientName}. Their current rate is ${opportunity.currentRate}% and today's rates are ${opportunity.todaysRate}%, which could save them approximately $${opportunity.potentialSavings.toLocaleString()} per month.`}
                                className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                              >
                                <SafeIcon icon={FiMail} />
                                <span>Email</span>
                              </a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <SafeIcon icon={FiTrendingDown} className="text-gray-400 text-3xl mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No refinance opportunities found</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {!todaysRates ? 'Add today\'s rates to find opportunities' : 'Current rates may not be favorable for refinancing'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Rate Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Rate Alerts</h3>
                    <button
                      onClick={() => setShowAlertForm(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <SafeIcon icon={FiPlus} className="text-xs" />
                      <span>Add Alert</span>
                    </button>
                  </div>

                  {/* Triggered Alerts */}
                  {triggeredAlerts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600 flex items-center space-x-1">
                        <SafeIcon icon={FiAlertTriangle} />
                        <span>Triggered Alerts</span>
                      </h4>
                      {triggeredAlerts.map(alert => (
                        <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-red-800">{alert.loanType} Alert</div>
                              <div className="text-sm text-red-600">
                                Target: {alert.targetRate}% or below
                              </div>
                              <div className="text-sm text-red-600">
                                Current: {todaysRates?.[alert.loanType.toLowerCase() + '30'] || 'N/A'}%
                              </div>
                              {alert.description && (
                                <div className="text-xs text-red-500 mt-1">{alert.description}</div>
                              )}
                            </div>
                            <SafeIcon icon={FiBell} className="text-red-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* All Alerts */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">All Alerts</h4>
                    {rateAlerts.length > 0 ? (
                      rateAlerts.map(alert => (
                        <div key={alert.id} className={`border rounded-lg p-3 ${
                          alert.isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{alert.loanType} Alert</div>
                              <div className="text-sm text-gray-600">
                                Notify when rate drops to {alert.targetRate}% or below
                              </div>
                              {alert.description && (
                                <div className="text-xs text-gray-500 mt-1">{alert.description}</div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                Created by {alert.createdBy} on {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {alert.isActive ? (
                                <SafeIcon icon={FiCheckCircle} className="text-green-500" />
                              ) : (
                                <SafeIcon icon={FiX} className="text-gray-400" />
                              )}
                              <button
                                onClick={() => handleEditAlert(alert)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <SafeIcon icon={FiEdit3} className="text-xs" />
                              </button>
                              <button
                                onClick={() => deleteRateAlert(alert.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <SafeIcon icon={FiTrash2} className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <SafeIcon icon={FiBell} className="text-gray-400 text-2xl mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No rate alerts set</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rate Form Modal */}
            {showRateForm && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Update Interest Rates</h3>
                  </div>
                  <form onSubmit={handleRateSubmit} className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={rateFormData.date}
                        onChange={(e) => setRateFormData({ ...rateFormData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    {[
                      { key: 'conventional30', label: 'Conventional 30yr (%)' },
                      { key: 'conventional15', label: 'Conventional 15yr (%)' },
                      { key: 'fha30', label: 'FHA 30yr (%)' },
                      { key: 'va30', label: 'VA 30yr (%)' },
                      { key: 'jumbo30', label: 'Jumbo 30yr (%)' }
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          value={rateFormData[key]}
                          onChange={(e) => setRateFormData({ ...rateFormData, [key]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="6.75"
                        />
                      </div>
                    ))}
                    <div className="flex justify-end space-x-2 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowRateForm(false)}
                        className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Save Rates
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Alert Form Modal */}
            {showAlertForm && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingAlert ? 'Edit Rate Alert' : 'Create Rate Alert'}
                    </h3>
                  </div>
                  <form onSubmit={handleAlertSubmit} className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                      <select
                        value={alertFormData.loanType}
                        onChange={(e) => setAlertFormData({ ...alertFormData, loanType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Conventional">Conventional 30yr</option>
                        <option value="FHA">FHA 30yr</option>
                        <option value="VA">VA 30yr</option>
                        <option value="Jumbo">Jumbo 30yr</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={alertFormData.targetRate}
                        onChange={(e) => setAlertFormData({ ...alertFormData, targetRate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="6.50"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You'll be notified when rates drop to this level or below
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        value={alertFormData.description}
                        onChange={(e) => setAlertFormData({ ...alertFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., For refinance campaign"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={alertFormData.isActive}
                        onChange={(e) => setAlertFormData({ ...alertFormData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="isActive" className="text-sm text-gray-700">
                        Active alert
                      </label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAlertForm(false);
                          setEditingAlert(null);
                          setAlertFormData({
                            loanType: 'Conventional',
                            targetRate: '',
                            description: '',
                            isActive: true
                          });
                        }}
                        className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        {editingAlert ? 'Update Alert' : 'Create Alert'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default InterestRateSidebar;