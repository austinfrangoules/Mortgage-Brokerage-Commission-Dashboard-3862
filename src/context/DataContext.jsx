import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loanOfficers, setLoanOfficers] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john@company.com',
      phone: '(555) 123-4567',
      nmlsNumber: '123456',
      licenseStates: ['CO', 'WY', 'NM'],
      monthlyGoal: 50000,
      yearlyGoal: 600000,
      hireDate: '2022-01-15',
      specialties: ['First-Time Homebuyers', 'VA Loans', 'FHA Loans'],
      notes: 'Top performer with excellent customer service',
      permissions: {
        dashboard: { view: true, edit: false },
        transactions: { view: true, edit: true, delete: false, create: true },
        statistics: { view: true, export: false },
        lenders: { view: true, edit: false, delete: false, create: false },
        goals: { view: true, edit: true, delete: true, create: true },
        contacts: { view: true, edit: true, delete: true, create: true },
        profile: { view: true, edit: true },
        payments: { view: true }
      }
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      phone: '(555) 234-5678',
      nmlsNumber: '234567',
      licenseStates: ['CO', 'UT'],
      monthlyGoal: 45000,
      yearlyGoal: 540000,
      hireDate: '2021-06-01',
      specialties: ['Investment Properties', 'Jumbo Loans'],
      notes: 'Specializes in high-value transactions',
      permissions: {
        dashboard: { view: true, edit: false },
        transactions: { view: true, edit: true, delete: false, create: true },
        statistics: { view: true, export: true },
        lenders: { view: true, edit: true, delete: false, create: true },
        goals: { view: true, edit: true, delete: true, create: true },
        contacts: { view: true, edit: true, delete: true, create: true },
        profile: { view: true, edit: true },
        payments: { view: true }
      }
    },
    {
      id: 3,
      name: 'Mike Davis',
      email: 'mike@company.com',
      phone: '(555) 345-6789',
      nmlsNumber: '345678',
      licenseStates: ['CO', 'KS', 'NE'],
      monthlyGoal: 40000,
      yearlyGoal: 480000,
      hireDate: '2023-03-10',
      specialties: ['USDA Loans', 'Construction Loans'],
      notes: 'Rural lending expert',
      permissions: {
        dashboard: { view: true, edit: false },
        transactions: { view: true, edit: true, delete: false, create: true },
        statistics: { view: true, export: false },
        lenders: { view: true, edit: false, delete: false, create: false },
        goals: { view: true, edit: true, delete: true, create: true },
        contacts: { view: true, edit: true, delete: true, create: true },
        profile: { view: true, edit: true },
        payments: { view: true }
      }
    }
  ]);

  // Admin users state
  const [adminUsers, setAdminUsers] = useState([
    {
      id: 1,
      name: 'Jennifer Martinez',
      email: 'jennifer@company.com',
      phone: '(555) 111-0000',
      role: 'super_admin',
      department: 'Operations',
      hireDate: '2020-03-15',
      notes: 'Company founder and lead administrator',
      permissions: {
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
      }
    },
    {
      id: 2,
      name: 'Robert Chen',
      email: 'robert@company.com',
      phone: '(555) 222-0000',
      role: 'admin',
      department: 'Compliance',
      hireDate: '2021-07-20',
      notes: 'Handles compliance and regulatory matters',
      permissions: {
        dashboard: { view: true, edit: false },
        transactions: { view: true, edit: true, delete: false, create: false },
        statistics: { view: true, export: true },
        lenders: { view: true, edit: true, delete: false, create: true },
        goals: { view: true, edit: false, delete: false, create: false },
        contacts: { view: true, edit: true, delete: false, create: true },
        loanOfficers: { view: true, edit: false, delete: false, create: false },
        payments: { view: true, edit: false, process: false },
        settings: { view: true, edit: false },
        reports: { view: true, export: true, schedule: false }
      }
    },
    {
      id: 3,
      name: 'Lisa Thompson',
      email: 'lisa@company.com',
      phone: '(555) 333-0000',
      role: 'manager',
      department: 'Processing',
      hireDate: '2022-01-10',
      notes: 'Manages loan processing team and workflows',
      permissions: {
        dashboard: { view: true, edit: false },
        transactions: { view: true, edit: true, delete: false, create: true },
        statistics: { view: true, export: false },
        lenders: { view: true, edit: false, delete: false, create: false },
        goals: { view: true, edit: true, delete: false, create: true },
        contacts: { view: true, edit: true, delete: false, create: true },
        loanOfficers: { view: true, edit: false, delete: false, create: false },
        payments: { view: true, edit: false, process: false },
        settings: { view: false, edit: false },
        reports: { view: true, export: false, schedule: false }
      }
    }
  ]);

  // Enhanced referral sources
  const [referralSources, setReferralSources] = useState([
    { id: 1, name: 'Realtor Referral' },
    { id: 2, name: 'Past Client' },
    { id: 3, name: 'Friend/Family' },
    { id: 4, name: 'Online Lead' },
    { id: 5, name: 'Direct Marketing' },
    { id: 6, name: 'Builder' }
  ]);

  // Updated lenders with new field structure
  const [lenders, setLenders] = useState([
    {
      id: 1,
      name: 'ABC Mortgage',
      accountExecutive: 'John Williams',
      contactNumber: '(555) 111-2222',
      aeEmail: 'jwilliams@abcmortgage.com',
      website: 'www.abcmortgage.com',
      loanTypes: ['Conventional', 'FHA', 'VA'],
      brokerCompPercentage: 2.5,
      flatFeeAmount: 1000,
      isInArive: true,
      isVaApproved: true,
      notes: 'Good for first-time homebuyers, quick closing times'
    },
    {
      id: 2,
      name: 'XYZ Lending',
      accountExecutive: 'Mary Johnson',
      contactNumber: '(555) 333-4444',
      aeEmail: 'mjohnson@xyzlending.com',
      website: 'www.xyzlending.com',
      loanTypes: ['Jumbo', 'Construction'],
      brokerCompPercentage: 3.0,
      flatFeeAmount: 1500,
      isInArive: false,
      isVaApproved: false,
      notes: 'Specializes in jumbo loans and new construction'
    },
    {
      id: 3,
      name: 'First National Bank',
      accountExecutive: 'Robert Brown',
      contactNumber: '(555) 555-6666',
      aeEmail: 'rbrown@firstnational.com',
      website: 'www.firstnational.com',
      loanTypes: ['Conventional', 'USDA', 'FHA'],
      brokerCompPercentage: 2.25,
      flatFeeAmount: 750,
      isInArive: true,
      isVaApproved: true,
      notes: 'Good rates for rural properties and USDA loans'
    }
  ]);

  // Realtor contacts for suggestions
  const [realtorContacts, setRealtorContacts] = useState([]);

  // Settlement contacts for suggestions
  const [settlementContacts, setSettlementContacts] = useState([]);

  // Goals tracking
  const [goals, setGoals] = useState([
    {
      id: 1,
      loanOfficerId: 1,
      type: 'volume', // volume, commission, units
      period: 'monthly', // weekly, monthly, yearly
      target: 2000000,
      loanTypes: ['Conventional', 'FHA'],
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    {
      id: 2,
      loanOfficerId: 1,
      type: 'commission',
      period: 'yearly',
      target: 600000,
      loanTypes: [],
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    {
      id: 3,
      loanOfficerId: 2,
      type: 'units',
      period: 'monthly',
      target: 8,
      loanTypes: ['VA', 'FHA'],
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }
  ]);

  useEffect(() => {
    const savedTransactions = localStorage.getItem('mortgage_transactions');
    const savedRealtorContacts = localStorage.getItem('realtor_contacts');
    const savedSettlementContacts = localStorage.getItem('settlement_contacts');

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      // Sample data with enhanced commission tracking fields including discrepancy handling
      const sampleTransactions = [
        {
          id: 1,
          clientName: 'Robert & Lisa Anderson',
          loanOfficerId: 1,
          loanAmount: 450000,
          loanNumber: 'LN-2024-001234',
          loanType: 'Conventional',
          purpose: 'Purchase',
          brokerCompensation: 11250, // Changed from commissionRate to brokerCompensation as dollar amount
          settlementAmount: 11351, // $101 more than expected
          loCommissionPercentage: 60,
          loReimbursements: [
            { id: 1, description: 'Credit Report', amount: 101 },
            { id: 2, description: 'Appraisal Review', amount: 50 }
          ],
          loDeductions: [],
          discrepancyAllocations: [
            { id: 1, description: 'Title company bonus', amount: 101, allocationType: 'company' }
          ],
          loFinalPayout: 6901, // 60% of 11250 + 151 reimbursements
          companyProfit: 4449, // Includes the $101 bonus
          realtorPartnerCommission: 0,
          isRealtorPartner: false,
          realtorPartnerId: null,
          status: 'Closed',
          applicationDate: '2024-01-15',
          closingDate: '2024-02-28',
          property: '123 Oak Street, Denver, CO',
          rate: 6.75,
          referralSourceId: 1,
          lenderId: 2,
          realtor: 'Jane Wilson',
          realtorCompany: 'Colorado Homes',
          settlementCompany: 'Denver Title Company',
          settlementPOC: 'Mike Thompson',
          settlementEmail: 'mthompson@denvertitle.com',
          settlementPhone: '(303) 555-1234',
          settlementMethod: 'Wire',
          settlementDate: '2024-03-01',
          settlementNotes: 'Quick closing, bonus paid for efficiency',
          datePaidLO: '2024-03-05',
          auditChecklist: {
            signedClosingPackage: true,
            commissionCheck: true,
            initialDisclosures: true,
            affiliatedBusinessDisclosure: false,
            cdaGenerated: true,
            arivePostClosingAudit: true
          },
          notes: 'First-time homebuyers, smooth transaction. Title company gave bonus for quick closing.'
        },
        {
          id: 2,
          clientName: 'Jennifer Martinez',
          loanOfficerId: 2,
          loanAmount: 325000,
          loanNumber: 'LN-2024-002345',
          loanType: 'FHA',
          purpose: 'Refinance',
          brokerCompensation: 7312.50, // Direct dollar amount
          settlementAmount: 7162.50, // $150 less than expected
          loCommissionPercentage: 65,
          loReimbursements: [],
          loDeductions: [
            { id: 1, description: 'Fronted Commission', amount: 200 }
          ],
          discrepancyAllocations: [
            { id: 1, description: 'Settlement company deduction for late docs', amount: 150, allocationType: 'expense' }
          ],
          loFinalPayout: 4553.13, // 65% of 7312.50 - 200 deduction
          companyProfit: 2409.37, // Reduced by the $150 expense
          realtorPartnerCommission: 0,
          isRealtorPartner: false,
          realtorPartnerId: null,
          status: 'In Process',
          applicationDate: '2024-02-01',
          closingDate: null,
          property: '456 Pine Avenue, Boulder, CO',
          rate: 6.50,
          referralSourceId: 3,
          lenderId: 1,
          realtor: 'Mark Johnson',
          realtorCompany: 'Boulder Realty',
          settlementCompany: 'Boulder Title Services',
          settlementPOC: 'Sarah Davis',
          settlementEmail: 'sdavis@bouldertitle.com',
          settlementPhone: '(303) 555-9876',
          settlementMethod: 'ACH',
          settlementDate: null,
          settlementNotes: 'Pending closing',
          datePaidLO: '',
          auditChecklist: {
            signedClosingPackage: false,
            commissionCheck: false,
            initialDisclosures: true,
            affiliatedBusinessDisclosure: false,
            cdaGenerated: false,
            arivePostClosingAudit: false
          },
          notes: 'Credit issues being resolved. Settlement company deducted fee for late documentation.'
        },
        {
          id: 3,
          clientName: 'Michael & Susan Taylor',
          loanOfficerId: 3,
          loanAmount: 550000,
          loanNumber: 'LN-2024-003456',
          loanType: 'VA',
          purpose: 'Purchase',
          brokerCompensation: 15125, // Direct dollar amount
          settlementAmount: 15125, // Exact match
          loCommissionPercentage: 60,
          loReimbursements: [
            { id: 1, description: 'VA Funding Fee', amount: 275 }
          ],
          loDeductions: [],
          discrepancyAllocations: [], // No discrepancy
          loFinalPayout: 9350, // 60% of 15125 + 275 reimbursement
          companyProfit: 4262.50,
          realtorPartnerCommission: 1512.50,
          isRealtorPartner: true,
          realtorPartnerId: 1,
          status: 'Approved',
          applicationDate: '2024-02-15',
          closingDate: '2024-03-30',
          property: '789 Maple Drive, Fort Collins, CO',
          rate: 6.25,
          referralSourceId: 2,
          lenderId: 3,
          realtor: 'John Smith',
          realtorCompany: 'Our Company Realty Division',
          settlementCompany: 'Fort Collins Title',
          settlementPOC: 'Lisa Brown',
          settlementEmail: 'lbrown@fortcollinstitle.com',
          settlementPhone: '(970) 555-4321',
          settlementMethod: 'Check',
          settlementDate: '2024-03-30',
          settlementNotes: 'VA loan, smooth process',
          datePaidLO: '',
          auditChecklist: {
            signedClosingPackage: false,
            commissionCheck: false,
            initialDisclosures: true,
            affiliatedBusinessDisclosure: true,
            cdaGenerated: false,
            arivePostClosingAudit: false
          },
          notes: 'Military veteran, VA loan. John Smith is our LO and realtor partner'
        }
      ];
      setTransactions(sampleTransactions);
    }

    if (savedRealtorContacts) {
      setRealtorContacts(JSON.parse(savedRealtorContacts));
    } else {
      // Initialize with some sample realtor contacts
      const sampleRealtorContacts = [
        {
          id: 1,
          name: 'Jane Wilson',
          company: 'Colorado Homes',
          email: 'jwilson@coloradohomes.com',
          phone: '(303) 555-7890',
          type: 'realtor',
          notes: 'Great to work with, specializes in Denver metro area'
        },
        {
          id: 2,
          name: 'Mark Johnson',
          company: 'Boulder Realty',
          email: 'mjohnson@boulderrealty.com',
          phone: '(303) 555-4567',
          type: 'realtor',
          notes: 'Focuses on luxury properties'
        },
        {
          id: 3,
          name: 'Sarah Miller',
          company: 'Denver Metro Realty',
          email: 'smiller@denvermetro.com',
          phone: '(303) 555-1234',
          type: 'realtor',
          notes: 'First-time homebuyer specialist'
        },
        {
          id: 4,
          name: 'Robert Garcia',
          company: 'Mountain View Properties',
          email: 'rgarcia@mvproperties.com',
          phone: '(970) 555-8901',
          type: 'realtor',
          notes: 'Good for mountain properties and vacation homes'
        },
        {
          id: 5,
          name: 'Lisa Chen',
          company: 'Colorado Homes',
          email: 'lchen@coloradohomes.com',
          phone: '(303) 555-3456',
          type: 'realtor',
          notes: 'New construction specialist'
        }
      ];
      setRealtorContacts(sampleRealtorContacts);
    }

    if (savedSettlementContacts) {
      setSettlementContacts(JSON.parse(savedSettlementContacts));
    } else {
      // Initialize with some sample settlement contacts
      const sampleSettlementContacts = [
        {
          id: 1,
          name: 'Mike Thompson',
          company: 'Denver Title Company',
          email: 'mthompson@denvertitle.com',
          phone: '(303) 555-1234',
          type: 'settlement',
          notes: 'Very responsive, quick turnaround times'
        },
        {
          id: 2,
          name: 'Sarah Davis',
          company: 'Boulder Title Services',
          email: 'sdavis@bouldertitle.com',
          phone: '(303) 555-9876',
          type: 'settlement',
          notes: 'Preferred for Boulder area transactions'
        },
        {
          id: 3,
          name: 'Lisa Brown',
          company: 'Fort Collins Title',
          email: 'lbrown@fortcollinstitle.com',
          phone: '(970) 555-4321',
          type: 'settlement',
          notes: 'Great with VA loans'
        },
        {
          id: 4,
          name: 'James Wilson',
          company: 'Denver Title Company',
          email: 'jwilson@denvertitle.com',
          phone: '(303) 555-5678',
          type: 'settlement',
          notes: 'Specializes in commercial transactions'
        },
        {
          id: 5,
          name: 'Keri Jones',
          company: 'Caplan Law Group',
          email: 'kjones@caplanlaw.com',
          phone: '(303) 555-9012',
          type: 'settlement',
          notes: 'Excellent attorney for complex transactions'
        },
        {
          id: 6,
          name: 'Lucy Lou',
          company: 'Caplan Law Group',
          email: 'llou@caplanlaw.com',
          phone: '(303) 555-3456',
          type: 'settlement',
          notes: 'Handles refinance transactions'
        }
      ];
      setSettlementContacts(sampleSettlementContacts);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mortgage_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('realtor_contacts', JSON.stringify(realtorContacts));
  }, [realtorContacts]);

  useEffect(() => {
    localStorage.setItem('settlement_contacts', JSON.stringify(settlementContacts));
  }, [settlementContacts]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      // No need to calculate commission amount as we're now storing broker compensation directly
      loFinalPayout: calculateLOFinalPayout(transaction),
      companyProfit: calculateCompanyProfit(transaction)
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const updateTransaction = (id, updatedTransaction) => {
    setTransactions(prev => prev.map(t => t.id === parseInt(id) ? {
      ...updatedTransaction,
      id: parseInt(id),
      loFinalPayout: calculateLOFinalPayout(updatedTransaction),
      companyProfit: calculateCompanyProfit(updatedTransaction)
    } : t));
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Get broker compensation (now directly stored in transaction)
  const getBrokerCompensation = (transaction) => {
    return parseFloat(transaction.brokerCompensation) || 0;
  };

  // Calculate loan officer final payout
  const calculateLOFinalPayout = (transaction) => {
    const brokerComp = getBrokerCompensation(transaction);
    const percentage = parseFloat(transaction.loCommissionPercentage) || 0;
    const baseCommission = brokerComp * (percentage / 100);

    const reimbursements = (transaction.loReimbursements || []).reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    const deductions = (transaction.loDeductions || []).reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    // Add any discrepancy allocations to loan officer
    const loDiscrepancyAllocation = (transaction.discrepancyAllocations || [])
      .filter(item => item.allocationType === 'loan_officer')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return baseCommission + reimbursements - deductions + loDiscrepancyAllocation;
  };

  // Calculate company profit
  const calculateCompanyProfit = (transaction) => {
    const brokerComp = getBrokerCompensation(transaction);
    const totalReceived = parseFloat(transaction.settlementAmount) || brokerComp;
    const loFinalPayout = calculateLOFinalPayout(transaction);
    const realtorCommission = parseFloat(transaction.realtorPartnerCommission) || 0;

    // Subtract expense allocations from discrepancy
    const expenseAllocations = (transaction.discrepancyAllocations || [])
      .filter(item => item.allocationType === 'expense')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return totalReceived - loFinalPayout - realtorCommission - expenseAllocations;
  };

  // Realtor contact management
  const addRealtorContact = (contact) => {
    const existingContact = realtorContacts.find(c =>
      c.name.toLowerCase() === contact.name.toLowerCase() &&
      c.company?.toLowerCase() === (contact.company || '').toLowerCase()
    );

    if (!existingContact) {
      setRealtorContacts(prev => [...prev, { ...contact, id: Date.now() }]);
    }
  };

  const updateRealtorContact = (id, updatedContact) => {
    setRealtorContacts(prev => prev.map(c => c.id === id ? { ...updatedContact, id } : c));
  };

  const deleteRealtorContact = (id) => {
    setRealtorContacts(prev => prev.filter(c => c.id !== id));
  };

  // Settlement contact management
  const addSettlementContact = (contact) => {
    const existingContact = settlementContacts.find(c =>
      c.name.toLowerCase() === contact.name.toLowerCase() &&
      c.company?.toLowerCase() === (contact.company || '').toLowerCase()
    );

    if (!existingContact) {
      setSettlementContacts(prev => [...prev, { ...contact, id: Date.now() }]);
    }
  };

  const updateSettlementContact = (id, updatedContact) => {
    setSettlementContacts(prev => prev.map(c => c.id === id ? { ...updatedContact, id } : c));
  };

  const deleteSettlementContact = (id) => {
    setSettlementContacts(prev => prev.filter(c => c.id !== id));
  };

  const getRealtorSuggestions = (query, type) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();

    if (type === 'realtor') {
      return realtorContacts
        .filter(contact => contact.name.toLowerCase().includes(lowerQuery))
        .slice(0, 5);
    } else if (type === 'company') {
      return realtorContacts
        .filter(contact => contact.company && contact.company.toLowerCase().includes(lowerQuery))
        .slice(0, 5);
    }

    return [];
  };

  const getSettlementSuggestions = (query) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();

    return settlementContacts
      .filter(contact => contact.name.toLowerCase().includes(lowerQuery))
      .slice(0, 5);
  };

  // Goal management
  const addGoal = (goalData) => {
    const newGoal = { ...goalData, id: Date.now() };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id, updatedGoal) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...updatedGoal, id } : g));
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Lender management
  const addLender = (lenderData) => {
    const newLender = { ...lenderData, id: Date.now() };
    setLenders(prev => [...prev, newLender]);
  };

  const updateLender = (id, updatedLender) => {
    setLenders(prev => prev.map(l => l.id === id ? { ...updatedLender, id } : l));
  };

  const deleteLender = (id) => {
    setLenders(prev => prev.filter(l => l.id !== id));
  };

  // Loan officer management
  const addLoanOfficer = (officerData) => {
    const newOfficer = { ...officerData, id: Date.now() };
    setLoanOfficers(prev => [...prev, newOfficer]);
  };

  const updateLoanOfficer = (id, updatedOfficer) => {
    setLoanOfficers(prev => prev.map(o => o.id === id ? { ...updatedOfficer, id } : o));
  };

  const deleteLoanOfficer = (id) => {
    setLoanOfficers(prev => prev.filter(o => o.id !== id));
  };

  // Admin user management
  const addAdminUser = (adminData) => {
    const newAdmin = { ...adminData, id: Date.now() };
    setAdminUsers(prev => [...prev, newAdmin]);
  };

  const updateAdminUser = (id, updatedAdmin) => {
    setAdminUsers(prev => prev.map(a => a.id === id ? { ...updatedAdmin, id } : a));
  };

  const deleteAdminUser = (id) => {
    setAdminUsers(prev => prev.filter(a => a.id !== id));
  };

  const value = {
    transactions,
    loanOfficers,
    referralSources,
    lenders,
    goals,
    realtorContacts,
    settlementContacts,
    adminUsers,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getBrokerCompensation,
    calculateLOFinalPayout,
    calculateCompanyProfit,
    addGoal,
    updateGoal,
    deleteGoal,
    addLender,
    updateLender,
    deleteLender,
    addLoanOfficer,
    updateLoanOfficer,
    deleteLoanOfficer,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    addRealtorContact,
    updateRealtorContact,
    deleteRealtorContact,
    addSettlementContact,
    updateSettlementContact,
    deleteSettlementContact,
    getRealtorSuggestions,
    getSettlementSuggestions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}