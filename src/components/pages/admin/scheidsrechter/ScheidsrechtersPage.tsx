import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, ShieldAlert, UserCheck } from 'lucide-react';
import { RefereeDashboard } from '@/components/pages/public/scheidsrechters';
import {
  PollManagement,
  AssignmentWorkspace,
  WorkflowBanner,
  WorkflowStepper,
  CreatePollModal,
  PollDetailModal,
} from './components';
import type { WorkflowStep } from './components';
import { pollService } from '@/services/scheidsrechter/pollService';
import { refereeAvailabilityService } from '@/services/scheidsrechter/refereeAvailabilityService';
import { supabase } from '@/integrations/supabase/client';
import type { MonthlyPoll } from '@/services/scheidsrechter/types';
import { useAuth } from '@/hooks/useAuth';

interface MonthSnapshot {
  poll: MonthlyPoll | null;
  responded: number;
  totalReferees: number;
  matchesAssigned: number;
  matchesTotal: number;
}

const ScheidsrechtersPage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'assign' | 'polls'>('assign');
  const [bannerKey, setBannerKey] = useState(0);
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPoll, setDetailPoll] = useState<MonthlyPoll | null>(null);

  // Globale maand-state — single source of truth voor alle subcomponenten.
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Snapshot van de geselecteerde maand (voor stepper).
  const [snapshot, setSnapshot] = useState<MonthSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const userRole = user?.role || null;

  const loadSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    try {
      const poll = await pollService.getPollForMonth(selectedMonth);
      let responded = 0;
      let totalReferees = 0;
      let matchesAssigned = 0;
      let matchesTotal = 0;

      if (poll) {
        const stats = await refereeAvailabilityService.getAvailabilityStats(selectedMonth);
        responded = stats.responded_count;
        totalReferees = stats.total_referees;
      }

      const [year, monthNum] = selectedMonth.split('-').map(Number);
      const nextMonth =
        monthNum === 12
          ? `${year + 1}-01`
          : `${year}-${String(monthNum + 1).padStart(2, '0')}`;

      const { data: matchesData } = await supabase
        .from('matches')
        .select('match_id, assigned_referee_id, referee')
        .gte('match_date', `${selectedMonth}-01`)
        .lt('match_date', `${nextMonth}-01`);

      matchesTotal = matchesData?.length || 0;
      matchesAssigned = matchesData?.filter((m) => m.assigned_referee_id || m.referee).length || 0;

      setSnapshot({ poll, responded, totalReferees, matchesAssigned, matchesTotal });
    } catch (err) {
      console.error('[ScheidsrechtersPage] snapshot load error:', err);
      setSnapshot(null);
    } finally {
      setSnapshotLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (userRole === 'admin') loadSnapshot();
  }, [userRole, loadSnapshot, bannerKey, workspaceKey]);

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

    // Bouw 4 stappen op basis van snapshot
    const buildSteps = (): WorkflowStep[] => {
      const s = snapshot;
      // Default neutraal (laden)
      if (!s) {
        return [
          { id: '1', label: '1. Poll aanmaken', status: 'todo' },
          { id: '2', label: '2. Antwoorden', status: 'locked' },
          { id: '3', label: '3. Toewijzen', status: 'locked' },
          { id: '4', label: '4. Bevestigd', status: 'locked' },
        ];
      }

      const hasPoll = !!s.poll;
      const isOpen = s.poll?.status === 'open';
      const isClosed = s.poll?.status === 'closed' || s.poll?.status === 'completed';
      const responseRate =
        s.totalReferees > 0 ? Math.round((s.responded / s.totalReferees) * 100) : 0;
      const allAssigned = s.matchesTotal > 0 && s.matchesAssigned === s.matchesTotal;

      const step1Done = hasPoll;
      const step2Done = isClosed; // Antwoorden afgerond zodra poll gesloten is
      const step3Done = allAssigned;
      const step4Done = isClosed && allAssigned;

      const stepStatus = (done: boolean, prevDone: boolean): 'done' | 'current' | 'todo' | 'locked' => {
        if (done) return 'done';
        if (prevDone) return 'current';
        return 'locked';
      };

      return [
        {
          id: '1',
          label: '1. Poll aanmaken',
          description: hasPoll ? `Aangemaakt (${s.poll!.status})` : 'Nog te doen',
          status: step1Done ? 'done' : 'current',
          onClick: !hasPoll ? () => setCreateOpen(true) : () => s.poll && setDetailPoll(s.poll),
        },
        {
          id: '2',
          label: '2. Antwoorden',
          description: hasPoll
            ? `${s.responded}/${s.totalReferees} reageerden (${responseRate}%)`
            : 'In afwachting',
          status: step2Done ? 'done' : stepStatus(false, step1Done),
          onClick: hasPoll ? () => s.poll && setDetailPoll(s.poll) : undefined,
        },
        {
          id: '3',
          label: '3. Toewijzen',
          description:
            s.matchesTotal > 0
              ? `${s.matchesAssigned}/${s.matchesTotal} wedstrijden`
              : 'Geen wedstrijden',
          status: step3Done ? 'done' : stepStatus(false, step2Done),
          onClick: () => setActiveTab('assign'),
        },
        {
          id: '4',
          label: '4. Bevestigd',
          description: step4Done ? 'Klaar' : 'Sluit & wijs alles toe',
          status: step4Done ? 'done' : stepStatus(false, step3Done),
        },
      ];
    };

    return (
      <div className="scheids-page space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Scheidsrechter Beheer</h1>
          <p className="text-muted-foreground mt-1">
            Polls aanmaken, beschikbaarheid bekijken en wedstrijden toewijzen
          </p>
        </div>

        {/* 4-stappen Stepper */}
        <WorkflowStepper steps={buildSteps()} />

        <WorkflowBanner
          refreshKey={bannerKey}
          selectedMonth={selectedMonth}
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
            <AssignmentWorkspace
              refreshKey={workspaceKey}
              onAfterChange={refreshAll}
              selectedMonth={selectedMonth}
              onSelectedMonthChange={setSelectedMonth}
            />
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
