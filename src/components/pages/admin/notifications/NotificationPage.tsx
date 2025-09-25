import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { notificationService, type Notification } from '@/services/notificationService';
import { Plus, Edit, Trash2, Bell, Calendar, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Constants outside component to prevent re-creation
const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Informatie' },
  { value: 'warning', label: 'Waarschuwing' },
  { value: 'success', label: 'Succes' },
  { value: 'error', label: 'Fout' }
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'referee', label: 'Scheidsrechter' },
  { value: 'team_manager', label: 'Team Manager' }
];

const DEFAULT_FORM_DATA = {
  message: '',
  type: 'info' as 'info' | 'warning' | 'success' | 'error',
  target_roles: [] as string[],
  start_date: '',
  end_date: '',
  is_active: true
};

const NotificationPage: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<typeof DEFAULT_FORM_DATA>(DEFAULT_FORM_DATA);

  // Optimized load function using service
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Kon notificaties niet laden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingNotification(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const notificationData = {
        setting_category: 'notifications',
        setting_name: editingNotification ? editingNotification.setting_name : `notification_${Date.now()}`,
        setting_value: {
          message: formData.message,
          type: formData.type,
          target_roles: formData.target_roles,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          created_at: new Date().toISOString()
        },
        is_active: formData.is_active
      };

      if (editingNotification) {
        await notificationService.updateNotification(editingNotification.id, notificationData);
        toast({
          title: 'Succes',
          description: 'Notificatie bijgewerkt'
        });
      } else {
        await notificationService.createNotification(notificationData);
        toast({
          title: 'Succes',
          description: 'Notificatie aangemaakt'
        });
      }

      await loadNotifications();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: 'Error',
        description: 'Kon notificatie niet opslaan',
        variant: 'destructive'
      });
    }
  }, [formData, editingNotification, toast, resetForm, loadNotifications]);

  const handleEdit = useCallback((notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      message: notification.setting_value.message,
      type: notification.setting_value.type as 'info' | 'warning' | 'success' | 'error',
      target_roles: notification.setting_value.target_roles || [],
      start_date: notification.setting_value.start_date || '',
      end_date: notification.setting_value.end_date || '',
      is_active: notification.is_active
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Weet je zeker dat je deze notificatie wilt verwijderen?')) return;
    
    try {
      await notificationService.deleteNotification(id);
      toast({
        title: 'Succes',
        description: 'Notificatie verwijderd'
      });
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Kon notificatie niet verwijderen',
        variant: 'destructive'
      });
    }
  }, [toast, loadNotifications]);

  const toggleActive = useCallback(async (notification: Notification) => {
    try {
      await notificationService.toggleNotificationStatus(notification.id, !notification.is_active);
      toast({
        title: 'Succes',
        description: `Notificatie ${!notification.is_active ? 'geactiveerd' : 'gedeactiveerd'}`
      });
      await loadNotifications();
    } catch (error) {
      console.error('Error toggling notification status:', error);
      toast({
        title: 'Error',
        description: 'Kon notificatie status niet wijzigen',
        variant: 'destructive'
      });
    }
  }, [toast, loadNotifications]);

  const getTypeBadgeVariant = useCallback((type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  }, []);

  // Event handlers
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, message: e.target.value }));
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, type: value as 'info' | 'warning' | 'success' | 'error' }));
  }, []);

  const handleRoleToggle = useCallback((role: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  }, []);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, start_date: e.target.value }));
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, end_date: e.target.value }));
  }, []);

  const handleActiveChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  }, []);

  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Laden...</div>
    </div>
  ), []);

  if (loading) return LoadingComponent;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificaties</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="btn btn--primary"
              onClick={resetForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Notificatie
            </Button>
          </DialogTrigger>
          <DialogContent className="modal max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? 'Notificatie Bewerken' : 'Nieuwe Notificatie'}
              </DialogTitle>
              <DialogDescription>
                {editingNotification ? 'Bewerk de notificatie details' : 'Maak een nieuwe notificatie aan'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Bericht</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={handleMessageChange}
                    rows={4}
                    required
                    placeholder="Voer het notificatie bericht in..."
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Doelgroepen</Label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map(role => (
                    <div key={role.value} className="flex items-start">
                      <div className="w-1/5 flex justify-center pt-2">
                        <input
                          type="checkbox"
                          id={role.value}
                          checked={formData.target_roles.includes(role.value)}
                          onChange={() => handleRoleToggle(role.value)}
                          className="rounded border-gray-300 w-4 h-4"
                        />
                      </div>
                      <div className="w-4/5">
                        <Label htmlFor={role.value} className="text-sm">
                          {role.label}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">Start Datum</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleStartDateChange}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm font-medium">Eind Datum</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleEndDateChange}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={handleActiveChange}
                />
                <Label htmlFor="active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Actief
                </Label>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit"
                  className="btn btn--primary w-full sm:w-auto"
                >
                  {editingNotification ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle></CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen notificaties aangemaakt.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[900px]">
                <Table className="table w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Bericht</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[150px]">Doelgroepen</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Gemaakt</TableHead>
                      <TableHead className="text-center min-w-[120px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {notification.setting_value.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(notification.setting_value.type)}>
                          {NOTIFICATION_TYPES.find(t => t.value === notification.setting_value.type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(notification.setting_value.target_roles || []).map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {ROLE_OPTIONS.find(r => r.value === role)?.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={notification.is_active}
                            onCheckedChange={() => toggleActive(notification)}
                            className="scale-75"
                          />
                          <Badge variant={notification.is_active ? 'default' : 'secondary'} className="text-xs">
                            {notification.is_active ? 'Actief' : 'Inactief'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(notification.created_at).toLocaleDateString('nl-NL')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            className="btn btn--icon btn--edit"
                            onClick={() => handleEdit(notification)}
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            className="btn btn--icon btn--danger"
                            onClick={() => handleDelete(notification.id)}
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPage;
