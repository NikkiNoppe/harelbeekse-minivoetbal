import { useState } from 'react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, ShieldAlert, UserCheck } from 'lucide-react';
import { RefereeDashboard } from '@/components/pages/public/scheidsrechters';
import {
  PollManagement,
  AssignmentWorkspace,
  WorkflowBanner,
  CreatePollModal,
  PollDetailModal,
} from './components';
import type { MonthlyPoll } from '@/services/scheidsrechter/types';
import { useAuth } from '@/hooks/useAuth';

const ScheidsrechtersPage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'assign' | 'polls'>('assign');
  const [bannerKey, setBannerKey] = useState(0);
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPoll, setDetailPoll] = useState<MonthlyPoll | null>(null);

  const userRole = user?.role || null;

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-2">
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">Gebruikersgegevens laden...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  if (userRole === 'admin') {
    const refreshAll = () => {
      setBannerKey((k) => k + 1);
      setWorkspaceKey((k) => k + 1);
    };

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Scheidsrechter Beheer</h1>
          <p className="text-muted-foreground mt-1">
            Polls aanmaken, beschikbaarheid bekijken en wedstrijden toewijzen
          </p>
        </div>

        <WorkflowBanner
          refreshKey={bannerKey}
          onCreatePoll={() => setCreateOpen(true)}
          onOpenPollDetail={(poll) => setDetailPoll(poll)}
          onAfterAction={refreshAll}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assign' | 'polls')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="assign" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Toewijzen
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Polls archief
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="mt-6">
            <AssignmentWorkspace refreshKey={workspaceKey} onAfterChange={refreshAll} />
          </TabsContent>

          <TabsContent value="polls" className="mt-6">
            <PollManagement />
          </TabsContent>
        </Tabs>

        <CreatePollModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={refreshAll}
        />
        {detailPoll && (
          <PollDetailModal
            isOpen={!!detailPoll}
            onClose={() => setDetailPoll(null)}
            poll={detailPoll}
          />
        )}
      </div>
    );
  }

  return <RefereeDashboard />;
};

export default ScheidsrechtersPage;
