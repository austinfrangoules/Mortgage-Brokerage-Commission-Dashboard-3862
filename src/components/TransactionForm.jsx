import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiSave,
  FiArrowLeft,
  FiDollarSign,
  FiUser,
  FiHome,
  FiCalendar,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
  FiInfo,
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiClipboard,
  FiBuilding,
  FiX,
  FiMail,
  FiPhone
} = FiIcons;

function TransactionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    transactions, 
    loanOfficers, 
    referralSources, 
    lenders, 
    addTransaction, 
    updateTransaction,
    realtorContacts,
    addRealtorContact,
    getRealtorSuggestions,
    settlementContacts,
    addSettlementContact,
    getSettlementSuggestions
  } = useData();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    clientName: '',
    loanOfficerId: user?.type === 'loan_officer' ? user.id : '',
    loanAmount: '',
    loanNumber: '',
    loanType: 'Conventional',
    purpose: 'Purchase',
    brokerCompensation: '',
    loCommissionPercentage: '60',
    loReimbursements: [],
    loDeductions: [],
    discrepancyAllocations: [],
    realtorPartnerCommission: '',
    isRealtorPartner: false,
    realtorPartnerId: '',
    status: 'Application',
    closingDate: '',
    datePaidLO: '',
    property: '',
    rate: '',
    referralSourceId: '',
    lenderId: '',
    realtor: '',
    realtorCompany: '',
    // Enhanced Settlement information
    settlementCompany: '',
    settlementPOC: '',
    settlementEmail: '',
    settlementPhone: '',
    settlementAmount: '',
    settlementDate: '',
    settlementMethod: 'Wire',
    settlementNotes: '',
    // Audit checklist
    auditChecklist: {
      signedClosingPackage: false,
      commissionCheck: false,
      initialDisclosures: false,
      affiliatedBusinessDisclosure: false,
      cdaGenerated: false,
      arivePostClosingAudit: false
    },
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('client');
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [showCDAModal, setShowCDAModal] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [realtorSuggestions, setRealtorSuggestions] = useState([]);
  const [realtorCompanySuggestions, setRealtorCompanySuggestions] = useState([]);
  const [showRealtorSuggestions, setShowRealtorSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [settlementSuggestions, setSettlementSuggestions] = useState([]);
  const [showSettlementSuggestions, setShowSettlementSuggestions] = useState(false);
  const [formModified, setFormModified] = useState(false);
  const [cdaColor, setCdaColor] = useState('#3b82f6'); // Default blue
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      const transaction = transactions.find(t => t.id === parseInt(id));
      if (transaction) {
        setFormData({
          ...transaction,
          closingDate: transaction.closingDate || '',
          loanAmount: transaction.loanAmount.toString(),
          loanNumber: transaction.loanNumber || '',
          brokerCompensation: transaction.brokerCompensation?.toString() || 
                            (transaction.commissionRate ? 
                              (transaction.loanAmount * transaction.commissionRate / 100).toString() : ''),
          settlementAmount: transaction.settlementAmount?.toString() || '',
          rate: transaction.rate?.toString() || '',
          loCommissionPercentage: transaction.loCommissionPercentage?.toString() || '60',
          loReimbursements: transaction.loReimbursements || [],
          loDeductions: transaction.loDeductions || [],
          discrepancyAllocations: transaction.discrepancyAllocations || [],
          realtorPartnerCommission: transaction.realtorPartnerCommission?.toString() || '',
          datePaidLO: transaction.datePaidLO || '',
          referralSourceId: transaction.referralSourceId?.toString() || '',
          lenderId: transaction.lenderId?.toString() || '',
          realtorPartnerId: transaction.realtorPartnerId?.toString() || '',
          isRealtorPartner: transaction.isRealtorPartner || false,
          // Settlement data
          settlementCompany: transaction.settlementCompany || '',
          settlementPOC: transaction.settlementPOC || '',
          settlementEmail: transaction.settlementEmail || '',
          settlementPhone: transaction.settlementPhone || '',
          settlementDate: transaction.settlementDate || '',
          settlementMethod: transaction.settlementMethod || 'Wire',
          settlementNotes: transaction.settlementNotes || '',
          // Audit checklist
          auditChecklist: transaction.auditChecklist || {
            signedClosingPackage: false,
            commissionCheck: false,
            initialDisclosures: false,
            affiliatedBusinessDisclosure: false,
            cdaGenerated: false,
            arivePostClosingAudit: false
          }
        });
        setFormModified(false);
      }
    }
  }, [id, transactions]);

  // Check for unsaved changes
  const handleNavigation = (destination) => {
    if (formModified) {
      setShowExitConfirmation(destination);
    } else {
      if (typeof destination === 'string') {
        navigate(destination);
      } else {
        navigate('/');
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    // Check for discrepancy before submitting
    const discrepancy = calculateDiscrepancy();
    const hasUnallocatedDiscrepancy = Math.abs(discrepancy) > 0.01 && 
                                      formData.settlementAmount && 
                                      formData.status === 'Closed' &&
                                      Math.abs(discrepancy - calculateTotalAllocations()) > 0.01;
    
    if (hasUnallocatedDiscrepancy) {
      setShowDiscrepancyModal(true);
      return;
    }

    // Save realtor contacts for future use
    if (formData.realtor && formData.realtor.trim()) {
      addRealtorContact({
        name: formData.realtor.trim(),
        company: formData.realtorCompany?.trim() || '',
        type: 'realtor'
      });
    }
    
    // Save settlement contacts
    if (formData.settlementPOC && formData.settlementCompany) {
      addSettlementContact({
        name: formData.settlementPOC.trim(),
        company: formData.settlementCompany.trim(),
        email: formData.settlementEmail?.trim() || '',
        phone: formData.settlementPhone?.trim() || '',
        type: 'settlement'
      });
    }

    const transactionData = {
      ...formData,
      loanAmount: parseFloat(formData.loanAmount),
      brokerCompensation: parseFloat(formData.brokerCompensation),
      settlementAmount: parseFloat(formData.settlementAmount) || null,
      rate: parseFloat(formData.rate) || null,
      loCommissionPercentage: parseFloat(formData.loCommissionPercentage) || 0,
      realtorPartnerCommission: parseFloat(formData.realtorPartnerCommission) || 0,
      loanOfficerId: parseInt(formData.loanOfficerId),
      closingDate: formData.closingDate || null,
      referralSourceId: parseInt(formData.referralSourceId) || null,
      lenderId: parseInt(formData.lenderId) || null,
      realtorPartnerId: formData.isRealtorPartner ? parseInt(formData.realtorPartnerId) || null : null,
      applicationDate: formData.applicationDate || new Date().toISOString().split('T')[0]
    };

    if (id) {
      updateTransaction(id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    
    setFormModified(false);
    
    // Show success message if we're not navigating away
    setSuccessMessage('Transaction saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setFormModified(true);
  };

  // Handle realtor input with suggestions
  const handleRealtorChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, realtor: value });
    setFormModified(true);
    
    if (value.length > 0) {
      const suggestions = getRealtorSuggestions(value, 'realtor');
      setRealtorSuggestions(suggestions);
      setShowRealtorSuggestions(true);
    } else {
      setShowRealtorSuggestions(false);
    }
  };

  // Handle realtor company input with suggestions
  const handleRealtorCompanyChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, realtorCompany: value });
    setFormModified(true);
    
    if (value.length > 0) {
      const suggestions = getRealtorSuggestions(value, 'company');
      setRealtorCompanySuggestions(suggestions);
      setShowCompanySuggestions(true);
    } else {
      setShowCompanySuggestions(false);
    }
  };

  // Handle settlement POC input with suggestions
  const handleSettlementPOCChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, settlementPOC: value });
    setFormModified(true);
    
    if (value.length > 0) {
      const suggestions = getSettlementSuggestions(value);
      setSettlementSuggestions(suggestions);
      setShowSettlementSuggestions(true);
    } else {
      setShowSettlementSuggestions(false);
    }
  };

  // Select realtor suggestion
  const selectRealtorSuggestion = (suggestion) => {
    setFormData({ 
      ...formData, 
      realtor: suggestion.name,
      realtorCompany: suggestion.company || formData.realtorCompany
    });
    setFormModified(true);
    setShowRealtorSuggestions(false);
  };

  // Select company suggestion
  const selectCompanySuggestion = (suggestion) => {
    setFormData({ 
      ...formData, 
      realtorCompany: suggestion.company
    });
    setFormModified(true);
    setShowCompanySuggestions(false);
  };

  // Select settlement contact suggestion
  const selectSettlementSuggestion = (suggestion) => {
    setFormData({ 
      ...formData, 
      settlementPOC: suggestion.name,
      settlementCompany: suggestion.company || formData.settlementCompany,
      settlementEmail: suggestion.email || formData.settlementEmail,
      settlementPhone: suggestion.phone || formData.settlementPhone
    });
    setFormModified(true);
    setShowSettlementSuggestions(false);
  };

  // Handle audit checklist changes
  const handleAuditChange = (field) => {
    setFormData({
      ...formData,
      auditChecklist: {
        ...formData.auditChecklist,
        [field]: !formData.auditChecklist[field]
      }
    });
    setFormModified(true);
  };

  // Calculate broker compensation as % of loan amount (for reference only)
  const calculateBrokerCompensationPercent = () => {
    if (!formData.loanAmount || !formData.brokerCompensation) return 0;
    return (parseFloat(formData.brokerCompensation) / parseFloat(formData.loanAmount)) * 100;
  };

  // Add reimbursement
  const addReimbursement = () => {
    setFormData({
      ...formData,
      loReimbursements: [
        ...formData.loReimbursements,
        { id: Date.now(), description: '', amount: '' }
      ]
    });
    setFormModified(true);
  };

  // Remove reimbursement
  const removeReimbursement = (id) => {
    setFormData({
      ...formData,
      loReimbursements: formData.loReimbursements.filter(item => item.id !== id)
    });
    setFormModified(true);
  };

  // Update reimbursement
  const updateReimbursement = (id, field, value) => {
    setFormData({
      ...formData,
      loReimbursements: formData.loReimbursements.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
    setFormModified(true);
  };

  // Add deduction
  const addDeduction = () => {
    setFormData({
      ...formData,
      loDeductions: [
        ...formData.loDeductions,
        { id: Date.now(), description: '', amount: '' }
      ]
    });
    setFormModified(true);
  };

  // Remove deduction
  const removeDeduction = (id) => {
    setFormData({
      ...formData,
      loDeductions: formData.loDeductions.filter(item => item.id !== id)
    });
    setFormModified(true);
  };

  // Update deduction
  const updateDeduction = (id, field, value) => {
    setFormData({
      ...formData,
      loDeductions: formData.loDeductions.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
    setFormModified(true);
  };

  // Add discrepancy allocation
  const addDiscrepancyAllocation = () => {
    setFormData({
      ...formData,
      discrepancyAllocations: [
        ...formData.discrepancyAllocations,
        { id: Date.now(), description: '', amount: '', allocationType: 'company' }
      ]
    });
    setFormModified(true);
  };

  // Remove discrepancy allocation
  const removeDiscrepancyAllocation = (id) => {
    setFormData({
      ...formData,
      discrepancyAllocations: formData.discrepancyAllocations.filter(item => item.id !== id)
    });
    setFormModified(true);
  };

  // Update discrepancy allocation
  const updateDiscrepancyAllocation = (id, field, value) => {
    setFormData({
      ...formData,
      discrepancyAllocations: formData.discrepancyAllocations.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
    setFormModified(true);
  };

  // Calculate broker compensation (now directly stored in formData)
  const getBrokerCompensation = () => {
    return parseFloat(formData.brokerCompensation) || 0;
  };

  // Calculate discrepancy
  const calculateDiscrepancy = () => {
    const brokerComp = getBrokerCompensation();
    const totalReceived = parseFloat(formData.settlementAmount) || 0;
    return totalReceived - brokerComp;
  };

  // Calculate total discrepancy allocations
  const calculateTotalAllocations = () => {
    return formData.discrepancyAllocations.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
  };

  // Calculate loan officer base commission (percentage of broker compensation)
  const calculateLOBaseCommission = () => {
    const brokerComp = getBrokerCompensation();
    const percentage = parseFloat(formData.loCommissionPercentage) || 0;
    return brokerComp * (percentage / 100);
  };

  // Calculate total reimbursements
  const calculateTotalReimbursements = () => {
    return formData.loReimbursements.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
  };

  // Calculate total deductions
  const calculateTotalDeductions = () => {
    return formData.loDeductions.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
  };

  // Calculate LO allocation from discrepancy
  const calculateLODiscrepancyAllocation = () => {
    return formData.discrepancyAllocations
      .filter(item => item.allocationType === 'loan_officer')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  // Calculate company allocation from discrepancy
  const calculateCompanyDiscrepancyAllocation = () => {
    return formData.discrepancyAllocations
      .filter(item => item.allocationType === 'company')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  // Calculate expense allocations from discrepancy
  const calculateExpenseAllocations = () => {
    return formData.discrepancyAllocations
      .filter(item => item.allocationType === 'expense')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  // Calculate final loan officer payout
  const calculateLOFinalPayout = () => {
    const baseCommission = calculateLOBaseCommission();
    const reimbursements = calculateTotalReimbursements();
    const deductions = calculateTotalDeductions();
    const discrepancyAllocation = calculateLODiscrepancyAllocation();
    return baseCommission + reimbursements - deductions + discrepancyAllocation;
  };

  // Calculate company profit (automatically updated)
  const calculateCompanyProfit = () => {
    const totalReceived = parseFloat(formData.settlementAmount) || getBrokerCompensation();
    const loFinalPayout = calculateLOFinalPayout();
    const realtorCommission = parseFloat(formData.realtorPartnerCommission) || 0;
    const expenseAllocations = calculateExpenseAllocations();
    
    return totalReceived - loFinalPayout - realtorCommission - expenseAllocations;
  };

  const handleDiscrepancyModalSubmit = () => {
    const discrepancy = calculateDiscrepancy();
    const totalAllocations = calculateTotalAllocations();
    
    if (Math.abs(discrepancy - totalAllocations) > 0.01) {
      alert(`Discrepancy allocations ($${totalAllocations.toLocaleString()}) must equal the discrepancy amount ($${discrepancy.toLocaleString()})`);
      return;
    }
    
    setShowDiscrepancyModal(false);
    
    // Now submit the form
    if (handleSubmit()) {
      navigate('/');
    }
  };

  // Format date in MM/DD/YYYY format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Function to generate and print CDA
  const generateCDA = () => {
    // Mark CDA as generated in audit checklist
    setFormData({
      ...formData,
      auditChecklist: {
        ...formData.auditChecklist,
        cdaGenerated: true
      }
    });
    setFormModified(true);
    setShowCDAModal(true);
  };

  // Function to handle print of CDA
  const printCDA = () => {
    const printWindow = window.open('', '_blank');
    const loanOfficer = loanOfficers.find(lo => lo.id === parseInt(formData.loanOfficerId));
    const lender = lenders.find(l => l.id === parseInt(formData.lenderId));
    const referralSource = referralSources.find(rs => rs.id === parseInt(formData.referralSourceId));
    
    printWindow.document.write(`
      <html>
        <head>
          <title>CDA - ${formData.clientName}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              margin: 20px;
              color: #333;
            }
            .header { 
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 3px solid ${cdaColor};
              padding-bottom: 10px;
            }
            .header h1 {
              color: ${cdaColor};
              margin-bottom: 5px;
              font-size: 24px;
            }
            .header h2 {
              margin-top: 0;
              font-size: 20px;
            }
            .container {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
            }
            .left-column {
              flex: 1;
              min-width: 300px;
            }
            .right-column {
              flex: 1;
              min-width: 300px;
            }
            .section { 
              margin-bottom: 20px;
            }
            .section-title { 
              font-weight: bold;
              background-color: ${cdaColor}20;
              color: ${cdaColor};
              padding: 6px 12px;
              margin-bottom: 10px;
              border-radius: 4px;
              font-size: 16px;
            }
            .row { 
              display: flex;
              margin-bottom: 5px;
            }
            .label { 
              font-weight: bold;
              width: 170px;
              font-size: 14px;
            }
            .value { 
              flex: 1;
              font-size: 14px;
            }
            .financial-box { 
              background-color: #f9f9f9;
              padding: 15px;
              margin: 10px 0;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .payout-summary { 
              background-color: ${cdaColor}10;
              padding: 15px;
              border: 1px solid ${cdaColor};
              border-radius: 5px;
              margin-bottom: 20px;
            }
            table { 
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }
            th, td { 
              border: 1px solid #ddd;
              padding: 8px 10px;
              text-align: left;
              font-size: 14px;
            }
            th { 
              background-color: ${cdaColor}20;
              color: ${cdaColor};
            }
            .total-row { 
              font-weight: bold;
              background-color: #f0f0f0;
            }
            .signatures { 
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
            }
            .signature-line { 
              border-top: 1px solid #333;
              width: 200px;
              margin-top: 40px;
              text-align: center;
            }
            .discrepancy-positive {
              color: #10b981;
            }
            .discrepancy-negative {
              color: #ef4444;
            }
            .settlement-box {
              background-color: #f0f4ff;
              padding: 15px;
              border: 1px solid #dbeafe;
              border-radius: 5px;
              margin: 10px 0;
            }
            .settlement-method {
              display: inline-block;
              background-color: ${cdaColor}30;
              color: ${cdaColor};
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 13px;
              margin-left: 8px;
            }
            .adjustment-item {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
            }
            .adjustment-description {
              flex: 1;
            }
            .adjustment-amount {
              font-weight: bold;
              text-align: right;
              min-width: 100px;
            }
            .adjustment-positive {
              color: #10b981;
            }
            .adjustment-negative {
              color: #ef4444;
            }
            .final-summary-box {
              background-color: #f0f7ff;
              border: 2px solid ${cdaColor};
              border-radius: 6px;
              padding: 15px;
              margin-top: 20px;
            }
            .final-summary-title {
              font-size: 16px;
              font-weight: bold;
              color: ${cdaColor};
              margin-bottom: 10px;
              text-align: center;
              border-bottom: 1px solid ${cdaColor}40;
              padding-bottom: 5px;
            }
            .final-summary-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 14px;
            }
            .final-summary-total {
              font-weight: bold;
              font-size: 16px;
              border-top: 1px solid ${cdaColor}40;
              padding-top: 5px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Commission Disbursement Authorization</h1>
            <h2>${formData.clientName}</h2>
            <p>Loan #: ${formData.loanNumber || 'N/A'} | Generated: ${formatDate(new Date().toISOString().split('T')[0])}</p>
          </div>
          
          <div class="container">
            <div class="left-column">
              <div class="section">
                <div class="section-title">TRANSACTION OVERVIEW</div>
                <div class="row"><div class="label">Property:</div><div class="value">${formData.property}</div></div>
                <div class="row"><div class="label">Loan Amount:</div><div class="value">$${parseFloat(formData.loanAmount).toLocaleString()}</div></div>
                <div class="row"><div class="label">Loan Type:</div><div class="value">${formData.loanType} - ${formData.purpose}</div></div>
                <div class="row"><div class="label">Rate:</div><div class="value">${formData.rate}%</div></div>
                <div class="row"><div class="label">Status:</div><div class="value">${formData.status}</div></div>
                <div class="row"><div class="label">Closing Date:</div><div class="value">${formatDate(formData.closingDate) || 'TBD'}</div></div>
              </div>

              <div class="settlement-box">
                <div class="section-title">SETTLEMENT INFORMATION</div>
                <div class="row"><div class="label">Company:</div><div class="value">${formData.settlementCompany || 'N/A'}</div></div>
                <div class="row"><div class="label">Contact:</div><div class="value">${formData.settlementPOC || 'N/A'}</div></div>
                <div class="row"><div class="label">Payment Date:</div><div class="value">${formatDate(formData.settlementDate) || 'TBD'}<span class="settlement-method">${formData.settlementMethod}</span></div></div>
                <div class="row"><div class="label">Amount Received:</div><div class="value">$${parseFloat(formData.settlementAmount || 0).toLocaleString()}</div></div>
              </div>

              <div class="financial-box">
                <div class="section-title">FINANCIAL BREAKDOWN</div>
                <div class="row"><div class="label">Broker Compensation:</div><div class="value">$${getBrokerCompensation().toLocaleString()}</div></div>
                <div class="row"><div class="label">Money Received:</div><div class="value">${formData.settlementAmount ? `$${parseFloat(formData.settlementAmount).toLocaleString()}` : 'Pending'}</div></div>
                ${formData.settlementAmount && Math.abs(calculateDiscrepancy()) > 0.01 ? `
                <div class="row"><div class="label">Discrepancy:</div><div class="value ${calculateDiscrepancy() > 0 ? 'discrepancy-positive' : 'discrepancy-negative'}">${calculateDiscrepancy() > 0 ? '+' : ''}$${calculateDiscrepancy().toLocaleString()}</div></div>
                ` : ''}
              </div>
            </div>
            
            <div class="right-column">
              <div class="payout-summary">
                <div class="section-title">LOAN OFFICER PAYOUT</div>
                <div class="row"><div class="label">LO Name:</div><div class="value">${loanOfficer?.name || 'TBD'}</div></div>
                <div class="row"><div class="label">Base Commission (${formData.loCommissionPercentage}%):</div><div class="value">$${calculateLOBaseCommission().toLocaleString()}</div></div>
                
                ${formData.loReimbursements.length > 0 ? `
                <div style="margin-top: 10px; margin-bottom: 5px; font-weight: bold;">Reimbursements:</div>
                ${formData.loReimbursements.map(item => `
                <div class="adjustment-item">
                  <div class="adjustment-description">${item.description}</div>
                  <div class="adjustment-amount adjustment-positive">+$${parseFloat(item.amount || 0).toLocaleString()}</div>
                </div>
                `).join('')}
                <div class="adjustment-item" style="border-top: 1px solid #ddd; padding-top: 5px;">
                  <div class="adjustment-description">Total Reimbursements:</div>
                  <div class="adjustment-amount adjustment-positive">+$${calculateTotalReimbursements().toLocaleString()}</div>
                </div>
                ` : ''}
                
                ${formData.loDeductions.length > 0 ? `
                <div style="margin-top: 15px; margin-bottom: 5px; font-weight: bold;">Deductions:</div>
                ${formData.loDeductions.map(item => `
                <div class="adjustment-item">
                  <div class="adjustment-description">${item.description}</div>
                  <div class="adjustment-amount adjustment-negative">-$${parseFloat(item.amount || 0).toLocaleString()}</div>
                </div>
                `).join('')}
                <div class="adjustment-item" style="border-top: 1px solid #ddd; padding-top: 5px;">
                  <div class="adjustment-description">Total Deductions:</div>
                  <div class="adjustment-amount adjustment-negative">-$${calculateTotalDeductions().toLocaleString()}</div>
                </div>
                ` : ''}

                ${calculateLODiscrepancyAllocation() > 0 ? `
                <div style="margin-top: 15px; margin-bottom: 5px; font-weight: bold;">Discrepancy Allocation:</div>
                ${formData.discrepancyAllocations
                  .filter(item => item.allocationType === 'loan_officer')
                  .map(item => `
                  <div class="adjustment-item">
                    <div class="adjustment-description">${item.description}</div>
                    <div class="adjustment-amount adjustment-positive">+$${parseFloat(item.amount || 0).toLocaleString()}</div>
                  </div>
                `).join('')}
                <div class="adjustment-item" style="border-top: 1px solid #ddd; padding-top: 5px;">
                  <div class="adjustment-description">Total Allocation:</div>
                  <div class="adjustment-amount adjustment-positive">+$${calculateLODiscrepancyAllocation().toLocaleString()}</div>
                </div>
                ` : ''}
                
                <div class="row" style="font-size: 16px; font-weight: bold; margin-top: 15px; border-top: 2px solid ${cdaColor}40; padding-top: 10px;">
                  <div class="label">FINAL LO PAYOUT:</div>
                  <div class="value">$${calculateLOFinalPayout().toLocaleString()}</div>
                </div>
                <div class="row"><div class="label">Payment Date:</div><div class="value">${formatDate(formData.datePaidLO) || 'Pending'}</div></div>
              </div>

              <div class="final-summary-box">
                <div class="final-summary-title">FINAL PAYMENT SUMMARY</div>
                <div class="final-summary-row">
                  <div>Total Money Received:</div>
                  <div>${formData.settlementAmount ? `$${parseFloat(formData.settlementAmount).toLocaleString()}` : 'Pending'}</div>
                </div>
                <div class="final-summary-row">
                  <div>Loan Officer Payout:</div>
                  <div>$${calculateLOFinalPayout().toLocaleString()}</div>
                </div>
                ${formData.realtorPartnerCommission ? `
                <div class="final-summary-row">
                  <div>Realtor Partner:</div>
                  <div>$${parseFloat(formData.realtorPartnerCommission).toLocaleString()}</div>
                </div>
                ` : ''}
                ${calculateExpenseAllocations() > 0 ? `
                <div class="final-summary-row">
                  <div>Expense Allocations:</div>
                  <div>$${calculateExpenseAllocations().toLocaleString()}</div>
                </div>
                ` : ''}
                <div class="final-summary-row final-summary-total">
                  <div>COMPANY PROFIT:</div>
                  <div>$${calculateCompanyProfit().toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="signatures">
            <div><div class="signature-line">Authorized By</div></div>
            <div><div class="signature-line">Date</div></div>
            <div><div class="signature-line">LO Acknowledgment</div></div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Export CDA as PDF
  const exportCDAasPDF = () => {
    alert("To export as PDF, please use the Print function and select 'Save as PDF' in your browser's print dialog.");
    printCDA();
  };

  const tabs = [
    { id: 'client', label: 'Client Info', icon: FiUser },
    { id: 'loan', label: 'Loan Details', icon: FiDollarSign },
    { id: 'property', label: 'Property & Realtor', icon: FiHome },
    { id: 'settlement', label: 'Settlement', icon: FiBuilding },
    { id: 'status', label: 'Status & Timeline', icon: FiCalendar },
    { id: 'commission', label: 'Commission & Payments', icon: FiDollarSign },
    { id: 'audit', label: 'Audit Checklist', icon: FiClipboard },
    { id: 'notes', label: 'Notes', icon: FiFileText }
  ];

  const discrepancy = calculateDiscrepancy();
  const hasDiscrepancy = Math.abs(discrepancy) > 0.01 && formData.settlementAmount;
  const isDiscrepancyResolved = hasDiscrepancy && Math.abs(discrepancy - calculateTotalAllocations()) <= 0.01;

  // Calculate audit completion percentage
  const auditItems = Object.values(formData.auditChecklist);
  const completedItems = auditItems.filter(Boolean).length;
  const auditCompletionPercentage = (completedItems / auditItems.length) * 100;

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
              onClick={() => handleNavigation('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to transactions"
            >
              <SafeIcon icon={FiArrowLeft} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Transaction' : 'New Transaction'}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {successMessage && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {successMessage}
              </span>
            )}
            <button
              onClick={() => {
                if (handleSubmit()) {
                  // Don't navigate away, just save
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              title="Save changes"
            >
              <SafeIcon icon={FiSave} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={generateCDA}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              title="Generate CDA"
            >
              <SafeIcon icon={FiDownload} />
              <span className="hidden sm:inline">CDA</span>
            </button>
            <button
              onClick={() => handleNavigation('/')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-2 rounded-lg flex items-center"
              title="Close transaction"
            >
              <SafeIcon icon={FiX} />
            </button>
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
                {tab.id === 'settlement' && hasDiscrepancy && !isDiscrepancyResolved && (
                  <div className="ml-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
                {tab.id === 'audit' && auditCompletionPercentage > 0 && (
                  <div className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {Math.round(auditCompletionPercentage)}%
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }} className="p-6 space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Number
                  </label>
                  <input
                    type="text"
                    name="loanNumber"
                    value={formData.loanNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="LN-2024-001234"
                  />
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Broker Compensation ($) *
                  </label>
                  <input
                    type="number"
                    name="brokerCompensation"
                    value={formData.brokerCompensation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="11250"
                    min="0"
                    step="0.01"
                    required
                  />
                  {formData.loanAmount && formData.brokerCompensation && (
                    <p className="text-xs text-gray-500 mt-1">
                      ({calculateBrokerCompensationPercent().toFixed(2)}% of loan amount)
                    </p>
                  )}
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
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Realtor Name
                  </label>
                  <input
                    type="text"
                    name="realtor"
                    value={formData.realtor}
                    onChange={handleRealtorChange}
                    onBlur={() => setTimeout(() => setShowRealtorSuggestions(false), 200)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                  {showRealtorSuggestions && realtorSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {realtorSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => selectRealtorSuggestion(suggestion)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{suggestion.name}</div>
                          {suggestion.company && (
                            <div className="text-sm text-gray-500">{suggestion.company}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Realtor Company
                  </label>
                  <input
                    type="text"
                    name="realtorCompany"
                    value={formData.realtorCompany}
                    onChange={handleRealtorCompanyChange}
                    onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC Realty"
                  />
                  {showCompanySuggestions && realtorCompanySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {realtorCompanySuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => selectCompanySuggestion(suggestion)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{suggestion.company}</div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settlement Tab */}
          {activeTab === 'settlement' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Settlement Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Settlement Company
                  </label>
                  <input
                    type="text"
                    name="settlementCompany"
                    value={formData.settlementCompany}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC Title Company"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Point of Contact (POC)
                  </label>
                  <input
                    type="text"
                    name="settlementPOC"
                    value={formData.settlementPOC}
                    onChange={handleSettlementPOCChange}
                    onBlur={() => setTimeout(() => setShowSettlementSuggestions(false), 200)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {showSettlementSuggestions && settlementSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {settlementSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => selectSettlementSuggestion(suggestion)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{suggestion.name}</div>
                          {suggestion.company && (
                            <div className="text-sm text-gray-500">{suggestion.company}</div>
                          )}
                          {suggestion.email && (
                            <div className="text-xs text-blue-500">{suggestion.email}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <div className="flex items-center">
                    <SafeIcon icon={FiMail} className="text-gray-400 mr-2" />
                    <input
                      type="email"
                      name="settlementEmail"
                      value={formData.settlementEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@abctitle.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <div className="flex items-center">
                    <SafeIcon icon={FiPhone} className="text-gray-400 mr-2" />
                    <input
                      type="tel"
                      name="settlementPhone"
                      value={formData.settlementPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Received ($)
                    </label>
                    <input
                      type="number"
                      name="settlementAmount"
                      value={formData.settlementAmount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="11250"
                      min="0"
                      step="0.01"
                    />
                    {formData.brokerCompensation && formData.settlementAmount && (
                      <div className="mt-2">
                        {Math.abs(calculateDiscrepancy()) > 0.01 ? (
                          <p className={`text-sm font-medium ${discrepancy > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {discrepancy > 0 ? 'Over payment' : 'Under payment'} by ${Math.abs(discrepancy).toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-green-600">
                            Exact payment amount
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      name="settlementDate"
                      value={formData.settlementDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      name="settlementMethod"
                      value={formData.settlementMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Wire">Wire</option>
                      <option value="ACH">ACH</option>
                      <option value="Check">Check</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {hasDiscrepancy && !isDiscrepancyResolved && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <SafeIcon icon={FiAlertTriangle} className="text-orange-600" />
                    <h4 className="font-medium text-orange-800">Payment Discrepancy Detected</h4>
                  </div>
                  <div className="text-sm text-orange-700">
                    <p><strong>Expected (Broker Compensation):</strong> ${getBrokerCompensation().toLocaleString()}</p>
                    <p><strong>Actual (Money Received):</strong> ${parseFloat(formData.settlementAmount).toLocaleString()}</p>
                    <p><strong>Discrepancy:</strong> 
                      <span className={`font-medium ${discrepancy > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {discrepancy > 0 ? ' +' : ' '}${discrepancy.toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-2 italic">
                      Please allocate this discrepancy in the Commission & Payments section before saving.
                    </p>
                  </div>

                  {/* Discrepancy Allocation Section */}
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-orange-800">
                        Allocate Discrepancy
                      </h5>
                      <button
                        type="button"
                        onClick={addDiscrepancyAllocation}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <SafeIcon icon={FiPlus} className="text-xs" />
                        <span>Add Allocation</span>
                      </button>
                    </div>
                    
                    {formData.discrepancyAllocations.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 mb-2">
                        <select
                          value={item.allocationType}
                          onChange={(e) => updateDiscrepancyAllocation(item.id, 'allocationType', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="company">Company</option>
                          <option value="loan_officer">Loan Officer</option>
                          <option value="expense">Expense</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateDiscrepancyAllocation(item.id, 'description', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => updateDiscrepancyAllocation(item.id, 'amount', e.target.value)}
                          className="w-24 sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.01"
                        />
                        <button
                          type="button"
                          onClick={() => removeDiscrepancyAllocation(item.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    ))}
                    
                    {formData.discrepancyAllocations.length > 0 && (
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isDiscrepancyResolved ? 'text-green-600' : 'text-red-600'}`}>
                          Total Allocated: ${calculateTotalAllocations().toLocaleString()}
                        </p>
                        <p className={`text-xs ${isDiscrepancyResolved ? 'text-green-500' : 'text-red-500'}`}>
                          Remaining: ${(Math.abs(discrepancy) - calculateTotalAllocations()).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Settlement Notes
                </label>
                <textarea
                  name="settlementNotes"
                  value={formData.settlementNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional settlement information, payment method, etc."
                />
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
              
              {/* Commission Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Commission Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Broker Compensation</p>
                    <p className="text-xl font-bold text-green-600">${getBrokerCompensation().toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Money Received</p>
                    <p className="text-xl font-bold text-blue-600">
                      ${formData.settlementAmount ? parseFloat(formData.settlementAmount).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">LO Final Payout</p>
                    <p className="text-xl font-bold text-purple-600">${calculateLOFinalPayout().toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Company Profit</p>
                    <p className={`text-xl font-bold ${calculateCompanyProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${calculateCompanyProfit().toLocaleString()}
                    </p>
                  </div>
                </div>
                {hasDiscrepancy && (
                  <div className="mt-3 p-3 bg-orange-100 rounded border border-orange-300">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={isDiscrepancyResolved ? FiCheckCircle : FiAlertTriangle} 
                               className={`${isDiscrepancyResolved ? 'text-green-600' : 'text-orange-600'}`} />
                      <p className="text-sm font-medium text-orange-800">
                        Discrepancy: {discrepancy > 0 ? '+' : ''}${discrepancy.toLocaleString()}
                        {isDiscrepancyResolved && ' (Resolved)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Discrepancy Allocation Section */}
              {hasDiscrepancy && (
                <div className={`p-4 rounded-lg border ${isDiscrepancyResolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className={`font-medium ${isDiscrepancyResolved ? 'text-green-800' : 'text-red-800'}`}>
                      Discrepancy Allocation {isDiscrepancyResolved ? '(Resolved)' : 'Required'}
                    </h5>
                    <button
                      type="button"
                      onClick={addDiscrepancyAllocation}
                      className={`${isDiscrepancyResolved ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white px-3 py-1 rounded text-sm flex items-center space-x-1`}
                    >
                      <SafeIcon icon={FiPlus} className="text-xs" />
                      <span>Add Allocation</span>
                    </button>
                  </div>
                  <p className={`text-sm ${isDiscrepancyResolved ? 'text-green-700' : 'text-red-700'} mb-4`}>
                    {isDiscrepancyResolved ? 
                      `The ${Math.abs(discrepancy).toLocaleString()} discrepancy has been properly allocated.` :
                      `You must allocate the ${Math.abs(discrepancy).toLocaleString()} discrepancy before saving this transaction.`
                    }
                  </p>
                  {formData.discrepancyAllocations.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 mb-2">
                      <select
                        value={item.allocationType}
                        onChange={(e) => updateDiscrepancyAllocation(item.id, 'allocationType', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="company">Company</option>
                        <option value="loan_officer">Loan Officer</option>
                        <option value="expense">Expense</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Description (e.g., Settlement fee adjustment)"
                        value={item.description}
                        onChange={(e) => updateDiscrepancyAllocation(item.id, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateDiscrepancyAllocation(item.id, 'amount', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => removeDiscrepancyAllocation(item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  ))}
                  {formData.discrepancyAllocations.length > 0 && (
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isDiscrepancyResolved ? 'text-green-600' : 'text-red-600'}`}>
                        Total Allocated: ${calculateTotalAllocations().toLocaleString()}
                      </p>
                      <p className={`text-xs ${isDiscrepancyResolved ? 'text-green-500' : 'text-red-500'}`}>
                        Remaining: ${(Math.abs(discrepancy) - calculateTotalAllocations()).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Loan Officer Commission Setup */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Loan Officer Commission</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LO Commission Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="loCommissionPercentage"
                      value={formData.loCommissionPercentage}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="60"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Base Commission Amount</p>
                    <p className="text-lg font-bold text-blue-600">${calculateLOBaseCommission().toLocaleString()}</p>
                  </div>
                </div>

                {/* Reimbursements Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-800">Reimbursements to LO</h5>
                    <button
                      type="button"
                      onClick={addReimbursement}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <SafeIcon icon={FiPlus} className="text-xs" />
                      <span>Add</span>
                    </button>
                  </div>
                  {formData.loReimbursements.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Description (e.g., Credit Report)"
                        value={item.description}
                        onChange={(e) => updateReimbursement(item.id, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateReimbursement(item.id, 'amount', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => removeReimbursement(item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  ))}
                  {formData.loReimbursements.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        Total Reimbursements: ${calculateTotalReimbursements().toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Deductions Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-800">Deductions from LO</h5>
                    <button
                      type="button"
                      onClick={addDeduction}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <SafeIcon icon={FiPlus} className="text-xs" />
                      <span>Add</span>
                    </button>
                  </div>
                  {formData.loDeductions.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Description (e.g., Fronted Commission)"
                        value={item.description}
                        onChange={(e) => updateDeduction(item.id, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateDeduction(item.id, 'amount', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => removeDeduction(item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  ))}
                  {formData.loDeductions.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        Total Deductions: ${calculateTotalDeductions().toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Tracking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>
          )}

          {/* Audit Checklist Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Audit Checklist</h3>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Completion</div>
                  <div className="text-2xl font-bold text-blue-600">{Math.round(auditCompletionPercentage)}%</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${auditCompletionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Required Documents & Tasks</h4>
                <div className="space-y-3">
                  {[
                    { key: 'signedClosingPackage', label: 'Signed Closing Package', description: 'All closing documents signed and received' },
                    { key: 'commissionCheck', label: 'Commission Check', description: 'Commission payment received and processed' },
                    { key: 'initialDisclosures', label: 'Initial Disclosures', description: 'All required initial disclosures completed' },
                    { key: 'affiliatedBusinessDisclosure', label: 'Affiliated Business Disclosure', description: 'AfBA disclosure if applicable' },
                    { key: 'cdaGenerated', label: 'CDA Generated & Saved', description: 'Commission Disbursement Authorization created' },
                    { key: 'arivePostClosingAudit', label: 'ARIVE Post-Closing Audit', description: 'Post-closing audit completed in ARIVE system' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          id={item.key}
                          checked={formData.auditChecklist[item.key]}
                          onChange={() => handleAuditChange(item.key)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={item.key} className="flex items-center cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                          {formData.auditChecklist[item.key] && (
                            <SafeIcon icon={FiCheckCircle} className="ml-2 text-green-500" />
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {auditCompletionPercentage === 100 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiCheckCircle} className="text-green-600 text-xl" />
                    <div>
                      <h4 className="font-medium text-green-800">Audit Complete!</h4>
                      <p className="text-sm text-green-700">All required documents and tasks have been completed.</p>
                    </div>
                  </div>
                </div>
              )}
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

          {/* Tab Navigation */}
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
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleNavigation('/')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-3 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>Cancel</span>
              </motion.button>
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
          </div>
        </form>
      </motion.div>

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiAlertTriangle} className="text-orange-600 text-xl" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Discrepancy Detected</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Discrepancy Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected (Broker Compensation):</span>
                    <span className="font-medium">${getBrokerCompensation().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actual (Money Received):</span>
                    <span className="font-medium">${parseFloat(formData.settlementAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Discrepancy:</span>
                    <span className={`font-bold ${discrepancy > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {discrepancy > 0 ? '+' : ''}${discrepancy.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Allocate Discrepancy</h3>
                  <button
                    type="button"
                    onClick={addDiscrepancyAllocation}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiPlus} className="text-xs" />
                    <span>Add Allocation</span>
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Please specify how the ${Math.abs(discrepancy).toLocaleString()} discrepancy should be allocated:
                </p>

                {formData.discrepancyAllocations.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 mb-3 p-3 border border-gray-200 rounded-lg">
                    <select
                      value={item.allocationType}
                      onChange={(e) => updateDiscrepancyAllocation(item.id, 'allocationType', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="company">Company</option>
                      <option value="loan_officer">Loan Officer</option>
                      <option value="expense">Expense</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Description (e.g., Title company fee adjustment)"
                      value={item.description}
                      onChange={(e) => updateDiscrepancyAllocation(item.id, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => updateDiscrepancyAllocation(item.id, 'amount', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                    />
                    <button
                      type="button"
                      onClick={() => removeDiscrepancyAllocation(item.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <SafeIcon icon={FiTrash2} />
                    </button>
                  </div>
                ))}

                {formData.discrepancyAllocations.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Allocated:</span>
                      <span className="font-medium">${calculateTotalAllocations().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining to Allocate:</span>
                      <span className={`font-medium ${Math.abs(discrepancy) - calculateTotalAllocations() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(Math.abs(discrepancy) - calculateTotalAllocations()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDiscrepancyModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscrepancyModalSubmit}
                disabled={Math.abs(Math.abs(discrepancy) - calculateTotalAllocations()) > 0.01}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Transaction
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CDA Modal */}
      {showCDAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h2 className="text-xl font-semibold text-gray-900">Commission Disbursement Authorization</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-gray-700">
                Generate a Commission Disbursement Authorization (CDA) document for this transaction.
                This document provides a comprehensive summary of all financial details.
              </p>
              
              <div className="space-y-4">
                <div className="border border-gray-200 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose CDA Color Theme
                  </label>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setCdaColor('#3b82f6')} 
                      className={`w-8 h-8 rounded-full bg-blue-500 ${cdaColor === '#3b82f6' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      title="Blue"
                    />
                    <button 
                      onClick={() => setCdaColor('#10b981')} 
                      className={`w-8 h-8 rounded-full bg-green-500 ${cdaColor === '#10b981' ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
                      title="Green"
                    />
                    <button 
                      onClick={() => setCdaColor('#8b5cf6')} 
                      className={`w-8 h-8 rounded-full bg-purple-500 ${cdaColor === '#8b5cf6' ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                      title="Purple"
                    />
                    <button 
                      onClick={() => setCdaColor('#ef4444')} 
                      className={`w-8 h-8 rounded-full bg-red-500 ${cdaColor === '#ef4444' ? 'ring-2 ring-offset-2 ring-red-500' : ''}`}
                      title="Red"
                    />
                    <button 
                      onClick={() => setCdaColor('#f59e0b')} 
                      className={`w-8 h-8 rounded-full bg-yellow-500 ${cdaColor === '#f59e0b' ? 'ring-2 ring-offset-2 ring-yellow-500' : ''}`}
                      title="Yellow"
                    />
                  </div>
                </div>
                
                <button
                  onClick={printCDA}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 w-full"
                >
                  <SafeIcon icon={FiPrinter} />
                  <span>Print CDA</span>
                </button>
                
                <button
                  onClick={exportCDAasPDF}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 w-full"
                >
                  <SafeIcon icon={FiDownload} />
                  <span>Export as PDF</span>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCDAModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiAlertTriangle} className="text-red-600 text-xl" />
                <h2 className="text-xl font-semibold text-gray-900">Unsaved Changes</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                You have unsaved changes. Are you sure you want to leave this page?
                All your changes will be lost.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowExitConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormModified(false);
                  navigate(typeof showExitConfirmation === 'string' ? showExitConfirmation : '/');
                  setShowExitConfirmation(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Leave Without Saving
              </button>
              <button
                type="button"
                onClick={() => {
                  if (handleSubmit()) {
                    navigate(typeof showExitConfirmation === 'string' ? showExitConfirmation : '/');
                    setShowExitConfirmation(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save & Leave
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default TransactionForm;