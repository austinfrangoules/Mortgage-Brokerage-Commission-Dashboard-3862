import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiSave, FiUser, FiMail, FiPhone, FiMapPin, FiAward, FiCalendar, FiBriefcase } = FiIcons;

function UserFormModal({ user, userType, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hireDate: '',
    isActive: true,
    notes: '',
    // Loan Officer specific fields
    nmlsNumber: '',
    licenseStates: [],
    monthlyGoal: '',
    yearlyGoal: '',
    specialties: [],
    // Admin specific fields
    role: 'admin',
    department: '',
    permissions: {}
  });

  const [errors, setErrors] = useState({});

  // Options
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

  const departmentOptions = [
    'Operations',
    'Underwriting',
    'Processing',
    'Compliance',
    'Marketing',
    'IT',
    'Finance',
    'HR'
  ];

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'super_admin', label: 'Super Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'supervisor', label: 'Supervisor' }
  ];

  // Default permissions
  const getDefaultPermissions = (userType) => {
    if (userType === 'loan_officer') {
      return {
        dashboard: { view: true, edit: false },
        transactions: { view: true, edit: true, delete: false, create: true },
        statistics: { view: true, export: false },
        lenders: { view: true, edit: false, delete: false, create: false },
        goals: { view: true, edit: true, delete: true, create: true },
        contacts: { view: true, edit: true, delete: true, create: true },
        profile: { view: true, edit: true },
        payments: { view: true }
      };
    } else {
      return {
        dashboard: { view: true, edit: true },
        transactions: { view: true, edit: true, delete: true, create: true },
        statistics: { view: true, export: true },
        lenders: { view: true, edit: true, delete: true, create: true },
        goals: { view: true, edit: true, delete: true, create: true },
        contacts: { view: true, edit: true, delete: true, create: true },
        loanOfficers: { view: true, edit: true, delete: true, create: true },
        payments: { view: true, edit: true, process: true },
        settings: { view: true, edit: true },
        reports: { view: true, export: true, schedule: true }
      };
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        licenseStates: user.licenseStates || [],
        specialties: user.specialties || [],
        monthlyGoal: user.monthlyGoal?.toString() || '',
        yearlyGoal: user.yearlyGoal?.toString() || '',
        permissions: user.permissions || getDefaultPermissions(userType)
      });
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: getDefaultPermissions(userType)
      }));
    }
  }, [user, userType]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (userType === 'loan_officer') {
      if (formData.monthlyGoal && isNaN(parseFloat(formData.monthlyGoal))) {
        newErrors.monthlyGoal = 'Monthly goal must be a number';
      }
      if (formData.yearlyGoal && isNaN(parseFloat(formData.yearlyGoal))) {
        newErrors.yearlyGoal = 'Yearly goal must be a number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const userData = {
      ...formData,
      monthlyGoal: parseFloat(formData.monthlyGoal) || 0,
      yearlyGoal: parseFloat(formData.yearlyGoal) || 0
    };

    onSave(userData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {user ? 'Edit' : 'Add'} {userType === 'loan_officer' ? 'Loan Officer' : 'Administrator'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john@company.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hire Date
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Loan Officer Specific Fields */}
          {userType === 'loan_officer' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NMLS Number
                  </label>
                  <input
                    type="text"
                    name="nmlsNumber"
                    value={formData.nmlsNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456"
                  />
                </div>
              </div>

              {/* License States */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Licensed States
                </label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {stateOptions.map(state => (
                    <label key={state} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.licenseStates.includes(state)}
                        onChange={() => handleArrayChange('licenseStates', state)}
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
                    name="monthlyGoal"
                    value={formData.monthlyGoal}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.monthlyGoal ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="1000"
                    placeholder="50000"
                  />
                  {errors.monthlyGoal && (
                    <p className="text-red-500 text-sm mt-1">{errors.monthlyGoal}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yearly Commission Goal ($)
                  </label>
                  <input
                    type="number"
                    name="yearlyGoal"
                    value={formData.yearlyGoal}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.yearlyGoal ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="10000"
                    placeholder="600000"
                  />
                  {errors.yearlyGoal && (
                    <p className="text-red-500 text-sm mt-1">{errors.yearlyGoal}</p>
                  )}
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
                        onChange={() => handleArrayChange('specialties', specialty)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Admin Specific Fields */}
          {userType === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active User
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional information about this user..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiSave} />
              <span>{user ? 'Update' : 'Create'} User</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default UserFormModal;