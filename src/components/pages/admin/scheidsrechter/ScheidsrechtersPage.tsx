import { useState } from 'react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Users, ShieldAlert } from 'lucide-react';
import { RefereeDashboard } from '@/components/pages/public/scheidsrechters';
import { PollManagement, AssignmentManagement } from './components';
import { useAuth } from '@/hooks/useAuth';

// Main component
const ScheidsrechtersPage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'polls' | 'assignments'>('assignments');

  const userRole = user?.role || null;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-2">
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">
                Gebruikersgegevens laden...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in or no role
  if (!userRole) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Geen toegang</h2>
            <p className="text-sm text-muted-foreground">
              Log in om toegang te krijgen tot het scheidsrechtersbeheer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin view
  if (userRole === 'admin') {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Scheidsrechter Beheer</h1>
            <p className="text-muted-foreground mt-1">
              Beheer polls en toewijzingen
            </p>
          </div>
        </div>
        
        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'polls' | 'assignments')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="assignments" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Toewijzingen</span>
              <span className="sm:hidden">Toewijzen</span>
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Polls</span>
              <span className="sm:hidden">Polls</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments" className="mt-6">
            <AssignmentManagement />
          </TabsContent>
          
          <TabsContent value="polls" className="mt-6">
            <PollManagement />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Referee view
  return <RefereeDashboard />;
};

export default ScheidsrechtersPage;
