import { useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { 
    notifications, 
    addNotification, 
    checkComplianceNotifications,
    checkRateAlertNotifications,
    checkPaymentReminders,
    checkGoalProgress
  } = useData();
  const { user } = useAuth();

  // Check for various notification triggers
  const checkNotifications = useCallback(() => {
    if (!user) return;

    // Check compliance notifications
    checkComplianceNotifications();
    
    // Check rate alert notifications
    checkRateAlertNotifications();
    
    // Check payment reminders
    checkPaymentReminders();
    
    // Check goal progress
    checkGoalProgress();
  }, [user, checkComplianceNotifications, checkRateAlertNotifications, checkPaymentReminders, checkGoalProgress]);

  // Set up periodic notification checks
  useEffect(() => {
    // Initial check
    checkNotifications();

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkNotifications]);

  // Helper function to create notifications
  const createNotification = useCallback((data) => {
    const notification = {
      id: Date.now(),
      userId: data.userId || user?.id,
      isGlobal: data.isGlobal || false,
      type: data.type || 'general',
      priority: data.priority || 'normal', // low, normal, high
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl || null,
      metadata: data.metadata || {},
      isRead: false,
      createdAt: new Date().toISOString()
    };

    addNotification(notification);
    return notification;
  }, [user, addNotification]);

  // Specific notification creators
  const notifyTransactionUpdate = useCallback((transaction, action) => {
    const actionMessages = {
      created: 'A new transaction has been created',
      updated: 'Transaction has been updated',
      closed: 'Transaction has been closed',
      cancelled: 'Transaction has been cancelled'
    };

    return createNotification({
      type: 'transaction',
      priority: action === 'closed' ? 'high' : 'normal',
      title: `Transaction ${action}`,
      message: `${actionMessages[action]} for ${transaction.clientName} - $${transaction.loanAmount.toLocaleString()}`,
      actionUrl: `/transactions/edit/${transaction.id}`,
      metadata: {
        transactionId: transaction.id,
        clientName: transaction.clientName,
        loanAmount: transaction.loanAmount,
        action
      }
    });
  }, [createNotification]);

  const notifyComplianceDeadline = useCallback((record, daysUntil) => {
    const urgency = daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'normal' : 'low';
    
    return createNotification({
      type: 'compliance',
      priority: urgency,
      title: 'Compliance Deadline Approaching',
      message: `${record.description} expires in ${daysUntil} days`,
      actionUrl: '/compliance',
      metadata: {
        recordId: record.id,
        type: record.type,
        daysUntil,
        expirationDate: record.expirationDate
      }
    });
  }, [createNotification]);

  const notifyPaymentProcessed = useCallback((transaction, amount) => {
    return createNotification({
      type: 'payment',
      priority: 'normal',
      title: 'Payment Processed',
      message: `Commission payment of $${amount.toLocaleString()} has been processed for ${transaction.clientName}`,
      actionUrl: user?.type === 'loan_officer' ? '/my-payments' : '/loan-officer-payments',
      metadata: {
        transactionId: transaction.id,
        amount,
        clientName: transaction.clientName
      }
    });
  }, [createNotification, user]);

  const notifyRateAlert = useCallback((alert, currentRate) => {
    return createNotification({
      type: 'rate_alert',
      priority: 'high',
      title: 'Rate Alert Triggered',
      message: `${alert.loanType} rates have dropped to ${currentRate}% (target: ${alert.targetRate}%)`,
      actionUrl: '/', // Could link to refinance opportunities
      metadata: {
        alertId: alert.id,
        loanType: alert.loanType,
        currentRate,
        targetRate: alert.targetRate
      }
    });
  }, [createNotification]);

  const notifyGoalProgress = useCallback((goal, progress) => {
    const priority = progress >= 90 ? 'high' : progress >= 75 ? 'normal' : 'low';
    
    return createNotification({
      type: 'goal',
      priority,
      title: 'Goal Progress Update',
      message: `You're ${progress.toFixed(1)}% towards your ${goal.period} ${goal.type} goal`,
      actionUrl: '/goals',
      metadata: {
        goalId: goal.id,
        progress,
        type: goal.type,
        period: goal.period
      }
    });
  }, [createNotification]);

  const notifySystemUpdate = useCallback((title, message, isGlobal = true) => {
    return createNotification({
      type: 'system',
      priority: 'normal',
      title,
      message,
      isGlobal,
      metadata: {
        systemUpdate: true
      }
    });
  }, [createNotification]);

  return {
    notifications: notifications.filter(n => 
      user?.type === 'admin' ? true : n.userId === user?.id || n.isGlobal
    ),
    createNotification,
    notifyTransactionUpdate,
    notifyComplianceDeadline,
    notifyPaymentProcessed,
    notifyRateAlert,
    notifyGoalProgress,
    notifySystemUpdate,
    checkNotifications
  };
}