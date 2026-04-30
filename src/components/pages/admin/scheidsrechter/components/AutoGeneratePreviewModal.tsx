import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Loader2, Sparkles, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { scheidsrechterService } from '@/services/scheidsrechter/scheidsrechterService';
import { formatDateWithDay, formatTimeForDisplay } from '@/lib/dateUtils';
import { getLocationOrder } from '@/lib/matchSortingUtils';

interface PreviewGroup {
  key: string;
  match_date: string;
  location: string;
  matches: Array<{ match_id: number; home: string; away: string; time: string }>;
  alreadyExists: boolean;
}

interface AutoGeneratePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** YYYY-MM */
  month: string;
  onSuccess?: () => void;
}

/**
 * Preview-modal voor "Auto-genereer poll-groepen". Toont per (datum × locatie) de
 * geplande groep, of er al een poll-groep bestaat, en hoeveel wedstrijden er onder vallen.
 * Pas op confirmatie wordt de edge function aangeroepen.
 */
export const AutoGeneratePreviewModal: React.FC<AutoGeneratePreviewModalProps> = ({
  open,
  onOpenChange,
  month,
  onSuccess,
}) => {
  const [groups, setGroups] = useState<PreviewGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [year, monthNum] = month.split('-').map(Number);
        const lastDay = new Date(year, monthNum, 0).getDate();
        const startDate = `${month}-01`;
        const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

        // 1) matches in maand
        const { data: matches, error } = await supabase
          .from('matches')
          .select('match_id, match_date, location, home_team_id, away_team_id, poll_group_id')
          .gte('match_date', startDate)
          .lte('match_date', `${endDate}T23:59:59`)
          .order('match_date');
        if (error) throw error;

        const teamIds = new Set<number>();
        (matches || []).forEach((m: any) => {
          if (m.home_team_id) teamIds.add(m.home_team_id);
          if (m.away_team_id) teamIds.add(m.away_team_id);
        });
        const { data: teams } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .in('team_id', Array.from(teamIds));
        const teamMap = new Map<number, string>(
          (teams || []).map((t: any) => [t.team_id, t.team_name]),
        );

        // 2) existing poll_match_dates voor deze maand
        const { data: existingPoll } = await supabase
          .from('monthly_polls' as any)
          .select('id, poll_month')
          .eq('poll_month', month)
          .maybeSingle();

        const existingKeys = new Set<string>();
        if (existingPoll && (existingPoll as any).id) {
          const { data: existingDates } = await supabase
            .from('poll_match_dates' as any)
            .select('match_date, location')
            .eq('poll_id', (existingPoll as any).id);
          (existingDates || []).forEach((d: any) => {
            const dOnly = String(d.match_date).split('T')[0];
            existingKeys.add(`${dOnly}__${d.location || 'Onbekend'}`);
          });
        }

        // 3) groepeer per (date, location)
        const groupMap = new Map<string, PreviewGroup>();
        (matches || []).forEach((m: any) => {
          const dateOnly = String(m.match_date).split('T')[0];
          const loc = m.location || 'Onbekend';
          const key = `${dateOnly}__${loc}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              key,
              match_date: m.match_date,
              location: loc,
              matches: [],
              alreadyExists: existingKeys.has(key),
            });
          }
          groupMap.get(key)!.matches.push({
            match_id: m.match_id,
            home: teamMap.get(m.home_team_id) || '?',
            away: teamMap.get(m.away_team_id) || '?',
            time: formatTimeForDisplay(m.match_date),
          });
        });

        const sorted = Array.from(groupMap.values()).sort((a, b) => {
          const dc = a.match_date.split('T')[0].localeCompare(b.match_date.split('T')[0]);
          if (dc !== 0) return dc;
          return getLocationOrder(a.location) - getLocationOrder(b.location);
        });

        if (!cancelled) setGroups(sorted);
      } catch (e) {
        console.error('[AutoGeneratePreview] error:', e);
        toast.error('Kon preview niet laden');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, month]);

  const newGroups = groups.filter((g) => !g.alreadyExists);
  const existingGroups = groups.filter((g) => g.alreadyExists);

  const handleConfirm = async () => {
    setRunning(true);
    try {
      const result = await scheidsrechterService.generateMonthlyPolls(month);
      if (result.success) {
        const created = (result as any).groups_created ?? 0;
        toast.success(
          created > 0
            ? `${created} poll-groep${created === 1 ? '' : 'en'} aangemaakt`
            : 'Geen nieuwe groepen aangemaakt (alles bestond al)',
        );
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error('Kon polls niet genereren');
      }
    } finally {
      setRunning(false);
    }
  };

  const monthLabel = format(new Date(`${month}-01`), 'MMMM yyyy', { locale: nl });

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Auto-genereer poll-groepen — ${monthLabel}`}
      size="lg"
      primaryAction={{
        label:
          newGroups.length > 0
            ? `Maak ${newGroups.length} groep${newGroups.length === 1 ? '' : 'en'} aan`
            : 'Niets te genereren',
        onClick: handleConfirm,
        disabled: running || loading || newGroups.length === 0,
        loading: running,
      }}
      secondaryAction={{
        label: 'Annuleren',
        onClick: () => onOpenChange(false),
      }}
    >
      <div className="space-y-3 text-sm">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preview laden…
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-md border border-[hsl(var(--color-200))] bg-muted/30 p-4 text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            Geen wedstrijden gevonden voor {monthLabel}. Plan eerst wedstrijden via /admin/wedstrijden.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-success/15 text-[hsl(var(--color-700))] border-success/30">
                {newGroups.length} nieuw
              </Badge>
              {existingGroups.length > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {existingGroups.length} bestaat al
                </Badge>
              )}
            </div>

            <div className="rounded-lg border border-[hsl(var(--color-200))] divide-y divide-[hsl(var(--color-200))] max-h-[50vh] overflow-y-auto">
              {groups.map((g) => (
                <div
                  key={g.key}
                  className={`px-3 py-2 flex items-start gap-3 ${
                    g.alreadyExists ? 'bg-muted/30' : 'bg-card'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {g.alreadyExists ? (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[hsl(var(--color-700))]">
                      {formatDateWithDay(g.match_date)} · {g.location}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {g.matches.length} wedstrijd{g.matches.length === 1 ? '' : 'en'} ·{' '}
                      {g.matches
                        .slice(0, 3)
                        .map((m) => `${m.home} – ${m.away}`)
                        .join(' · ')}
                      {g.matches.length > 3 && ` …`}
                    </div>
                  </div>
                  {g.alreadyExists && (
                    <span className="text-[11px] text-muted-foreground shrink-0">bestaat al</span>
                  )}
                </div>
              ))}
            </div>

            {newGroups.length === 0 && existingGroups.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                Alle groepen voor {monthLabel} bestaan al — er valt niets te genereren.
              </div>
            )}
          </>
        )}
      </div>
    </AppModal>
  );
};

export default AutoGeneratePreviewModal;
