import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, AlertTriangle, CheckCircle, Info, ChevronUp } from 'lucide-react';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/components/pages/login/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const NotificationPopup: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());
  const [userTeamIds, setUserTeamIds] = useState<number[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);

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
      case 'success': return 'Succes';
      case 'warning': return 'Waarschuwing';
      case 'error': return 'Fout';
      default: return 'Info';
    }
  };

  // Fetch user's team IDs for team-targeted notifications
  const fetchUserTeamIds = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('team_users')
        .select('team_id')
        .eq('user_id', user.id);
      
      if (data) {
        setUserTeamIds(data.map(t => t.team_id).filter(Boolean) as number[]);
      }
    } catch (error) {
      console.error('Error fetching user teams:', error);
    }
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const allNotifications = await notificationService.getActiveNotifications();
      const now = new Date();
      
      const filteredNotifications = allNotifications.filter(notification => {
        const { start_date, end_date, target_roles, target_users, target_teams } = notification.setting_value;
        
        // Check time constraints first
        if (start_date && new Date(start_date) > now) return false;
        if (end_date && new Date(end_date) < now) return false;

        // Check targeting - notification matches if ANY targeting condition is met
        const userRole = user.role?.toLowerCase();
        const normalizedTargetRoles = Array.isArray(target_roles) 
          ? target_roles.map(role => String(role).toLowerCase())
          : [];
        
        // Check role targeting
        const matchesRole = normalizedTargetRoles.length === 0 || normalizedTargetRoles.includes(userRole);
        
        // Check user targeting
        const targetUserIds = Array.isArray(target_users) ? target_users : [];
        const matchesUser = targetUserIds.length === 0 || targetUserIds.includes(user.id);
        
        // Check team targeting
        const targetTeamIds = Array.isArray(target_teams) ? target_teams : [];
        const matchesTeam = targetTeamIds.length === 0 || targetTeamIds.some(tid => userTeamIds.includes(tid));
        
        // If specific targeting is set, use that. Otherwise fall back to role
        const hasSpecificTargeting = targetUserIds.length > 0 || targetTeamIds.length > 0;
        
        if (hasSpecificTargeting) {
          return matchesUser || matchesTeam;
        }
        
        return matchesRole;
      });

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user, userTeamIds]);

  const showNextNotification = useCallback(() => {
    const availableNotifications = notifications.filter(
      n => !dismissedNotifications.has(n.id)
    );

    setRemainingCount(Math.max(0, availableNotifications.length - 1));

    if (availableNotifications.length > 0) {
      setCurrentNotification(availableNotifications[0]);
      setIsVisible(true);
    }
  }, [notifications, dismissedNotifications]);

  const dismissNotification = useCallback(() => {
    if (currentNotification) {
      setDismissedNotifications(prev => new Set([...prev, currentNotification.id]));
      setIsVisible(false);
      setCurrentNotification(null);
      
      setTimeout(() => {
        showNextNotification();
      }, 300);
    }
  }, [currentNotification, showNextNotification]);

  const autoDismiss = useCallback(() => {
    if (currentNotification) {
      const settingValue = typeof currentNotification.setting_value === 'string' 
        ? JSON.parse(currentNotification.setting_value) 
        : currentNotification.setting_value;
        
      const duration = settingValue?.duration || 8;
      setTimeout(() => {
        dismissNotification();
      }, duration * 1000);
    }
  }, [currentNotification, dismissNotification]);

  // Fetch team IDs when user changes
  useEffect(() => {
    if (user?.role === 'player_manager') {
      fetchUserTeamIds();
    }
  }, [user, fetchUserTeamIds]);

  // Load notifications when user or teams change
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        loadNotifications();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setNotifications([]);
      setCurrentNotification(null);
      setIsVisible(false);
    }
  }, [user, userTeamIds, loadNotifications]);

  useEffect(() => {
    if (notifications.length > 0 && !isVisible && !currentNotification) {
      showNextNotification();
    }
  }, [notifications, isVisible, currentNotification, showNextNotification]);

  useEffect(() => {
    if (isVisible && currentNotification) {
      autoDismiss();
    }
  }, [isVisible, currentNotification, autoDismiss]);

  if (!isVisible || !currentNotification || !user) {
    return null;
  }

  const settingValue = typeof currentNotification.setting_value === 'string' 
    ? JSON.parse(currentNotification.setting_value) 
    : currentNotification.setting_value;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300 pb-safe">
      <Card className="shadow-lg border-2 border-border bg-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {getTypeIcon(settingValue?.type || 'info')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant={getTypeBadgeVariant(settingValue?.type || 'info')} className="text-xs">
                  {getTypeLabel(settingValue?.type || 'info')}
                </Badge>
                {remainingCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{remainingCount} meer
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {settingValue?.message || ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissNotification}
              className="shrink-0 h-8 w-8 p-0 hover:bg-muted touch-manipulation"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Swipe hint for mobile */}
          <div className="flex justify-center mt-2 md:hidden">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronUp className="w-3 h-3" />
              <span>Tik om te sluiten</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPopup;