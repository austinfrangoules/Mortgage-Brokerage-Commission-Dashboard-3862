import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, isToday, isYesterday, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

const { FiBell, FiX, FiCheck, FiTrash2, FiSettings, FiFilter, FiSearch, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiInfo, FiDollarSign, FiCalendar, FiUsers, FiShield, FiClock, FiEye, FiEyeOff, FiSend } = FiIcons;

function NotificationCenter({ isOpen, onClose }) {
  const { notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications, updateNotificationPreferences, notificationPreferences } = useData();
  const { user } = useAuth();
  const isAdmin = user?.type === 'admin';

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications based on user role
  const userNotifications = notifications.filter(notification => {
    // Admin sees all notifications, loan officers see only their own
    if (user?.type === 'admin') return true;
    return notification.userId === user?.id || notification.isGlobal;
  });

  // Apply filters
  const filteredNotifications = userNotifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && !notification.isRead) ||
      (activeTab === 'important' && notification.priority === 'high');
    
    const matchesUnread = !showUnreadOnly || !notification.isRead;

    return matchesSearch && matchesType && matchesTab && matchesUnread;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = parseISO(notification.createdAt);
    let groupKey;
    
    if (isToday(date)) {
      groupKey = 'Today';
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday';
    } else {
      groupKey = format(date, 'MMMM d, yyyy');
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {});

  // Sort groups by date (most recent first)
  const sortedGroups = Object.entries(groupedNotifications).sort(([a], [b]) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b) - new Date(a);
  });

  // Get notification icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      transaction: FiDollarSign,
      compliance: FiShield,
      payment: FiDollarSign,
      reminder: FiClock,
      system: FiSettings,
      goal: FiCalendar,
      rate_alert: FiBell,
      audit: FiCheckCircle,
      general: FiInfo
    };
    return iconMap[type] || FiInfo;
  };

  // Get notification color
  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'text-red-600 bg-red-100';
    
    const colorMap = {
      transaction: 'text-green-600 bg-green-100',
      compliance: 'text-orange-600 bg-orange-100',
      payment: 'text-blue-600 bg-blue-100',
      reminder: 'text-yellow-600 bg-yellow-100',
      system: 'text-gray-600 bg-gray-100',
      goal: 'text-purple-600 bg-purple-100',
      rate_alert: 'text-indigo-600 bg-indigo-100',
      audit: 'text-teal-600 bg-teal-100',
      general: 'text-gray-600 bg-gray-100'
    };
    return colorMap[type] || 'text-gray-600 bg-gray-100';
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = parseISO(dateString);
    const now = new Date();
    const minutesDiff = differenceInMinutes(now, date);
    const hoursDiff = differenceInHours(now, date);
    const daysDiff = differenceInDays(now, date);

    if (minutesDiff < 1) return 'Just now';
    if (minutesDiff < 60) return `${minutesDiff}m ago`;
    if (hoursDiff < 24) return `${hoursDiff}h ago`;
    if (daysDiff < 7) return `${daysDiff}d ago`;
    return format(date, 'MMM d');
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    
    // Handle navigation based on notification action
    if (notification.actionUrl) {
      // Navigate to the specified URL
      onClose();
      window.location.hash = notification.actionUrl;
    }
  };

  // Count unread notifications
  const unreadCount = userNotifications.filter(n => !n.isRead).length;
  const importantCount = userNotifications.filter(n => n.priority === 'high' && !n.isRead).length;

  const tabs = [
    { id: 'all', label: 'All', count: userNotifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'important', label: 'Important', count: importantCount }
  ];

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'transaction', label: 'Transactions' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'payment', label: 'Payments' },
    { value: 'reminder', label: 'Reminders' },
    { value: 'rate_alert', label: 'Rate Alerts' },
    { value: 'system', label: 'System' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-navy-700 to-navy-900 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiBell} className="text-2xl" />
              <div>
                <h2 className="text-xl font-semibold">Notifications</h2>
                <p className="text-navy-100 text-sm">
                  {unreadCount} unread of {userNotifications.length} total
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <button
                  onClick={() => { setShowComposer(!showComposer); setShowPreferences(false); }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 text-sm font-medium"
                  title="Send an announcement to everyone"
                >
                  <SafeIcon icon={FiSend} className="text-sm" />
                  <span className="hidden sm:inline">New Announcement</span>
                </button>
              )}
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
                title="Notification Preferences"
              >
                <SafeIcon icon={FiSettings} />
              </button>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>
          </div>
        </div>

        {/* Announcement Composer (admin only) */}
        {isAdmin && (
          <AnimatePresence>
            {showComposer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-gray-200 bg-gray-50 overflow-hidden"
              >
                <AnnouncementComposer
                  onSend={async (announcement) => {
                    await addNotification({
                      ...announcement,
                      type: 'system',
                      isGlobal: true
                    });
                    // Also email everyone via Resend. This is best-effort —
                    // the in-app notification above is the source of truth,
                    // so an email hiccup shouldn't block the announcement.
                    try {
                      await supabase.functions.invoke('send-broadcast-email', {
                        body: { title: announcement.title, message: announcement.message }
                      });
                    } catch (err) {
                      console.error('Broadcast email failed to send:', err.message);
                    }
                    setShowComposer(false);
                  }}
                  onClose={() => setShowComposer(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Preferences Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 bg-gray-50 overflow-hidden"
            >
              <NotificationPreferences
                preferences={notificationPreferences}
                onUpdate={updateNotificationPreferences}
                onClose={() => setShowPreferences(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex space-x-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-navy-100 text-navy-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gold-500 text-navy-900 text-xs rounded-full px-2 py-0.5 font-semibold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-navy-700 hover:text-navy-900 text-sm font-medium flex items-center space-x-1"
                >
                  <SafeIcon icon={FiCheckCircle} className="text-xs" />
                  <span>Mark all read</span>
                </button>
              )}
              
              {userNotifications.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all notifications?')) {
                      clearAllNotifications(user?.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-1"
                >
                  <SafeIcon icon={FiTrash2} className="text-xs" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-400 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-400 focus:border-transparent"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 ${
                showUnreadOnly
                  ? 'bg-navy-100 text-navy-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SafeIcon icon={showUnreadOnly ? FiEye : FiEyeOff} className="text-xs" />
              <span>Unread only</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <SafeIcon icon={FiBell} className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 text-sm">
                {searchTerm || filterType !== 'all' ? 'Try adjusting your filters' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {sortedGroups.map(([groupKey, notifications]) => (
                <div key={groupKey}>
                  <h3 className="text-sm font-medium text-gray-500 mb-3 sticky top-0 bg-white py-2">
                    {groupKey}
                  </h3>
                  <div className="space-y-2">
                    {notifications.map((notification, index) => {
                      const IconComponent = getNotificationIcon(notification.type);
                      const colorClass = getNotificationColor(notification.type, notification.priority);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            notification.isRead
                              ? 'bg-white border-gray-200'
                              : 'bg-navy-50 border-navy-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <SafeIcon icon={IconComponent} className="text-sm" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`text-sm font-medium ${
                                    notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  
                                  {notification.metadata && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {Object.entries(notification.metadata).map(([key, value]) => (
                                        <span
                                          key={key}
                                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                        >
                                          {key}: {value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatRelativeTime(notification.createdAt)}
                                  </span>
                                  
                                  {notification.priority === 'high' && (
                                    <SafeIcon icon={FiAlertTriangle} className="text-red-500 text-xs" />
                                  )}
                                  
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notification.id);
                                  }}
                                  className="p-1 text-navy-700 hover:text-navy-900"
                                  title="Mark as read"
                                >
                                  <SafeIcon icon={FiCheck} className="text-xs" />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete notification"
                              >
                                <SafeIcon icon={FiTrash2} className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AnnouncementComposer({ onSend, onClose }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    await onSend({ title: title.trim(), message: message.trim(), priority });
    setSending(false);
    setTitle('');
    setMessage('');
    setPriority('normal');
  };

  return (
    <form onSubmit={handleSend} className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">New Company Announcement</h3>
          <p className="text-sm text-gray-600">Every loan officer and admin will see this in their notifications.</p>
        </div>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <SafeIcon icon={FiX} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. New lender added: Acme Mortgage"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="What do you want everyone to know?"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
        <div className="flex gap-2">
          {['low', 'normal', 'high'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                priority === p ? 'bg-navy-100 text-navy-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={sending || !title.trim() || !message.trim()}
          className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-lg font-bold flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiSend} />
          <span>{sending ? 'Sending…' : 'Send to Everyone'}</span>
        </button>
      </div>
    </form>
  );
}

function NotificationPreferences({ preferences, onUpdate, onClose }) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSave = () => {
    onUpdate(localPreferences);
    onClose();
  };

  const notificationCategories = [
    {
      id: 'transactions',
      label: 'Transactions',
      description: 'New transactions, status updates, and closings',
      options: ['email', 'push', 'sms']
    },
    {
      id: 'compliance',
      label: 'Compliance',
      description: 'License renewals, training requirements, and deadlines',
      options: ['email', 'push', 'sms']
    },
    {
      id: 'payments',
      label: 'Payments',
      description: 'Commission payments and payment confirmations',
      options: ['email', 'push']
    },
    {
      id: 'reminders',
      label: 'Reminders',
      description: 'Important deadlines and follow-up reminders',
      options: ['email', 'push', 'sms']
    },
    {
      id: 'rates',
      label: 'Interest Rates',
      description: 'Rate changes and refinance opportunities',
      options: ['email', 'push']
    },
    {
      id: 'system',
      label: 'System',
      description: 'System updates and maintenance notifications',
      options: ['email', 'push']
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <SafeIcon icon={FiX} />
        </button>
      </div>

      <div className="space-y-6">
        {notificationCategories.map(category => (
          <div key={category.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{category.label}</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {category.options.map(option => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPreferences[category.id]?.[option] || false}
                    onChange={(e) => {
                      setLocalPreferences(prev => ({
                        ...prev,
                        [category.id]: {
                          ...prev[category.id],
                          [option]: e.target.checked
                        }
                      }));
                    }}
                    className="rounded border-gray-300 text-navy-700 focus:ring-navy-400"
                  />
                  <span className="text-sm text-gray-700 capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-800"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

export default NotificationCenter;
