import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiArrowLeft, FiDollarSign, FiUser, FiHome, FiCalendar, FiFileText } = FiIcons;

function TransactionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { transactions, loanOfficers, referralSources, lenders, addTransaction, updateTransaction } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    clientName: '',
    loanOfficerId: user?.type === 'loan_officer' ? user.id : '',
    loanAmount: '',
    loanType: 'Conventional',
    purpose: 'Purchase',
    commissionRate: '2.5',
    loCommission: '',
    companyProfit: '',
    realtorPartnerCommission: '',
    isRealtorPartner: false,
    realtorPartnerId: '',
    status: 'Application',
    closingDate: '',
    datePaidLO: '',
    settlementAgent: '',
    dateWePaid: '',
    property: '',
    rate: '',
    referralSourceId: '',
    lenderId: '',
    realtor: '',
    realtorCompany: '',
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('client');

  useEffect(() => {
    if (id) {
      const transaction = transactions.find(t => t.id === parseInt(id));
      if (transaction) {
        setFormData({
          ...transaction,
          closingDate: transaction.closingDate || '',
          loanAmount: transaction.loanAmount.toString(),
          commissionRate: transaction.commissionRate.toString(),
          rate: transaction.rate?.toString() || '',
          loCommission: transaction.loCommission?.toString() || '',
          companyProfit: transaction.companyProfit?.toString() || '',
          realtorPartnerCommission: transaction.realtorPartnerCommission?.toString() || '',
          datePaidLO: transaction.datePaidLO || '',
          dateWePaid: transaction.dateWePaid || '',
          referralSourceId: transaction.referralSourceId?.toString() || '',
          lenderId: transaction.lenderId?.toString() || '',
          realtorPartnerId: transaction.realtorPartnerId?.toString() || '',
          isRealtorPartner: transaction.isRealtorPartner || false,
        });
      }
    }
  }, [id, transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const transactionData = {
      ...formData,
      loanAmount: parseFloat(formData.loanAmount),
      commissionRate: parseFloat(formData.commissionRate),
      rate: parseFloat(formData.rate) || null,
      loCommission: parseFloat(formData.loCommission) || 0,
      companyProfit: parseFloat(formData.companyProfit) || 0,
      realtorPartnerCommission: parseFloat(formData.realtorPartnerCommission) || 0,
      loanOfficerId: parseInt(formData.loanOfficerId),
      closingDate: formData.closingDate || null,
      referralSourceId: parseInt(formData.referralSourceId) || null,
      lenderId: parseInt(formData.lenderId) || null,
      realtorPartnerId: formData.isRealtorPartner ? parseInt(formData.realtorPartnerId) || null : null,
    };

    if (id) {
      updateTransaction(id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    navigate('/');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const calculateTotalCommission = () => {
    if (!formData.loanAmount || !formData.commissionRate) return 0;
    return parseFloat(formData.loanAmount) * parseFloat(formData.commissionRate) / 100;
  };

  const calculateRemainingCommission = () => {
    const total = calculateTotalCommission();
    const loCommission = parseFloat(formData.loCommission) || 0;
    const realtorCommission = parseFloat(formData.realtorPartnerCommission) || 0;
    const companyProfit = parseFloat(formData.companyProfit) || 0;
    return total - loCommission - realtorCommission - companyProfit;
  };

  const tabs = [
    { id: 'client', label: 'Client Info', icon: FiUser },
    { id: 'loan', label: 'Loan Details', icon: FiDollarSign },
    { id: 'property', label: 'Property & Realtor', icon: FiHome },
    { id: 'status', label: 'Status & Timeline', icon: FiCalendar },
    { id: 'commission', label: 'Commission & Payments', icon: FiDollarSign },
    { id: 'notes', label: 'Notes', icon: FiFileText }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Transaction' : 'New Transaction'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Commission</p>
            <p className="text-2xl font-bold text-green-600">${calculateTotalCommission().toLocaleString()}</p>
            {calculateRemainingCommission() !== 0 && (
              <p className="text-sm text-orange-600">
                Remaining: ${calculateRemainingCommission().toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Form Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SafeIcon icon={tab.icon} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Information Tab */}
          {activeTab === 'client' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Client Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John & Jane Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Source
                  </label>
                  <select
                    name="referralSourceId"
                    value={formData.referralSourceId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Referral Source</option>
                    {referralSources.map(source => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>
                {user?.type === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Officer *
                    </label>
                    <select
                      name="loanOfficerId"
                      value={formData.loanOfficerId}
                      onChange={handleChange}
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
              </div>
            </div>
          )}

          {/* Loan Details Tab */}
          {activeTab === 'loan' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Loan Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount *
                </label>
                <input
                  type="number"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="450000"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Type *
                  </label>
                  <select
                    name="loanType"
                    value={formData.loanType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Conventional">Conventional</option>
                    <option value="FHA">FHA</option>
                    <option value="VA">VA</option>
                    <option value="USDA">USDA</option>
                    <option value="Jumbo">Jumbo</option>
                    <option value="HELOC">HELOC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose *
                  </label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Purchase">Purchase</option>
                    <option value="Refinance">Refinance</option>
                    <option value="Cash Out Refinance">Cash Out Refinance</option>
                    <option value="HELOC">HELOC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lender
                  </label>
                  <select
                    name="lenderId"
                    value={formData.lenderId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Lender</option>
                    {lenders.map(lender => (
                      <option key={lender.id} value={lender.id}>
                        {lender.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6.75"
                    min="0"
                    max="20"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate (%) *
                  </label>
                  <input
                    type="number"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.5"
                    min="0"
                    max="10"
                    step="0.1"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Property & Realtor Tab */}
          {activeTab === 'property' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Property & Realtor Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Address *
                </label>
                <input
                  type="text"
                  name="property"
                  value={formData.property}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street, City, State"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Realtor Name
                  </label>
                  <input
                    type="text"
                    name="realtor"
                    value={formData.realtor}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Realtor Company
                  </label>
                  <input
                    type="text"
                    name="realtorCompany"
                    value={formData.realtorCompany}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC Realty"
                  />
                </div>
              </div>
              
              {/* Realtor Partner Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="isRealtorPartner"
                    name="isRealtorPartner"
                    checked={formData.isRealtorPartner}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="isRealtorPartner" className="text-sm font-medium text-gray-700">
                    One of our loan officers is also the realtor partner
                  </label>
                </div>
                {formData.isRealtorPartner && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Realtor Partner (Loan Officer)
                    </label>
                    <select
                      name="realtorPartnerId"
                      value={formData.realtorPartnerId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </div>
            </div>
          )}

          {/* Status & Timeline Tab */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Status & Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Application">Application</option>
                    <option value="In Process">In Process</option>
                    <option value="Underwriting">Underwriting</option>
                    <option value="Approved">Approved</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Date
                  </label>
                  <input
                    type="date"
                    name="closingDate"
                    value={formData.closingDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Commission & Payments Tab */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Commission & Payment Details</h3>
              
              {/* Commission Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Commission Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Total Commission</p>
                    <p className="text-xl font-bold text-green-600">${calculateTotalCommission().toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Remaining to Allocate</p>
                    <p className={`text-xl font-bold ${calculateRemainingCommission() >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ${calculateRemainingCommission().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Officer Commission ($)
                  </label>
                  <input
                    type="number"
                    name="loCommission"
                    value={formData.loCommission}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Profit ($)
                  </label>
                  <input
                    type="number"
                    name="companyProfit"
                    value={formData.companyProfit}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                </div>
                {formData.isRealtorPartner && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Realtor Partner Commission ($)
                    </label>
                    <input
                      type="number"
                      name="realtorPartnerCommission"
                      value={formData.realtorPartnerCommission}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Paid Loan Officer
                  </label>
                  <input
                    type="date"
                    name="datePaidLO"
                    value={formData.datePaidLO}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Settlement Company
                  </label>
                  <input
                    type="text"
                    name="settlementAgent"
                    value={formData.settlementAgent}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Title Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date We Got Paid
                  </label>
                  <input
                    type="date"
                    name="dateWePaid"
                    value={formData.dateWePaid}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes or additional information about this transaction"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-between pt-6 border-t">
            <div className="flex space-x-2">
              {tabs.map((tab, index) => (
                <motion.div
                  key={tab.id}
                  className={`w-3 h-3 rounded-full cursor-pointer ${
                    activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
            >
              <SafeIcon icon={FiSave} />
              <span>{id ? 'Update Transaction' : 'Save Transaction'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default TransactionForm;