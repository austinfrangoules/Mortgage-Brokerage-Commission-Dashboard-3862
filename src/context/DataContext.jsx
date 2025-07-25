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
      notes: 'Top performer with excellent customer service'
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
      notes: 'Specializes in high-value transactions'
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
      notes: 'Rural lending expert'
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
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      // Sample data with enhanced commission tracking fields
      const sampleTransactions = [
        {
          id: 1,
          clientName: 'Robert & Lisa Anderson',
          loanOfficerId: 1,
          loanAmount: 450000,
          loanType: 'Conventional',
          purpose: 'Purchase',
          commissionRate: 2.5,
          commissionAmount: 11250,
          loCommission: 6750,
          companyProfit: 4500,
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
          settlementAgent: 'Denver Title Company',
          datePaidLO: '2024-03-05',
          dateWePaid: '2024-03-01',
          notes: 'First-time homebuyers, smooth transaction'
        },
        {
          id: 2,
          clientName: 'Jennifer Martinez',
          loanOfficerId: 2,
          loanAmount: 325000,
          loanType: 'FHA',
          purpose: 'Refinance',
          commissionRate: 2.25,
          commissionAmount: 7312.50,
          loCommission: 4387.50,
          companyProfit: 2925,
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
          settlementAgent: 'Boulder Title Services',
          datePaidLO: '',
          dateWePaid: '',
          notes: 'Credit issues being resolved'
        },
        {
          id: 3,
          clientName: 'Michael & Susan Taylor',
          loanOfficerId: 3,
          loanAmount: 550000,
          loanType: 'VA',
          purpose: 'Purchase',
          commissionRate: 2.75,
          commissionAmount: 15125,
          loCommission: 9075,
          companyProfit: 4537.50,
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
          settlementAgent: 'Fort Collins Title',
          datePaidLO: '',
          dateWePaid: '',
          notes: 'Military veteran, VA loan. John Smith is our LO and realtor partner'
        },
        {
          id: 4,
          clientName: 'Thomas & Emily Wilson',
          loanOfficerId: 1,
          loanAmount: 625000,
          loanType: 'Jumbo',
          purpose: 'Purchase',
          commissionRate: 3.0,
          commissionAmount: 18750,
          loCommission: 11250,
          companyProfit: 7500,
          realtorPartnerCommission: 0,
          isRealtorPartner: false,
          realtorPartnerId: null,
          status: 'Closed',
          applicationDate: '2024-01-05',
          closingDate: '2024-02-10',
          property: '101 Ridge View Road, Aspen, CO',
          rate: 7.0,
          referralSourceId: 5,
          lenderId: 2,
          realtor: 'Christopher Green',
          realtorCompany: 'Luxury Mountain Homes',
          settlementAgent: 'Mountain Title Agency',
          datePaidLO: '2024-02-20',
          dateWePaid: '2024-02-15',
          notes: 'Luxury property, high-net-worth clients'
        },
        {
          id: 5,
          clientName: 'Daniel Brown',
          loanOfficerId: 2,
          loanAmount: 275000,
          loanType: 'USDA',
          purpose: 'Purchase',
          commissionRate: 2.25,
          commissionAmount: 6187.50,
          loCommission: 3712.50,
          companyProfit: 2475,
          realtorPartnerCommission: 0,
          isRealtorPartner: false,
          realtorPartnerId: null,
          status: 'In Process',
          applicationDate: '2024-02-20',
          closingDate: null,
          property: '555 Rural Road, Greeley, CO',
          rate: 6.25,
          referralSourceId: 6,
          lenderId: 3,
          realtor: 'Patricia Johnson',
          realtorCompany: 'Rural Properties',
          settlementAgent: 'Weld County Title',
          datePaidLO: '',
          dateWePaid: '',
          notes: 'Rural property, first-time homebuyer'
        }
      ];
      setTransactions(sampleTransactions);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mortgage_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      commissionAmount: calculateCommission(transaction)
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const updateTransaction = (id, updatedTransaction) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === parseInt(id)
          ? {
              ...updatedTransaction,
              id: parseInt(id),
              commissionAmount: calculateCommission(updatedTransaction)
            }
          : t
      )
    );
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Calculate commission without processing and appraisal fees as requested
  const calculateCommission = (transaction) => {
    const baseCommission = (transaction.loanAmount * transaction.commissionRate) / 100;
    return baseCommission;
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

  const value = {
    transactions,
    loanOfficers,
    referralSources,
    lenders,
    goals,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    calculateCommission,
    addGoal,
    updateGoal,
    deleteGoal,
    addLender,
    updateLender,
    deleteLender,
    addLoanOfficer,
    updateLoanOfficer,
    deleteLoanOfficer
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}