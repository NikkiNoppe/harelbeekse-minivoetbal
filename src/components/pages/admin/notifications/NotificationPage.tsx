import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { notificationService, type Notification } from '@/services/notificationService';
import {
  ADMIN_NOTIFICATIONS_QUERY_KEY,
  useAdminNotifications,
} from '@/hooks/useAdminNotifications';
import { Plus, Edit, Trash2, Users, UserCheck, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NotificationFormModal } from '@/components/modals';
import { AppAlertModal, DestructiveConfirmDescription } from '@/components/modals';

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
}

const DEFAULT_FORM_DATA: FormData = {
  title: '',
  message: '',
  type: 'info',
  target_roles: [],
  target_users: [],
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
};

const NotificationListSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 border border-border rounded-lg space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

const NotificationPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    notifications = [],
    users = [],
    isListLoading,
    isRefreshing,
    showError,
    showEmpty,
    error,
    refetch,
  } = useAdminNotifications();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [initialFormData, setInitialFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [initialTargetMode, setInitialTargetMode] = useState<TargetMode>('roles');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY });
    await refetch();
  }, [queryClient, refetch]);

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
      };

      if (editingNotification) {
        await notificationService.updateNotification(editingNotification.id, notificationData);
        toast({ title: 'Succes', description: 'Bericht bijgewerkt' });
      } else {
        await notificationService.createNotification(notificationData);
        toast({ title: 'Succes', description: 'Bericht aangemaakt' });
      }

      await refreshData();
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
  }, [editingNotification, toast, refreshData]);

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
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    setIsDeleting(true);
    try {
      await notificationService.deleteNotification(id);
      toast({ title: 'Succes', description: 'Bericht verwijderd' });
      await refreshData();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Kon bericht niet verwijderen',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  }, [toast, refreshData]);

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

  return (
    <div className="space-y-6 w-full motion-safe:animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            Berichten
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Beheer berichten voor gebruikers en teams</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isRefreshing && !isListLoading && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Vernieuwen…
            </span>
          )}
          <Button onClick={handleOpenNew} className="btn--primary w-full sm:w-auto min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Bericht
          </Button>
        </div>
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
          {isListLoading ? (
            <NotificationListSkeleton />
          ) : showError ? (
            <div className="py-8 text-center" role="alert">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" aria-hidden />
              <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {error instanceof Error ? error.message : 'Kon gegevens niet laden.'}
              </p>
              <Button type="button" onClick={() => void refetch()} className="min-h-[44px]">
                Opnieuw proberen
              </Button>
            </div>
          ) : showEmpty ? (
            <p className="text-center text-[var(--color-500)] py-8 text-sm">
              Nog geen berichten aangemaakt.
            </p>
          ) : (
            <div className={isRefreshing ? 'opacity-80 transition-opacity' : ''}>
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

                        <div className="flex items-center justify-end gap-1">
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
                              onClick={() => setDeleteConfirmId(notification.id)}
                              className="text-destructive h-10 w-10 p-0 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                                onClick={() => setDeleteConfirmId(notification.id)}
                                className="text-destructive h-8 w-8 p-0 hover:bg-destructive/10"
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
            </div>
          )}
        </CardContent>
      </Card>

      <AppAlertModal
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Bericht verwijderen"
        description={
          <DestructiveConfirmDescription message="Weet je zeker dat je dit bericht wilt verwijderen?" />
        }
        confirmAction={{
          label: isDeleting ? 'Verwijderen...' : 'Verwijderen',
          onClick: () => deleteConfirmId !== null && handleDelete(deleteConfirmId),
          variant: 'destructive'
        }}
        cancelAction={{
          label: 'Annuleren',
          onClick: () => setDeleteConfirmId(null)
        }}
      />
    </div>
  );
};

export default NotificationPage;
