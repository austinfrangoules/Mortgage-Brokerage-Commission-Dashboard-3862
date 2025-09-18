import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, parseISO, differenceInDays, addDays, isAfter, isBefore } from 'date-fns';

const {
  FiShield, FiAlertTriangle, FiCheckCircle, FiClock, FiEdit3, FiPlus,
  FiTrash2, FiMail, FiBell, FiCalendar, FiUser, FiBook, FiFileText,
  FiFilter, FiDownload, FiRefreshCw, FiEye, FiSettings
} = FiIcons;

function ComplianceTracker() {
  const { loanOfficers, complianceRecords, addComplianceRecord, updateComplianceRecord, deleteComplianceRecord } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showComplianceForm, setShowComplianceForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState('all');

  const [formData, setFormData] = useState({
    loanOfficerId: '',
    type: 'license', // license, aml, ce, nmls
    state: '',
    description: '',
    issueDate: '',
    expirationDate: '',
    reminderDays: [60, 30, 7],
    isCompleted: false,
    ceHoursRequired: '',
    ceHoursCompleted: '',
    notes: ''
  });

  // Get compliance status for a record
  const getComplianceStatus = (record) => {
    if (record.isCompleted) return 'compliant';
    
    const today = new Date();
    const expiration = parseISO(record.expirationDate);
    const daysUntilExpiration = differenceInDays(expiration, today);

    if (daysUntilExpiration < 0) return 'overdue';
    if (daysUntilExpiration <= 30) return 'due-soon';
    return 'compliant';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'due-soon': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant': return FiCheckCircle;
      case 'due-soon': return FiClock;
      case 'overdue': return FiAlertTriangle;
      default: return FiShield;
    }
  };

  // Filter compliance records
  const filteredRecords = complianceRecords.filter(record => {
    const matchesOfficer = selectedOfficer === 'all' || record.loanOfficerId === parseInt(selectedOfficer);
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesStatus = filterStatus === 'all' || getComplianceStatus(record) === filterStatus;
    
    // For loan officers, only show their own records
    if (user?.type === 'loan_officer') {
      return record.loanOfficerId === user.id && matchesType && matchesStatus;
    }
    
    return matchesOfficer && matchesType && matchesStatus;
  });

  // Get upcoming renewals
  const getUpcomingRenewals = () => {
    const today = new Date();
    return complianceRecords
      .filter(record => !record.isCompleted)
      .filter(record => {
        const expiration = parseISO(record.expirationDate);
        const daysUntilExpiration = differenceInDays(expiration, today);
        return daysUntilExpiration >= 0 && daysUntilExpiration <= 60;
      })
      .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  };

  // Get overdue items
  const getOverdueItems = () => {
    const today = new Date();
    return complianceRecords
      .filter(record => !record.isCompleted)
      .filter(record => {
        const expiration = parseISO(record.expirationDate);
        return isBefore(expiration, today);
      })
      .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  };

  // Calculate compliance statistics
  const getComplianceStats = () => {
    const total = complianceRecords.length;
    const compliant = complianceRecords.filter(r => getComplianceStatus(r) === 'compliant').length;
    const dueSoon = complianceRecords.filter(r => getComplianceStatus(r) === 'due-soon').length;
    const overdue = complianceRecords.filter(r => getComplianceStatus(r) === 'overdue').length;

    return { total, compliant, dueSoon, overdue };
  };

  // Send compliance reminder (simulated)
  const sendComplianceReminder = (record, daysUntil) => {
    const officer = loanOfficers.find(lo => lo.id === record.loanOfficerId);
    if (!officer) return;

    // In a real application, this would send an actual email
    console.log(`Sending compliance reminder to ${officer.email}:
      Type: ${record.type.toUpperCase()}
      Description: ${record.description}
      Days until expiration: ${daysUntil}
      Expiration Date: ${format(parseISO(record.expirationDate), 'MMM d, yyyy')}
    `);

    // Show notification to admin
    if (user?.type === 'admin') {
      alert(`Compliance reminder sent to ${officer.name} for ${record.description} (${daysUntil} days until expiration)`);
    }
  };

  // Check for pending reminders
  const checkPendingReminders = () => {
    const today = new Date();
    
    complianceRecords.forEach(record => {
      if (record.isCompleted) return;
      
      const expiration = parseISO(record.expirationDate);
      const daysUntilExpiration = differenceInDays(expiration, today);
      
      // Check if we need to send reminders
      record.reminderDays.forEach(reminderDay => {
        if (daysUntilExpiration === reminderDay) {
          sendComplianceReminder(record, daysUntilExpiration);
        }
      });
    });
  };

  // Check reminders on component mount
  useEffect(() => {
    checkPendingReminders();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const recordData = {
      ...formData,
      loanOfficerId: parseInt(formData.loanOfficerId),
      ceHoursRequired: parseFloat(formData.ceHoursRequired) || 0,
      ceHoursCompleted: parseFloat(formData.ceHoursCompleted) || 0,
      reminderDays: formData.reminderDays.map(d => parseInt(d))
    };

    if (editingRecord) {
      updateComplianceRecord(editingRecord.id, recordData);
      setEditingRecord(null);
    } else {
      addComplianceRecord(recordData);
    }

    setShowComplianceForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      loanOfficerId: '',
      type: 'license',
      state: '',
      description: '',
      issueDate: '',
      expirationDate: '',
      reminderDays: [60, 30, 7],
      isCompleted: false,
      ceHoursRequired: '',
      ceHoursCompleted: '',
      notes: ''
    });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      ...record,
      ceHoursRequired: record.ceHoursRequired?.toString() || '',
      ceHoursCompleted: record.ceHoursCompleted?.toString() || ''
    });
    setShowComplianceForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this compliance record?')) {
      deleteComplianceRecord(id);
    }
  };

  const exportComplianceData = () => {
    const data = filteredRecords.map(record => {
      const officer = loanOfficers.find(lo => lo.id === record.loanOfficerId);
      const status = getComplianceStatus(record);
      const daysUntilExpiration = differenceInDays(parseISO(record.expirationDate), new Date());

      return {
        'Loan Officer': officer?.name || 'Unknown',
        'Type': record.type.toUpperCase(),
        'Description': record.description,
        'State': record.state || 'N/A',
        'Issue Date': record.issueDate ? format(parseISO(record.issueDate), 'MM/dd/yyyy') : 'N/A',
        'Expiration Date': format(parseISO(record.expirationDate), 'MM/dd/yyyy'),
        'Days Until Expiration': daysUntilExpiration,
        'Status': status.replace('-', ' ').toUpperCase(),
        'CE Hours Required': record.ceHoursRequired || 'N/A',
        'CE Hours Completed': record.ceHoursCompleted || 'N/A',
        'Completed': record.isCompleted ? 'Yes' : 'No',
        'Notes': record.notes || ''
      };
    });

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(value => `"${value}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `compliance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const stats = getComplianceStats();
  const upcomingRenewals = getUpcomingRenewals();
  const overdueItems = getOverdueItems();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiShield },
    { id: 'records', label: 'All Records', icon: FiFileText },
    { id: 'reminders', label: 'Reminders', icon: FiBell, count: upcomingRenewals.length + overdueItems.length }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Compliance Tracker</h1>
          <p className="text-gray-600 mt-1">
            Monitor license renewals, AML compliance, and continuing education
          </p>
        </motion.div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportComplianceData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} />
            <span>Export</span>
          </button>
          
          {user?.type === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowComplianceForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
            >
              <SafeIcon icon={FiPlus} />
              <span>Add Record</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Records"
          value={stats.total}
          icon={FiFileText}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Compliant"
          value={stats.compliant}
          icon={FiCheckCircle}
          color="green"
          delay={0.2}
        />
        <StatCard
          title="Due Soon"
          value={stats.dueSoon}
          icon={FiClock}
          color="yellow"
          delay={0.3}
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          icon={FiAlertTriangle}
          color="red"
          delay={0.4}
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SafeIcon icon={tab.icon} className="mr-2" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Overdue Items Alert */}
            {overdueItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <SafeIcon icon={FiAlertTriangle} className="text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">Overdue Items</h3>
                </div>
                <div className="space-y-2">
                  {overdueItems.slice(0, 5).map(record => {
                    const officer = loanOfficers.find(lo => lo.id === record.loanOfficerId);
                    const daysOverdue = Math.abs(differenceInDays(parseISO(record.expirationDate), new Date()));
                    
                    return (
                      <div key={record.id} className="flex justify-between items-center bg-white p-3 rounded border">
                        <div>
                          <p className="font-medium text-red-800">{officer?.name}</p>
                          <p className="text-sm text-red-600">{record.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-800">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </p>
                          <p className="text-xs text-red-600">
                            Expired: {format(parseISO(record.expirationDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Upcoming Renewals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-3">
                <SafeIcon icon={FiClock} className="text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">Upcoming Renewals (Next 60 Days)</h3>
              </div>
              
              {upcomingRenewals.length === 0 ? (
                <p className="text-yellow-700">No upcoming renewals in the next 60 days.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingRenewals.slice(0, 10).map(record => {
                    const officer = loanOfficers.find(lo => lo.id === record.loanOfficerId);
                    const daysUntil = differenceInDays(parseISO(record.expirationDate), new Date());
                    
                    return (
                      <div key={record.id} className="flex justify-between items-center bg-white p-3 rounded border">
                        <div>
                          <p className="font-medium text-yellow-800">{officer?.name}</p>
                          <p className="text-sm text-yellow-600">{record.description}</p>
                          {record.state && (
                            <p className="text-xs text-yellow-500">State: {record.state}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-yellow-800">
                            {daysUntil} day{daysUntil !== 1 ? 's' : ''} remaining
                          </p>
                          <p className="text-xs text-yellow-600">
                            Due: {format(parseISO(record.expirationDate), 'MMM d, yyyy')}
                          </p>
                          <button
                            onClick={() => sendComplianceReminder(record, daysUntil)}
                            className="mt-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                          >
                            <SafeIcon icon={FiMail} className="text-xs" />
                            <span>Send Reminder</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Compliance Summary by Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {['license', 'aml', 'ce', 'nmls'].map(type => {
                const typeRecords = complianceRecords.filter(r => r.type === type);
                const typeCompliant = typeRecords.filter(r => getComplianceStatus(r) === 'compliant').length;
                const typeOverdue = typeRecords.filter(r => getComplianceStatus(r) === 'overdue').length;
                
                return (
                  <div key={type} className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">
                      {type === 'ce' ? 'Continuing Education' : type === 'nmls' ? 'NMLS Reporting' : type === 'aml' ? 'AML Compliance' : 'License Renewals'}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{typeRecords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Compliant:</span>
                        <span className="font-medium">{typeCompliant}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Overdue:</span>
                        <span className="font-medium">{typeOverdue}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* All Records Tab */}
        {activeTab === 'records' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              {user?.type === 'admin' && (
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Loan Officers</option>
                  {loanOfficers.map(officer => (
                    <option key={officer.id} value={officer.id}>{officer.name}</option>
                  ))}
                </select>
              )}
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="license">License Renewals</option>
                <option value="aml">AML Compliance</option>
                <option value="ce">Continuing Education</option>
                <option value="nmls">NMLS Reporting</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="compliant">Compliant</option>
                <option value="due-soon">Due Soon</option>
                <option value="overdue">Overdue</option>
              </select>
              
              <button
                onClick={() => {
                  setSelectedOfficer('all');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center space-x-1"
              >
                <SafeIcon icon={FiRefreshCw} />
                <span>Reset</span>
              </button>
            </div>

            {/* Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {user?.type === 'admin' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loan Officer
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CE Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={user?.type === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                        No compliance records found
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => {
                      const officer = loanOfficers.find(lo => lo.id === record.loanOfficerId);
                      const status = getComplianceStatus(record);
                      const daysUntilExpiration = differenceInDays(parseISO(record.expirationDate), new Date());
                      const StatusIcon = getStatusIcon(status);

                      return (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          {user?.type === 'admin' && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {officer?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{officer?.name}</div>
                                </div>
                              </div>
                            </td>
                          )}
                          
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {record.type === 'ce' ? 'Continuing Education' : 
                                 record.type === 'nmls' ? 'NMLS Reporting' : 
                                 record.type === 'aml' ? 'AML Compliance' : 'License Renewal'}
                              </div>
                              <div className="text-sm text-gray-600">{record.description}</div>
                              {record.state && (
                                <div className="text-xs text-gray-500">State: {record.state}</div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(parseISO(record.expirationDate), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {daysUntilExpiration >= 0 
                                ? `${daysUntilExpiration} days remaining`
                                : `${Math.abs(daysUntilExpiration)} days overdue`
                              }
                            </div>
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              <SafeIcon icon={StatusIcon} className="mr-1" />
                              {status === 'due-soon' ? 'Due Soon' : status === 'overdue' ? 'Overdue' : 'Compliant'}
                            </span>
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap">
                            {record.type === 'ce' ? (
                              <div className="text-sm">
                                <div className="text-gray-900">
                                  {record.ceHoursCompleted || 0} / {record.ceHoursRequired || 0} hours
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                                  <div 
                                    className="bg-blue-500 h-1 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(100, ((record.ceHoursCompleted || 0) / (record.ceHoursRequired || 1)) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Edit Record"
                            >
                              <SafeIcon icon={FiEdit3} />
                            </button>
                            
                            {user?.type === 'admin' && (
                              <>
                                <button
                                  onClick={() => sendComplianceReminder(record, daysUntilExpiration)}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Send Reminder"
                                >
                                  <SafeIcon icon={FiMail} />
                                </button>
                                
                                <button
                                  onClick={() => handleDelete(record.id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete Record"
                                >
                                  <SafeIcon icon={FiTrash2} />
                                </button>
                              </>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Automated Reminder Settings */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Automated Reminder System</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiMail} className="text-blue-600" />
                    <span className="text-blue-800">Email reminders sent automatically at:</span>
                  </div>
                  <ul className="ml-6 space-y-1 text-blue-700">
                    <li>• 60 days before expiration</li>
                    <li>• 30 days before expiration</li>
                    <li>• 7 days before expiration</li>
                    <li>• Day of expiration</li>
                  </ul>
                  <div className="mt-4 p-3 bg-blue-100 rounded border">
                    <p className="text-blue-800 font-medium">CE Monitoring:</p>
                    <p className="text-blue-700 text-sm">Monthly reminders sent if CE requirements aren't completed 90 days before renewal.</p>
                  </div>
                </div>
              </div>

              {/* Manual Reminder Actions */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Manual Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      upcomingRenewals.forEach(record => {
                        const daysUntil = differenceInDays(parseISO(record.expirationDate), new Date());
                        sendComplianceReminder(record, daysUntil);
                      });
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <SafeIcon icon={FiMail} />
                    <span>Send All Upcoming Reminders</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      overdueItems.forEach(record => {
                        const daysOverdue = Math.abs(differenceInDays(parseISO(record.expirationDate), new Date()));
                        sendComplianceReminder(record, -daysOverdue);
                      });
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <SafeIcon icon={FiAlertTriangle} />
                    <span>Send Overdue Notifications</span>
                  </button>
                  
                  <button
                    onClick={checkPendingReminders}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <SafeIcon icon={FiRefreshCw} />
                    <span>Check All Reminders</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reminder Schedule */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Reminder Schedule</h3>
              <div className="space-y-3">
                {complianceRecords
                  .filter(record => !record.isCompleted)
                  .map(record => {
                    const officer = loanOfficers.find(lo => lo.id === record.loanOfficerId);
                    const expiration = parseISO(record.expirationDate);
                    const nextReminders = record.reminderDays
                      .map(days => addDays(expiration, -days))
                      .filter(date => isAfter(date, new Date()))
                      .sort((a, b) => a - b);

                    if (nextReminders.length === 0) return null;

                    return (
                      <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                        <div>
                          <p className="font-medium text-gray-900">{officer?.name}</p>
                          <p className="text-sm text-gray-600">{record.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Next reminder: {format(nextReminders[0], 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {differenceInDays(nextReminders[0], new Date())} days from now
                          </p>
                        </div>
                      </div>
                    );
                  })
                  .filter(Boolean)
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Form Modal */}
      {showComplianceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRecord ? 'Edit Compliance Record' : 'Add Compliance Record'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="license">License Renewal</option>
                    <option value="aml">AML Compliance</option>
                    <option value="ce">Continuing Education</option>
                    <option value="nmls">NMLS Reporting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Colorado Mortgage License"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="CO"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* CE Hours (only for CE type) */}
              {formData.type === 'ce' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CE Hours Required
                    </label>
                    <input
                      type="number"
                      value={formData.ceHoursRequired}
                      onChange={(e) => setFormData({ ...formData, ceHoursRequired: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CE Hours Completed
                    </label>
                    <input
                      type="number"
                      value={formData.ceHoursCompleted}
                      onChange={(e) => setFormData({ ...formData, ceHoursCompleted: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              )}

              {/* Completion Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCompleted"
                  checked={formData.isCompleted}
                  onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isCompleted" className="text-sm text-gray-700">
                  Mark as completed
                </label>
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
                  placeholder="Additional information about this compliance requirement..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowComplianceForm(false);
                    setEditingRecord(null);
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
                  {editingRecord ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, delay }) {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    yellow: 'from-yellow-500 to-orange-600',
    blue: 'from-blue-500 to-indigo-600',
    red: 'from-red-500 to-pink-600'
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

export default ComplianceTracker;