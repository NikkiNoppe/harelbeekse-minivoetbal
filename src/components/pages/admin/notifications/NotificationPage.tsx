import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { notificationService, type Notification } from '@/services/notificationService';
import { Plus, Edit, Trash2, Users, UserCheck, Building2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NotificationFormModal } from '@/components/modals';

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Informatie' },
  { value: 'warning', label: 'Waarschuwing' },
  { value: 'success', label: 'Succes' },
  { value: 'error', label: 'Fout' }
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'referee', label: 'Scheidsrechter' },
  { value: 'player_manager', label: 'Teamverantwoordelijke' }
];

type TargetMode = 'everyone' | 'roles' | 'users' | 'teams';
type PlayerManagerMode = 'all' | 'specific_teams';

interface FormData {
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_roles: string[];
  target_users: number[];
  target_teams: number[];
  player_manager_mode: PlayerManagerMode;
  player_manager_teams: number[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  duration: number;
}

const DEFAULT_FORM_DATA: FormData = {
  message: '',
  type: 'info',
  target_roles: [],
  target_users: [],
  target_teams: [],
  player_manager_mode: 'all',
  player_manager_teams: [],
  start_date: '',
  end_date: '',
  is_active: true,
  duration: 8
};

const NotificationPage: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [initialFormData, setInitialFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [initialTargetMode, setInitialTargetMode] = useState<TargetMode>('everyone');
  
  // Users and teams for targeting
  const [users, setUsers] = useState<Array<{ user_id: number; username: string; role: string }>>([]);
  const [teams, setTeams] = useState<Array<{ team_id: number; team_name: string }>>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notificationsData, usersData, teamsData] = await Promise.all([
        notificationService.getAllNotifications(),
        notificationService.getAllUsers(),
        notificationService.getAllTeams()
      ]);
      setNotifications(notificationsData);
      setUsers(usersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Kon gegevens niet laden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNew = useCallback(() => {
    setEditingNotification(null);
    setInitialFormData(DEFAULT_FORM_DATA);
    setInitialTargetMode('everyone');
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (formData: FormData, targetMode: TargetMode) => {
    try {
      const notificationData = {
        setting_category: 'notifications',
        setting_name: editingNotification ? editingNotification.setting_name : `notification_${Date.now()}`,
        setting_value: {
          message: formData.message,
          type: formData.type,
          target_roles: targetMode === 'roles' ? formData.target_roles : (targetMode === 'everyone' ? ['admin', 'referee', 'player_manager'] : []),
          target_users: targetMode === 'users' ? formData.target_users : [],
          target_teams: targetMode === 'teams' ? formData.target_teams : [],
          player_manager_mode: formData.target_roles.includes('player_manager') ? formData.player_manager_mode : undefined,
          player_manager_teams: formData.target_roles.includes('player_manager') && formData.player_manager_mode === 'specific_teams' 
            ? formData.player_manager_teams 
            : [],
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          duration: formData.duration
        },
        is_active: formData.is_active
      };

      if (editingNotification) {
        await notificationService.updateNotification(editingNotification.id, notificationData);
        toast({ title: 'Succes', description: 'Notificatie bijgewerkt' });
      } else {
        await notificationService.createNotification(notificationData);
        toast({ title: 'Succes', description: 'Notificatie aangemaakt' });
      }

      await loadData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: 'Error',
        description: 'Kon notificatie niet opslaan',
        variant: 'destructive'
      });
      throw error;
    }
  }, [editingNotification, toast, loadData]);

  const handleEdit = useCallback((notification: Notification) => {
    setEditingNotification(notification);
    const sv = notification.setting_value;
    
    // Determine target mode based on what's set
    let detectedTargetMode: TargetMode = 'everyone';
    if (sv.target_users && sv.target_users.length > 0) {
      detectedTargetMode = 'users';
    } else if (sv.target_teams && sv.target_teams.length > 0) {
      detectedTargetMode = 'teams';
    } else if (sv.target_roles && sv.target_roles.length > 0) {
      // Check if it's "everyone" (all 3 roles) or specific roles
      const allRoles = ['admin', 'referee', 'player_manager'];
      const hasAllRoles = allRoles.every(r => sv.target_roles.includes(r));
      detectedTargetMode = hasAllRoles ? 'everyone' : 'roles';
    }
    
    setInitialTargetMode(detectedTargetMode);
    setInitialFormData({
      message: sv.message,
      type: sv.type as 'info' | 'warning' | 'success' | 'error',
      target_roles: sv.target_roles || [],
      target_users: sv.target_users || [],
      target_teams: sv.target_teams || [],
      player_manager_mode: sv.player_manager_mode || 'all',
      player_manager_teams: sv.player_manager_teams || [],
      start_date: sv.start_date || '',
      end_date: sv.end_date || '',
      is_active: notification.is_active,
      duration: sv.duration || 8
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Weet je zeker dat je deze notificatie wilt verwijderen?')) return;
    
    try {
      await notificationService.deleteNotification(id);
      toast({ title: 'Succes', description: 'Notificatie verwijderd' });
      await loadData();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Kon notificatie niet verwijderen',
        variant: 'destructive'
      });
    }
  }, [toast, loadData]);

  const toggleActive = useCallback(async (notification: Notification) => {
    try {
      await notificationService.toggleNotificationStatus(notification.id, !notification.is_active);
      toast({
        title: 'Succes',
        description: `Notificatie ${!notification.is_active ? 'geactiveerd' : 'gedeactiveerd'}`
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling notification status:', error);
      toast({
        title: 'Error',
        description: 'Kon status niet wijzigen',
        variant: 'destructive'
      });
    }
  }, [toast, loadData]);

  const getTypeBadgeClass = useCallback((type: string) => {
    switch (type) {
      case 'success': return 'bg-[var(--color-success)] text-[var(--color-white)]';
      case 'warning': return 'bg-[var(--color-700)] text-[var(--color-white)]';
      case 'error': return 'bg-[var(--color-destructive)] text-[var(--color-white)]';
      default: return 'bg-[var(--color-500)] text-[var(--color-white)]';
    }
  }, []);

  const getTargetDescription = (notification: Notification) => {
    const sv = notification.setting_value;
    if (sv.target_users && sv.target_users.length > 0) {
      const userNames = sv.target_users.map(uid => 
        users.find(u => u.user_id === uid)?.username || `User ${uid}`
      );
      return { type: 'users', items: userNames };
    }
    if (sv.target_teams && sv.target_teams.length > 0) {
      const teamNames = sv.target_teams.map(tid => 
        teams.find(t => t.team_id === tid)?.team_name || `Team ${tid}`
      );
      return { type: 'teams', items: teamNames };
    }
    if (sv.target_roles && sv.target_roles.length > 0) {
      // Check if it's "everyone"
      const allRoles = ['admin', 'referee', 'player_manager'];
      const hasAllRoles = allRoles.every(r => sv.target_roles.includes(r));
      if (hasAllRoles) {
        return { type: 'everyone', items: ['Iedereen'] };
      }
      
      const items = sv.target_roles.map(r => {
        const label = ROLE_OPTIONS.find(ro => ro.value === r)?.label || r;
        if (r === 'player_manager' && sv.player_manager_mode === 'specific_teams' && sv.player_manager_teams?.length) {
          return `${label} (${sv.player_manager_teams.length} teams)`;
        }
        return label;
      });
      return { type: 'roles', items };
    }
    return { type: 'none', items: [] };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-600)]">Notificaties</h1>
        <Button className="w-full sm:w-auto bg-[var(--color-500)] hover:bg-[var(--color-600)] text-[var(--color-white)]" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Notificatie
        </Button>
      </div>

      <NotificationFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={initialFormData}
        initialTargetMode={initialTargetMode}
        isEditing={!!editingNotification}
        users={users}
        teams={teams}
      />

      {/* Notifications List */}
      <Card className="border-[var(--color-300)] bg-[var(--color-white)]">
        <CardHeader>
          <CardTitle className="text-lg text-[var(--color-600)]">Alle Notificaties</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-[var(--color-500)] py-8">
              Nog geen notificaties aangemaakt.
            </p>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {notifications.map((notification) => {
                  const target = getTargetDescription(notification);
                  return (
                    <Card key={notification.id} className="p-4 border-[var(--color-300)] bg-[var(--color-50)]">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[var(--color-600)] line-clamp-2">
                            {notification.setting_value.message}
                          </p>
                          <Badge className={`shrink-0 ${getTypeBadgeClass(notification.setting_value.type)}`}>
                            {NOTIFICATION_TYPES.find(t => t.value === notification.setting_value.type)?.label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {target.type === 'users' && <UserCheck className="w-3 h-3 text-[var(--color-500)]" />}
                          {target.type === 'teams' && <Building2 className="w-3 h-3 text-[var(--color-500)]" />}
                          {target.type === 'roles' && <Users className="w-3 h-3 text-[var(--color-500)]" />}
                          {target.type === 'everyone' && <Users className="w-3 h-3 text-[var(--color-500)]" />}
                          {target.items.slice(0, 2).map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-[var(--color-300)] text-[var(--color-600)]">
                              {item}
                            </Badge>
                          ))}
                          {target.items.length > 2 && (
                            <Badge variant="outline" className="text-xs border-[var(--color-300)] text-[var(--color-600)]">
                              +{target.items.length - 2}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={notification.is_active}
                              onCheckedChange={() => toggleActive(notification)}
                              className="scale-75"
                            />
                            <span className="text-xs text-[var(--color-500)]">
                              {notification.is_active ? 'Actief' : 'Inactief'}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(notification)}
                              className="h-10 w-10 p-0 hover:bg-[var(--color-100)]"
                            >
                              <Edit className="h-4 w-4 text-[var(--color-600)]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="text-[var(--color-destructive)] h-10 w-10 p-0 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Bericht</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Doelgroep</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-center">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => {
                      const target = getTargetDescription(notification);
                      return (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium text-[var(--color-600)] max-w-[200px] truncate">
                            {notification.setting_value.message}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeBadgeClass(notification.setting_value.type)}>
                              {NOTIFICATION_TYPES.find(t => t.value === notification.setting_value.type)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {target.type === 'users' && <UserCheck className="w-4 h-4 text-[var(--color-500)]" />}
                              {target.type === 'teams' && <Building2 className="w-4 h-4 text-[var(--color-500)]" />}
                              {target.type === 'roles' && <Users className="w-4 h-4 text-[var(--color-500)]" />}
                              {target.type === 'everyone' && <Users className="w-4 h-4 text-[var(--color-500)]" />}
                              {target.items.slice(0, 3).map((item, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-[var(--color-300)] text-[var(--color-600)]">
                                  {item}
                                </Badge>
                              ))}
                              {target.items.length > 3 && (
                                <Badge variant="outline" className="text-xs border-[var(--color-300)] text-[var(--color-600)]">
                                  +{target.items.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={notification.is_active}
                                onCheckedChange={() => toggleActive(notification)}
                                className="scale-75"
                              />
                              <Badge className={notification.is_active ? 'bg-[var(--color-success)] text-[var(--color-white)] text-xs' : 'bg-[var(--color-400)] text-[var(--color-white)] text-xs'}>
                                {notification.is_active ? 'Actief' : 'Inactief'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-[var(--color-500)]">
                            {new Date(notification.created_at).toLocaleDateString('nl-NL')}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(notification)}
                                className="hover:bg-[var(--color-100)]"
                              >
                                <Edit className="h-4 w-4 text-[var(--color-600)]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                                className="text-[var(--color-destructive)] hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPage;
