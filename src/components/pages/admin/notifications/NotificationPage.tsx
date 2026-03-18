import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { notificationService, type Notification } from '@/services/notificationService';
import { Plus, Edit, Trash2, Users, UserCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NotificationFormModal } from '@/components/modals';

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Informatie' },
  { value: 'warning', label: 'Waarschuwing' },
  { value: 'success', label: 'Succes' },
  { value: 'error', label: 'Fout' }
];

const ROLE_OPTIONS = [
  { value: 'referee', label: 'Scheidsrechter' },
  { value: 'player_manager', label: 'Teamverantwoordelijke' }
];

type TargetMode = 'roles' | 'users';

interface FormData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_roles: string[];
  target_users: number[];
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const DEFAULT_FORM_DATA: FormData = {
  title: '',
  message: '',
  type: 'info',
  target_roles: [],
  target_users: [],
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  is_active: true,
};

const NotificationPage: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [initialFormData, setInitialFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [initialTargetMode, setInitialTargetMode] = useState<TargetMode>('roles');
  
  // Users for targeting
  const [users, setUsers] = useState<Array<{ user_id: number; username: string; role: string }>>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notificationsData, usersData] = await Promise.all([
        notificationService.getAllNotifications(),
        notificationService.getAllUsers(),
      ]);
      setNotifications(notificationsData);
      setUsers(usersData);
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
    setInitialTargetMode('roles');
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (formData: FormData, targetMode: TargetMode) => {
    try {
      const notificationData = {
        setting_category: 'admin_messages',
        setting_name: editingNotification ? editingNotification.setting_name : `message_${Date.now()}`,
        setting_value: {
          title: formData.title || undefined,
          message: formData.message,
          type: formData.type,
          target_roles: targetMode === 'roles' ? formData.target_roles : [],
          target_users: targetMode === 'users' ? formData.target_users : [],
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        },
        is_active: formData.is_active
      };

      if (editingNotification) {
        await notificationService.updateNotification(editingNotification.id, notificationData);
        toast({ title: 'Succes', description: 'Bericht bijgewerkt' });
      } else {
        await notificationService.createNotification(notificationData);
        toast({ title: 'Succes', description: 'Bericht aangemaakt' });
      }

      await loadData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: 'Error',
        description: 'Kon bericht niet opslaan',
        variant: 'destructive'
      });
      throw error;
    }
  }, [editingNotification, toast, loadData]);

  const handleEdit = useCallback((notification: Notification) => {
    setEditingNotification(notification);
    const sv = notification.setting_value;
    
    // Determine target mode
    let detectedTargetMode: TargetMode = 'roles';
    if (sv.target_users && sv.target_users.length > 0) {
      detectedTargetMode = 'users';
    }
    
    setInitialTargetMode(detectedTargetMode);
    setInitialFormData({
      title: sv.title || '',
      message: sv.message,
      type: sv.type as 'info' | 'warning' | 'success' | 'error',
      target_roles: sv.target_roles || [],
      target_users: sv.target_users || [],
      start_date: sv.start_date || '',
      end_date: sv.end_date || '',
      is_active: notification.is_active,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;
    
    try {
      await notificationService.deleteNotification(id);
      toast({ title: 'Succes', description: 'Bericht verwijderd' });
      await loadData();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Kon bericht niet verwijderen',
        variant: 'destructive'
      });
    }
  }, [toast, loadData]);

  const toggleActive = useCallback(async (notification: Notification) => {
    try {
      await notificationService.toggleNotificationStatus(notification.id, !notification.is_active);
      toast({
        title: 'Succes',
        description: `Bericht ${!notification.is_active ? 'geactiveerd' : 'gedeactiveerd'}`
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
    if (sv.target_roles && sv.target_roles.length > 0) {
      const items = sv.target_roles.map(r => 
        ROLE_OPTIONS.find(ro => ro.value === r)?.label || r
      );
      return { type: 'roles', items };
    }
    return { type: 'none', items: [] };
  };

  const formatDateRange = (notification: Notification) => {
    const sv = notification.setting_value;
    if (sv.start_date && sv.end_date) {
      return `${new Date(sv.start_date).toLocaleDateString('nl-BE')} - ${new Date(sv.end_date).toLocaleDateString('nl-BE')}`;
    }
    if (sv.start_date) {
      return `Vanaf ${new Date(sv.start_date).toLocaleDateString('nl-BE')}`;
    }
    if (sv.end_date) {
      return `Tot ${new Date(sv.end_date).toLocaleDateString('nl-BE')}`;
    }
    return 'Altijd';
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
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-600)]">Berichten</h1>
        <Button className="btn--primary w-full sm:w-auto" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nieuw Bericht
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
        teams={[]}
      />

      {/* Messages List */}
      <Card className="border-[var(--color-300)] bg-[var(--color-white)]">
        <CardHeader>
          <CardTitle className="text-lg text-[var(--color-600)]">Alle Berichten</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-[var(--color-500)] py-8">
              Nog geen berichten aangemaakt.
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
                          <div className="flex-1 min-w-0">
                            {notification.setting_value.title && (
                              <p className="text-sm font-semibold text-[var(--color-700)] mb-1">
                                {notification.setting_value.title}
                              </p>
                            )}
                            <p className="text-sm text-[var(--color-600)] line-clamp-2">
                              {notification.setting_value.message}
                            </p>
                          </div>
                          <Badge className={`shrink-0 ${getTypeBadgeClass(notification.setting_value.type)}`}>
                            {NOTIFICATION_TYPES.find(t => t.value === notification.setting_value.type)?.label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {target.type === 'users' && <UserCheck className="w-3 h-3 text-[var(--color-500)]" />}
                          {target.type === 'roles' && <Users className="w-3 h-3 text-[var(--color-500)]" />}
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

                        <p className="text-xs text-[var(--color-500)]">{formatDateRange(notification)}</p>
                        
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
                      <TableHead>Periode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => {
                      const target = getTargetDescription(notification);
                      return (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium text-[var(--color-600)] max-w-[200px]">
                            {notification.setting_value.title && (
                              <span className="font-semibold text-[var(--color-700)] block">{notification.setting_value.title}</span>
                            )}
                            <span className="truncate block">{notification.setting_value.message}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeBadgeClass(notification.setting_value.type)}>
                              {NOTIFICATION_TYPES.find(t => t.value === notification.setting_value.type)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {target.type === 'users' && <UserCheck className="w-4 h-4 text-[var(--color-500)]" />}
                              {target.type === 'roles' && <Users className="w-4 h-4 text-[var(--color-500)]" />}
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
                            <span className="text-xs text-[var(--color-500)]">{formatDateRange(notification)}</span>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(notification)}
                                className="h-8 w-8 p-0 hover:bg-[var(--color-100)]"
                              >
                                <Edit className="h-4 w-4 text-[var(--color-600)]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                                className="text-[var(--color-destructive)] h-8 w-8 p-0 hover:bg-red-50"
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
