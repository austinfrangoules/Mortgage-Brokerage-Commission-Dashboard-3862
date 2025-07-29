import React from 'react';
import {HashRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Statistics from './components/Statistics';
import LoanOfficerPortal from './components/LoanOfficerPortal';
import LoanOfficerRoster from './components/LoanOfficerRoster';
import LoanOfficerPayments from './components/LoanOfficerPayments';
import LenderDirectory from './components/LenderDirectory';
import LenderProfile from './components/LenderProfile';
import Goals from './components/Goals';
import Contacts from './components/Contacts';
import Profile from './components/Profile';
import MyPayments from './components/MyPayments';
import Layout from './components/Layout';
import {AuthProvider, useAuth} from './context/AuthContext';
import {DataProvider} from './context/DataContext';

function AppContent() {
  const {user, loading} = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          animate={{rotate: 360}}
          transition={{duration: 1, repeat: Infinity, ease: "linear"}}
          className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/transactions/new" element={user ? <Layout><TransactionForm /></Layout> : <Navigate to="/login" />} />
        <Route path="/transactions/edit/:id" element={user ? <Layout><TransactionForm /></Layout> : <Navigate to="/login" />} />
        <Route path="/statistics" element={user ? <Layout><Statistics /></Layout> : <Navigate to="/login" />} />
        <Route path="/loan-officer/:id" element={user ? <Layout><LoanOfficerPortal /></Layout> : <Navigate to="/login" />} />
        <Route path="/loan-officers" element={user ? <Layout><LoanOfficerRoster /></Layout> : <Navigate to="/" />} />
        <Route path="/loan-officer-payments" element={user?.type === 'admin' ? <Layout><LoanOfficerPayments /></Layout> : <Navigate to="/" />} />
        <Route path="/my-payments" element={user?.type === 'loan_officer' ? <Layout><MyPayments /></Layout> : <Navigate to="/" />} />
        <Route path="/lenders" element={user ? <Layout><LenderDirectory /></Layout> : <Navigate to="/login" />} />
        <Route path="/lenders/:id" element={user ? <Layout><LenderProfile /></Layout> : <Navigate to="/login" />} />
        <Route path="/goals" element={user ? <Layout><Goals /></Layout> : <Navigate to="/login" />} />
        <Route path="/contacts" element={user ? <Layout><Contacts /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={user?.type === 'loan_officer' ? <Layout><Profile /></Layout> : <Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;