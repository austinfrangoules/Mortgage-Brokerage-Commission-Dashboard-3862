import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiUser, FiPhone, FiMail, FiMapPin, FiAward, FiTrendingUp, FiDollarSign, FiEye } = FiIcons;

function LoanOfficerRoster() {
  const navigate = useNavigate();
  const { loanOfficers, addLoanOfficer, updateLoanOfficer, deleteLoanOfficer, transactions } = useData();
  const [showOfficerForm, setShowOfficerForm] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nmlsNumber: '',
    licenseStates: [],
    monthlyGoal: '',
    yearlyGoal: '',
    hireDate: '',
    specialties: [],
    notes: ''
  });

  const stateOptions = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const specialtyOptions = [
    'First-Time Homebuyers',
    'Investment Properties',
    'Luxury Homes',
    'VA Loans',
    'FHA Loans',
    'USDA Loans',
    'Jumbo Loans',
    'Construction Loans',
    'Refinancing',
    'Reverse Mortgages'
  ];

  // Calculate officer statistics
  const getOfficerStats = (officerId) => {
    const officerTransactions = transactions.filter(t => t.loanOfficerId === officerId);
    const closedTransactions = officerTransactions.filter(t => t.status === 'Closed');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const yearTransactions = officerTransactions.filter(t => 
      new Date(t.applicationDate).getFullYear() === currentYear
    );
    const monthTransactions = officerTransactions.filter(t => {
      const date = new Date(t.applicationDate);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    const yearCommission = yearTransactions
      .filter(t => t.status === 'Closed')
      .reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0);
    
    const monthCommission = monthTransactions
      .filter(t => t.status === 'Closed')
      .reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0);

    return {
      totalTransactions: officerTransactions.length,
      closedTransactions: closedTransactions.length,
      totalVolume: officerTransactions.reduce((sum, t) => sum + t.loanAmount, 0),
      totalCommission: closedTransactions.reduce((sum, t) => sum + (t.loanAmount * t.commissionRate / 100), 0),
      yearCommission,
      monthCommission,
      conversionRate: officerTransactions.length > 0 
        ? (closedTransactions.length / officerTransactions.length) * 100 
        : 0
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const officerData = {
      ...formData,
      monthlyGoal: parseFloat(formData.monthlyGoal) || 0,
      yearlyGoal: parseFloat(formData.yearlyGoal) || 0
    };

    if (editingOfficer) {
      updateLoanOfficer(editingOfficer.id, officerData);
      setEditingOfficer(null);
    } else {
      addLoanOfficer(officerData);
    }

    setShowOfficerForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      nmlsNumber: '',
      licenseStates: [],
      monthlyGoal: '',
      yearlyGoal: '',
      hireDate: '',
      specialties: [],
      notes: ''
    });
  };

  const handleEdit = (officer) => {
    setEditingOfficer(officer);
    setFormData({
      ...officer,
      licenseStates: officer.licenseStates || [],
      specialties: officer.specialties || [],
      monthlyGoal: officer.monthlyGoal?.toString() || '',
      yearlyGoal: officer.yearlyGoal?.toString() || '',
      hireDate: officer.hireDate || ''
    });
    setShowOfficerForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this loan officer?')) {
      deleteLoanOfficer(id);
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
          <h1 className="text-3xl font-bold text-gray-900">Loan Officer Roster</h1>
          <p className="text-gray-600 mt-1">Manage your team of loan officers</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowOfficerForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Loan Officer</span>
        </motion.button>
      </div>

      {/* Officers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loanOfficers.map((officer, index) => {
          const stats = getOfficerStats(officer.id);
          const monthlyProgress = officer.monthlyGoal > 0 ? (stats.monthCommission / officer.monthlyGoal) * 100 : 0;
          const yearlyProgress = officer.yearlyGoal > 0 ? (stats.yearCommission / officer.yearlyGoal) * 100 : 0;
          
          return (
            <motion.div
              key={officer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {officer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{officer.name}</h3>
                    {officer.nmlsNumber && (
                      <p className="text-sm text-gray-600">NMLS: {officer.nmlsNumber}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => navigate(`/loan-officer/${officer.id}`)}
                    className="p-1 text-indigo-600 hover:text-indigo-900"
                    title="View Portal"
                  >
                    <SafeIcon icon={FiEye} />
                  </button>
                  <button
                    onClick={() => handleEdit(officer)}
                    className="p-1 text-blue-600 hover:text-blue-900"
                    title="Edit Officer"
                  >
                    <SafeIcon icon={FiEdit3} />
                  </button>
                  <button
                    onClick={() => handleDelete(officer.id)}
                    className="p-1 text-red-600 hover:text-red-900"
                    title="Delete Officer"
                  >
                    <SafeIcon icon={FiTrash2} />
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 mb-4">
                {officer.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <SafeIcon icon={FiMail} className="text-xs" />
                    <span>{officer.email}</span>
                  </div>
                )}
                {officer.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <SafeIcon icon={FiPhone} className="text-xs" />
                    <span>{officer.phone}</span>
                  </div>
                )}
                {officer.licenseStates && officer.licenseStates.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <SafeIcon icon={FiMapPin} className="text-xs" />
                    <span>Licensed in: {officer.licenseStates.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Goals Progress */}
              {(officer.monthlyGoal > 0 || officer.yearlyGoal > 0) && (
                <div className="mb-4 space-y-3">
                  {officer.monthlyGoal > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Monthly Goal</span>
                        <span className="font-medium">{monthlyProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>${stats.monthCommission.toLocaleString()}</span>
                        <span>${officer.monthlyGoal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  {officer.yearlyGoal > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Yearly Goal</span>
                        <span className="font-medium">{yearlyProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(yearlyProgress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>${stats.yearCommission.toLocaleString()}</span>
                        <span>${officer.yearlyGoal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Specialties */}
              {officer.specialties && officer.specialties.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-1">
                    {officer.specialties.slice(0, 3).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {officer.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{officer.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Stats */}
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

              {/* Hire Date */}
              {officer.hireDate && (
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Hired: {new Date(officer.hireDate).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Officer Form Modal */}
      {showOfficerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingOfficer ? 'Edit Loan Officer' : 'Add New Loan Officer'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
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
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NMLS Number
                  </label>
                  <input
                    type="text"
                    value={formData.nmlsNumber}
                    onChange={(e) => setFormData({ ...formData, nmlsNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* License States */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Licensed States
                </label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-32 overflow-y-auto">
                  {stateOptions.map(state => (
                    <label key={state} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.licenseStates.includes(state)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              licenseStates: [...formData.licenseStates, state]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              licenseStates: formData.licenseStates.filter(s => s !== state)
                            });
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-xs text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Commission Goal ($)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyGoal}
                    onChange={(e) => setFormData({ ...formData, monthlyGoal: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yearly Commission Goal ($)
                  </label>
                  <input
                    type="number"
                    value={formData.yearlyGoal}
                    onChange={(e) => setFormData({ ...formData, yearlyGoal: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="10000"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {specialtyOptions.map(specialty => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              specialties: [...formData.specialties, specialty]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              specialties: formData.specialties.filter(s => s !== specialty)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{specialty}</span>
                    </label>
                  ))}
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
                  placeholder="Additional information about this loan officer..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOfficerForm(false);
                    setEditingOfficer(null);
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
                  {editingOfficer ? 'Update Officer' : 'Add Officer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default LoanOfficerRoster;