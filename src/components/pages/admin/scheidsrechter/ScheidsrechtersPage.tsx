import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Users } from 'lucide-react';
import { RefereeDashboard } from '@/components/pages/public/scheidsrechters';
import { PollManagement, AssignmentManagement } from './components';

// Main component
const ScheidsrechtersPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<'polls' | 'assignments'>('assignments');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
    setIsLoadingRole(false);
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {isLoadingRole ? (
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
      ) : userRole === 'admin' ? (
        <>
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
        </>
      ) : (
        // For referees - show their dashboard
        <RefereeDashboard />
      )}
    </div>
  );
};

export default ScheidsrechtersPage;
