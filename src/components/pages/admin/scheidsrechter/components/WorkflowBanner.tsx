import React, { useEffect, useState, useCallback } from 'react';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  CalendarPlus,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { pollService } from '@/services/scheidsrechter/pollService';
import { refereeAvailabilityService } from '@/services/scheidsrechter/refereeAvailabilityService';
import { supabase } from '@/integrations/supabase/client';
import type { MonthlyPoll } from '@/services/scheidsrechter/types';

interface WorkflowBannerProps {
  onCreatePoll: () => void;
  onOpenPollDetail: (poll: MonthlyPoll) => void;
  refreshKey?: number;
  onAfterAction?: () => void;
  /** Externe maand (YYYY-MM). Indien gezet, focust de banner op die maand i.p.v. de meest recente actieve poll. */
  selectedMonth?: string;
}

interface BannerData {
  poll: MonthlyPoll | null;
  responded: number;
  totalReferees: number;
  matchesAssigned: number;
  matchesTotal: number;
}

/**
 * Banner die altijd toont wat de volgende admin-actie is.
 * - Geen actieve poll → CTA "Nieuwe poll aanmaken"
 * - Poll open → toont voortgang + CTA om te sluiten of detail te bekijken
 * - Poll gesloten + niet alles toegewezen → CTA om toe te wijzen
 * - Alles toegewezen → success-state
 */
export const WorkflowBanner: React.FC<WorkflowBannerProps> = ({
  onCreatePoll,
  onOpenPollDetail,
  refreshKey = 0,
  onAfterAction,
  selectedMonth,
}) => {
  const [data, setData] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Pak poll voor geselecteerde maand indien aanwezig, anders meest recente actieve poll.
      const allPolls = await pollService.getAllPolls();
      const activePoll = selectedMonth
        ? allPolls.find((p) => p.poll_month === selectedMonth) || null
        : allPolls.find((p) => p.status === 'open') ||
          allPolls.find((p) => p.status === 'closed') ||
          null;

      let responded = 0;
      let totalReferees = 0;
      let matchesAssigned = 0;
      let matchesTotal = 0;

      if (activePoll) {
        const stats = await refereeAvailabilityService.getAvailabilityStats(
          activePoll.poll_month
        );
        responded = stats.responded_count;
        totalReferees = stats.total_referees;

        // Tel matches in die maand + toegewezen
        const [year, monthNum] = activePoll.poll_month.split('-').map(Number);
        const nextMonth =
          monthNum === 12
            ? `${year + 1}-01`
            : `${year}-${String(monthNum + 1).padStart(2, '0')}`;

        const { data: matchesData } = await supabase
          .from('matches')
          .select('match_id, assigned_referee_id, referee')
          .gte('match_date', `${activePoll.poll_month}-01`)
          .lt('match_date', `${nextMonth}-01`);

        matchesTotal = matchesData?.length || 0;
        matchesAssigned =
          matchesData?.filter((m) => m.assigned_referee_id || m.referee)
            .length || 0;
      }

      setData({
        poll: activePoll,
        responded,
        totalReferees,
        matchesAssigned,
        matchesTotal,
      });
    } catch (err) {
      console.error('[WorkflowBanner] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleClosePoll = async () => {
    if (!data?.poll) return;
    setActing(true);
    try {
      const ok = await pollService.closePoll(data.poll.id);
      if (ok) {
        toast.success('Poll gesloten');
        await loadData();
        onAfterAction?.();
      } else {
        toast.error('Kon poll niet sluiten');
      }
    } finally {
      setActing(false);
    }
  };

  const handleOpenPoll = async () => {
    if (!data?.poll) return;
    setActing(true);
    try {
      const ok = await pollService.openPoll(data.poll.id);
      if (ok) {
        toast.success('Poll heropend');
        await loadData();
        onAfterAction?.();
      } else {
        toast.error('Kon poll niet openen');
      }
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  // === Geen poll ===
  if (!data.poll) {
    const monthLabelEmpty = selectedMonth
      ? format(new Date(`${selectedMonth}-01`), 'MMMM yyyy', { locale: nl })
      : null;
    return (
      <Card className="p-5 border-l-4 border-l-primary bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <CalendarPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-foreground">
                {monthLabelEmpty ? `Nog geen poll voor ${monthLabelEmpty}` : 'Nog geen actieve poll'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Maak een poll aan zodat scheidsrechters hun beschikbaarheid kunnen doorgeven.
              </p>
            </div>
          </div>
          <Button onClick={onCreatePoll} className="shrink-0 gap-2">
            <CalendarPlus className="h-4 w-4" />
            Nieuwe poll aanmaken
          </Button>
        </div>
      </Card>
    );
  }

  const monthLabel = format(
    new Date(`${data.poll.poll_month}-01`),
    'MMMM yyyy',
    { locale: nl }
  );
  const responseRate =
    data.totalReferees > 0
      ? Math.round((data.responded / data.totalReferees) * 100)
      : 0;
  const allAssigned =
    data.matchesTotal > 0 && data.matchesAssigned === data.matchesTotal;

  // Deadline-info
  const deadline = data.poll.deadline ? new Date(data.poll.deadline) : null;
  const hoursToDeadline = deadline
    ? differenceInHours(deadline, new Date())
    : null;
  const isUrgent =
    data.poll.status === 'open' &&
    hoursToDeadline !== null &&
    hoursToDeadline < 24 &&
    hoursToDeadline > -24;

  // Bepaal kleur + icon obv state
  let accentClass = 'border-l-primary bg-primary/5';
  let iconBgClass = 'bg-primary/15';
  let iconColorClass = 'text-primary';
  let Icon = Users;
  let title = '';
  let description = '';

  if (data.poll.status === 'open') {
    if (isUrgent) {
      accentClass = 'border-l-warning bg-warning/5';
      iconBgClass = 'bg-warning/15';
      iconColorClass = 'text-warning';
      Icon = AlertTriangle;
    }
    title = `Poll loopt — ${monthLabel}`;
    description = `${data.responded}/${data.totalReferees} scheidsrechters reageerden (${responseRate}%)`;
    if (deadline) {
      const dist = formatDistanceToNow(deadline, {
        locale: nl,
        addSuffix: true,
      });
      description += ` · Deadline ${dist}`;
    }
  } else if (data.poll.status === 'closed') {
    if (allAssigned) {
      accentClass = 'border-l-success bg-success/5';
      iconBgClass = 'bg-success/15';
      iconColorClass = 'text-success';
      Icon = CheckCircle2;
      title = `Klaar voor ${monthLabel}`;
      description = `Alle ${data.matchesTotal} wedstrijden zijn toegewezen.`;
    } else {
      accentClass = 'border-l-warning bg-warning/5';
      iconBgClass = 'bg-warning/15';
      iconColorClass = 'text-warning';
      Icon = Clock;
      const remaining = data.matchesTotal - data.matchesAssigned;
      title = `Wijs ${remaining} wedstrijden toe`;
      description = `Poll voor ${monthLabel} is gesloten. ${data.matchesAssigned}/${data.matchesTotal} wedstrijden hebben een scheidsrechter.`;
    }
  } else {
    title = `Poll — ${monthLabel}`;
    description = `Status: ${data.poll.status}`;
  }

  return (
    <Card className={`p-5 border-l-4 ${accentClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`h-12 w-12 rounded-full ${iconBgClass} flex items-center justify-center shrink-0`}
          >
            <Icon className={`h-6 w-6 ${iconColorClass}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>

            {/* Mini-progress bars */}
            {data.poll.status === 'open' && data.totalReferees > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1 max-w-[200px]">
                  <div
                    className={`h-full transition-all ${
                      isUrgent ? 'bg-warning' : 'bg-primary'
                    }`}
                    style={{ width: `${responseRate}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {responseRate}%
                </span>
              </div>
            )}
            {data.poll.status === 'closed' && data.matchesTotal > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1 max-w-[200px]">
                  <div
                    className={`h-full transition-all ${
                      allAssigned ? 'bg-success' : 'bg-warning'
                    }`}
                    style={{
                      width: `${Math.round(
                        (data.matchesAssigned / data.matchesTotal) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {data.matchesAssigned}/{data.matchesTotal}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenPollDetail(data.poll!)}
          >
            Detail
          </Button>
          {data.poll.status === 'open' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClosePoll}
              disabled={acting}
              className="gap-1.5"
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Sluit poll
            </Button>
          )}
          {data.poll.status === 'closed' && !allAssigned && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPoll}
              disabled={acting}
              className="gap-1.5"
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Heropen
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WorkflowBanner;
