import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import * as HiIcons from 'react-icons/hi';
import * as BiIcons from 'react-icons/bi';

const { FiPlus, FiEdit3, FiTrash2, FiSearch, FiFilter, FiRefreshCw, FiPhone, FiMail, FiMapPin, FiHome, FiUser, FiUsers, FiBriefcase } = FiIcons;

function Contacts() {
  const { 
    realtorContacts, 
    settlementContacts, 
    addRealtorContact, 
    addSettlementContact,
    updateRealtorContact, 
    updateSettlementContact, 
    deleteRealtorContact, 
    deleteSettlementContact 
  } = useData();
  
  const [activeTab, setActiveTab] = useState('realtors');
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [filterCompany, setFilterCompany] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    type: 'realtor'
  });

  // Get unique company names for filtering
  const getUniqueCompanies = (contacts) => {
    return [...new Set(contacts.map(contact => contact.company).filter(Boolean))].sort();
  };

  const realtorCompanies = getUniqueCompanies(realtorContacts);
  const settlementCompanies = getUniqueCompanies(settlementContacts);

  // Filter contacts based on search term and company filter
  const getFilteredContacts = (contacts) => {
    return contacts.filter(contact => {
      const matchesSearch = !searchTerm || 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.phone && contact.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.notes && contact.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCompany = !filterCompany || contact.company === filterCompany;
      
      return matchesSearch && matchesCompany;
    });
  };

  const filteredRealtorContacts = getFilteredContacts(realtorContacts);
  const filteredSettlementContacts = getFilteredContacts(settlementContacts);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingContact) {
      if (formData.type === 'realtor') {
        updateRealtorContact(editingContact.id, formData);
      } else {
        updateSettlementContact(editingContact.id, formData);
      }
      setEditingContact(null);
    } else {
      if (formData.type === 'realtor') {
        addRealtorContact(formData);
      } else {
        addSettlementContact(formData);
      }
    }
    
    setShowContactForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      type: activeTab === 'realtors' ? 'realtor' : 'settlement'
    });
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      ...contact,
      type: contact.type || (activeTab === 'realtors' ? 'realtor' : 'settlement')
    });
    setShowContactForm(true);
  };

  const handleDelete = (id, type) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      if (type === 'realtor') {
        deleteRealtorContact(id);
      } else {
        deleteSettlementContact(id);
      }
    }
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      type: activeTab === 'realtors' ? 'realtor' : 'settlement'
    }));
    setShowContactForm(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCompany('');
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if we have the right length
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    } else if (cleaned.length > 10) {
      // For numbers with country code or extra digits
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    }
    
    // If the number doesn't match the format, return the original
    return phoneNumber;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage your realtor and settlement contacts
          </p>
        </motion.div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Contact</span>
        </motion.button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('realtors');
              setFilterCompany('');
            }}
            className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
              activeTab === 'realtors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SafeIcon icon={FiHome} className="mr-2" />
            Realtors ({realtorContacts.length})
          </button>
          
          <button
            onClick={() => {
              setActiveTab('settlement');
              setFilterCompany('');
            }}
            className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
              activeTab === 'settlement'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SafeIcon icon={FiBriefcase} className="mr-2" />
            Settlement Contacts ({settlementContacts.length})
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative w-full md:w-96">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts by name, company, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {activeTab === 'realtors'
                  ? realtorCompanies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))
                  : settlementCompanies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))
                }
              </select>
              
              <button
                onClick={resetFilters}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Reset Filters"
              >
                <SafeIcon icon={FiRefreshCw} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Contact Cards */}
        <div className="p-6">
          {activeTab === 'realtors' && filteredRealtorContacts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No realtor contacts found. Add your first contact!</p>
            </div>
          )}
          
          {activeTab === 'settlement' && filteredSettlementContacts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No settlement contacts found. Add your first contact!</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'realtors' &&
              filteredRealtorContacts.map((contact, index) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={() => handleEdit(contact)}
                  onDelete={() => handleDelete(contact.id, 'realtor')}
                  formatPhoneNumber={formatPhoneNumber}
                  index={index}
                  contactType="realtor"
                />
              ))}
              
            {activeTab === 'settlement' &&
              filteredSettlementContacts.map((contact, index) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={() => handleEdit(contact)}
                  onDelete={() => handleDelete(contact.id, 'settlement')}
                  formatPhoneNumber={formatPhoneNumber}
                  index={index}
                  contactType="settlement"
                />
              ))}
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Contact Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="realtor"
                      checked={formData.type === 'realtor'}
                      onChange={() => setFormData({ ...formData, type: 'realtor' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Realtor</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="settlement"
                      checked={formData.type === 'settlement'}
                      onChange={() => setFormData({ ...formData, type: 'settlement' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Settlement Contact</span>
                  </label>
                </div>
              </div>

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
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main St, City, State, Zip"
                />
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
                  placeholder="Additional information about this contact..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false);
                    setEditingContact(null);
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
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete, formatPhoneNumber, index, contactType }) {
  const cardBgColor = contactType === 'realtor' ? 'bg-blue-50' : 'bg-indigo-50';
  const iconColor = contactType === 'realtor' ? 'text-blue-600' : 'text-indigo-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${cardBgColor} rounded-xl shadow-md overflow-hidden`}
    >
      <div className="px-6 py-4 flex justify-between items-start">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contactType === 'realtor' ? 'bg-blue-200' : 'bg-indigo-200'}`}>
            <SafeIcon icon={contactType === 'realtor' ? FiHome : FiBriefcase} className={iconColor} />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{contact.name}</h3>
            {contact.company && (
              <p className="text-sm text-gray-600">{contact.company}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:text-blue-900"
            title="Edit Contact"
          >
            <SafeIcon icon={FiEdit3} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-900"
            title="Delete Contact"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-white">
        <div className="space-y-2 text-sm">
          {contact.email && (
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiMail} className="text-gray-400" />
              <a
                href={`mailto:${contact.email}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {contact.email}
              </a>
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiPhone} className="text-gray-400" />
              <a
                href={`tel:${contact.phone}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {formatPhoneNumber(contact.phone)}
              </a>
            </div>
          )}
          
          {contact.address && (
            <div className="flex items-start space-x-2">
              <SafeIcon icon={FiMapPin} className="text-gray-400 mt-1 flex-shrink-0" />
              <span className="text-gray-600">{contact.address}</span>
            </div>
          )}
        </div>
        
        {contact.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{contact.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Contacts;