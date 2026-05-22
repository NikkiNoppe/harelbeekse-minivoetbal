import React, { useEffect, useState } from 'react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { archiveService, deriveSeasonLabel, ArchivedPlayoff } from '@/services/archiveService';
import { useArchives, useArchivePlayoff } from '@/hooks/useArchives';
import { seasonService } from '@/services/seasonService';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, Target, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RankPreview: React.FC<{
  title: string;
  variant: 'top' | 'bottom';
  rows: ArchivedPlayoff['top_ranking'];
}> = ({ title, variant, rows }) => {
  if (!rows.length) return null;
  const accent =
    variant === 'top'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';

  return (
    <div className="space-y-2">
      <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider', accent)}>
        {title}
      </Badge>
      <div className="max-h-40 overflow-y-auto border border-purple-100 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-purple-50 text-purple-900 text-xs uppercase">
            <tr>
              <th className="px-2 py-1 text-left w-8">#</th>
              <th className="px-2 py-1 text-left">Team</th>
              <th className="px-2 py-1 text-center">Ptn</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${variant}-${r.position}`} className="border-t border-purple-50">
                <td className="px-2 py-1 font-semibold">{r.position}</td>
                <td className="px-2 py-1">{r.team_name}</td>
                <td className="px-2 py-1 text-center font-bold">{r.total_points ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ArchivePlayoffModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [label, setLabel] = useState('');
  const [playoff, setPlayoff] = useState<ArchivedPlayoff | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: archives } = useArchives();
  const { mutateAsync, isPending } = useArchivePlayoff();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const season = await seasonService.getSeasonData().catch(() => null);
        setLabel(deriveSeasonLabel(season?.season_start_date, season?.season_end_date));
        const snap = await archiveService.snapshotCurrentPlayoff();
        setPlayoff(snap);
      } catch (e: any) {
        toast({ title: 'Fout bij laden', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, toast]);

  const exists = !!archives?.find((a) => a.season_label === label && a.playoff);
  const hasData = !!playoff && (playoff.top_ranking.length > 0 || playoff.bottom_ranking.length > 0);

  const handleConfirm = async () => {
    if (!label.trim()) {
      toast({ title: 'Seizoenlabel ontbreekt', variant: 'destructive' });
      return;
    }
    if (!playoff || !hasData) {
      toast({ title: 'Geen playoffgegevens beschikbaar om te archiveren', variant: 'destructive' });
      return;
    }
    try {
      await mutateAsync({ label: label.trim(), playoff });
      toast({ title: 'Playoffs gearchiveerd', description: `Playoff ${label} bewaard.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Fout bij archiveren', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Playoffs archiveren"
      subtitle="Bewaar de playoff-indeling en eindstand permanent in het archief."
      size="lg"
      showCloseButton
      primaryAction={{
        label: exists ? 'Overschrijven' : 'Archiveer playoffs',
        onClick: handleConfirm,
        variant: exists ? 'destructive' : 'primary',
        loading: isPending,
        disabled: loading || !hasData,
      }}
      secondaryAction={{ label: 'Annuleren', onClick: () => onOpenChange(false), variant: 'secondary' }}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="playoff-label">Seizoenlabel</Label>
          <Input
            id="playoff-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="bv. 2025-2026"
          />
        </div>

        {exists && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Er bestaat al een gearchiveerde playoff voor <strong>{label}</strong>. Bevestig om te overschrijven.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-purple-800 mb-2">
            <Target className="w-4 h-4" />
            Preview playoff-archief
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Laden...
            </div>
          ) : !hasData ? (
            <p className="text-sm text-muted-foreground">Geen playoffgegevens beschikbaar.</p>
          ) : (
            <div className="space-y-4">
              {playoff?.final && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <div className="flex items-center gap-2 text-amber-800 mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Finale</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{playoff.final.home_team}</span>
                    <span className="font-bold mx-3 tabular-nums">
                      {playoff.final.home_score ?? '-'} – {playoff.final.away_score ?? '-'}
                    </span>
                    <span className="font-medium truncate text-right">{playoff.final.away_team}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RankPreview title="Play-Off 1" variant="top" rows={playoff?.top_ranking ?? []} />
                <RankPreview title="Play-Off 2" variant="bottom" rows={playoff?.bottom_ranking ?? []} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
};

export default ArchivePlayoffModal;
