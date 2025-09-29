import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/components/pages/login/AuthProvider';


const NotificationPopup: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return 'Success';
      case 'warning': return 'Waarschuwing';
      case 'error': return 'Error';
      default: return 'Informatie';
    }
  };

  const loadNotifications = async () => {
    console.log('🔔 Loading notifications, user:', user ? `${user.username} (${user.role})` : 'null');
    
    if (!user) {
      console.log('❌ No user found, skipping notification load');
      return;
    }

    try {
      console.log('🔄 Calling notificationService.getActiveNotifications()...');
      const allNotifications = await notificationService.getActiveNotifications();
      console.log('📥 Retrieved notifications from service:', JSON.stringify(allNotifications, null, 2));
      
      const now = new Date();
      const filteredNotifications = allNotifications.filter(notification => {
        const { start_date, end_date, target_roles } = notification.setting_value;
        
        // Check if notification is targeted to user's role
        const userRole = user.role?.toLowerCase();
        console.log(`🎯 Checking notification ${notification.id}: target_roles=${target_roles}, userRole=${userRole}`);
        
        if (!target_roles.includes(userRole)) {
          console.log(`❌ Notification ${notification.id} not for role ${userRole}`);
          return false;
        }

        // Check time constraints
        if (start_date && new Date(start_date) > now) {
          console.log(`❌ Notification ${notification.id} not started yet`);
          return false;
        }
        if (end_date && new Date(end_date) < now) {
          console.log(`❌ Notification ${notification.id} expired`);
          return false;
        }

        console.log(`✅ Notification ${notification.id} passed all filters`);
        return true;
      });

      console.log('📋 Filtered notifications:', filteredNotifications);
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const showNextNotification = () => {
    const availableNotifications = notifications.filter(
      n => !dismissedNotifications.has(n.id)
    );

    console.log('🔄 showNextNotification called:', {
      totalNotifications: notifications.length,
      availableNotifications: availableNotifications.length,
      dismissedCount: dismissedNotifications.size,
      currentlyVisible: isVisible
    });

    if (availableNotifications.length > 0) {
      const nextNotification = availableNotifications[0];
      console.log('✅ Showing notification:', nextNotification);
      setCurrentNotification(nextNotification);
      setIsVisible(true);
    } else {
      console.log('❌ No available notifications to show');
    }
  };

  const dismissNotification = () => {
    if (currentNotification) {
      setDismissedNotifications(prev => new Set([...prev, currentNotification.id]));
      setIsVisible(false);
      setCurrentNotification(null);
      
      // Show next notification after a short delay
      setTimeout(() => {
        showNextNotification();
      }, 500);
    }
  };

  const autoDismiss = () => {
    if (currentNotification) {
      const settingValue = typeof currentNotification.setting_value === 'string' 
        ? JSON.parse(currentNotification.setting_value) 
        : currentNotification.setting_value;
        
      setTimeout(() => {
        dismissNotification();
      }, (settingValue?.duration || 5) * 1000);
    }
  };

  useEffect(() => {
    // Only load notifications when user is authenticated and available
    if (user) {
      console.log('👤 User authenticated, loading notifications...');
      // Small delay to ensure user context is fully set in database
      const timer = setTimeout(() => {
        loadNotifications();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log('🚫 No user, clearing notifications');
      setNotifications([]);
      setCurrentNotification(null);
      setIsVisible(false);
    }
  }, [user]);

  useEffect(() => {
    if (notifications.length > 0 && !isVisible && !currentNotification) {
      showNextNotification();
    }
  }, [notifications]);

  useEffect(() => {
    if (isVisible && currentNotification) {
      autoDismiss();
    }
  }, [isVisible, currentNotification]);

  if (!isVisible || !currentNotification || !user) {
    return null;
  }

  const settingValue = typeof currentNotification.setting_value === 'string' 
    ? JSON.parse(currentNotification.setting_value) 
    : currentNotification.setting_value;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <Card className="w-96 shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {getTypeIcon(settingValue?.type || 'info')}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getTypeBadgeVariant(settingValue?.type || 'info')}>
                    {getTypeLabel(settingValue?.type || 'info')}
                  </Badge>
                  <Bell className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-700">
                  {settingValue?.message || ''}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissNotification}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;
