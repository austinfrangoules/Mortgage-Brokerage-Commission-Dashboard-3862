import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBell } = FiIcons;

function NotificationBadge({ onClick, className = "" }) {
  const { notifications } = useData();
  const { user } = useAuth();

  // Filter notifications for current user
  const userNotifications = notifications.filter(notification => {
    if (user?.type === 'admin') return true;
    return notification.userId === user?.id || notification.isGlobal;
  });

  // Count unread notifications
  const unreadCount = userNotifications.filter(n => !n.isRead).length;
  const hasHighPriority = userNotifications.some(n => !n.isRead && n.priority === 'high');

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`p-2 text-gray-400 hover:text-gray-600 relative transition-colors ${className}`}
        title={`${unreadCount} unread notifications`}
      >
        <SafeIcon icon={FiBell} className="text-xl" />
        
        {/* Notification count badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs text-white font-medium ${
              hasHighPriority ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
        
        {/* Pulse animation for high priority notifications */}
        {hasHighPriority && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full opacity-30"
          />
        )}
      </button>
    </div>
  );
}

export default NotificationBadge;