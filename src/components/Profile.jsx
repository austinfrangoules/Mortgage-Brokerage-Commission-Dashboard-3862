import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiMail, FiPhone, FiMapPin, FiEdit3, FiSave, FiX, FiAward, FiTarget } = FiIcons;

function Profile() {
  const { user } = useAuth();
  const { loanOfficers, updateLoanOfficer, goals, addGoal, updateGoal, deleteGoal } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Get current loan officer data
  const currentOfficer = loanOfficers.find(lo => lo.id === user.id);
  const userGoals = goals.filter(g => g.loanOfficerId === user.id);

  const [profileData, setProfileData] = useState({
    name: currentOfficer?.name || '',
    email: currentOfficer?.email || '',
    phone: currentOfficer?.phone || '',
    nmlsNumber: currentOfficer?.nmlsNumber || '',
    licenseStates: currentOfficer?.licenseStates || [],
    specialties: currentOfficer?.specialties || [],
    notes: currentOfficer?.notes || ''
  });

  const [goalData, setGoalData] = useState({
    type: 'volume',
    period: 'monthly',
    target: '',
    loanTypes: []
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

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateLoanOfficer(user.id, profileData);
    setIsEditing(false);
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    const goalSubmitData = {
      ...goalData,
      target: parseFloat(goalData.target),
      loanOfficerId: user.id
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, goalSubmitData);
      setEditingGoal(null);
    } else {
      addGoal(goalSubmitData);
    }

    setShowGoalForm(false);
    setGoalData({
      type: 'volume',
      period: 'monthly',
      target: '',
      loanTypes: []
    });
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalData({
      ...goal,
      target: goal.target.toString()
    });
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(id);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your profile information and goals</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <SafeIcon icon={isEditing ? FiX : FiEdit3} />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

        {isEditing ? (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NMLS Number
                </label>
                <input
                  type="text"
                  value={profileData.nmlsNumber}
                  onChange={(e) => setProfileData({ ...profileData, nmlsNumber: e.target.value })}
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
                      checked={profileData.licenseStates.includes(state)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfileData({
                            ...profileData,
                            licenseStates: [...profileData.licenseStates, state]
                          });
                        } else {
                          setProfileData({
                            ...profileData,
                            licenseStates: profileData.licenseStates.filter(s => s !== state)
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
                      checked={profileData.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfileData({
                            ...profileData,
                            specialties: [...profileData.specialties, specialty]
                          });
                        } else {
                          setProfileData({
                            ...profileData,
                            specialties: profileData.specialties.filter(s => s !== specialty)
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
                value={profileData.notes}
                onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional information about yourself..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <SafeIcon icon={FiSave} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiUser} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium text-gray-900">{currentOfficer?.name || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiMail} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{currentOfficer?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiPhone} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{currentOfficer?.phone || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">NMLS Number</p>
                <p className="font-medium text-gray-900">{currentOfficer?.nmlsNumber || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Licensed States</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentOfficer?.licenseStates?.map(state => (
                    <span key={state} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {state}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Specialties</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentOfficer?.specialties?.map(specialty => (
                    <span key={specialty} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Goals Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">My Goals</h2>
          <button
            onClick={() => setShowGoalForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <SafeIcon icon={FiTarget} />
            <span>Add Goal</span>
          </button>
        </div>

        {userGoals.length === 0 ? (
          <div className="text-center py-8">
            <SafeIcon icon={FiTarget} className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-500">No goals set yet. Add your first goal to track your progress!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userGoals.map(goal => (
              <div key={goal.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {goal.period} {goal.type} Goal
                  </h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <SafeIcon icon={FiEdit3} className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <SafeIcon icon={FiX} className="text-sm" />
                    </button>
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {goal.type === 'volume' || goal.type === 'commission' 
                    ? `$${goal.target.toLocaleString()}` 
                    : goal.target
                  }
                </p>
                {goal.loanTypes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loan Types: {goal.loanTypes.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

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
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </h2>
            </div>

            <form onSubmit={handleGoalSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Type *
                  </label>
                  <select
                    value={goalData.type}
                    onChange={(e) => setGoalData({ ...goalData, type: e.target.value })}
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
                    value={goalData.period}
                    onChange={(e) => setGoalData({ ...goalData, period: e.target.value })}
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
                  Target {goalData.type === 'units' ? 'Amount' : 'Value'} *
                </label>
                <input
                  type="number"
                  value={goalData.target}
                  onChange={(e) => setGoalData({ ...goalData, target: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={goalData.type === 'units' ? '10' : '500000'}
                  min="0"
                  step={goalData.type === 'units' ? '1' : '1000'}
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
                        checked={goalData.loanTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGoalData({
                              ...goalData,
                              loanTypes: [...goalData.loanTypes, type]
                            });
                          } else {
                            setGoalData({
                              ...goalData,
                              loanTypes: goalData.loanTypes.filter(t => t !== type)
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalForm(false);
                    setEditingGoal(null);
                    setGoalData({ type: 'volume', period: 'monthly', target: '', loanTypes: [] });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Profile;