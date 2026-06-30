import React, { useEffect, useState } from 'react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { archiveService, deriveSeasonLabel, ArchivedStanding } from '@/services/archiveService';
import { useArchives, useArchiveCompetition } from '@/hooks/useArchives';
import { seasonService } from '@/services/seasonService';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ArchiveSeasonModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [label, setLabel] = useState('');
  const [standings, setStandings] = useState<ArchivedStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: archives } = useArchives();
  const { mutateAsync, isPending } = useArchiveCompetition();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const season = await seasonService.getSeasonData().catch(() => null);
        setLabel(deriveSeasonLabel(season?.season_start_date, season?.season_end_date));
        const snap = await archiveService.snapshotCurrentStandings();
        setStandings(snap);
      } catch (e: any) {
        toast({ title: 'Fout bij laden', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, toast]);

  const exists = !!archives?.find((a) => a.season_label === label && a.competition_standings);

  const handleConfirm = async () => {
    if (!label.trim()) {
      toast({ title: 'Seizoenlabel ontbreekt', variant: 'destructive' });
      return;
    }
    if (standings.length === 0) {
      toast({ title: 'Geen klassement beschikbaar om te archiveren', variant: 'destructive' });
      return;
    }
    try {
      await mutateAsync({ label: label.trim(), standings });
      toast({ title: 'Seizoen gearchiveerd', description: `Klassement ${label} bewaard.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Fout bij archiveren', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Seizoen archiveren"
      subtitle="Bewaar het huidige eindklassement permanent in het archief."
      size="md"
      showCloseButton
      primaryAction={{
        label: exists ? 'Overschrijven' : 'Archiveer competitie',
        onClick: handleConfirm,
        variant: exists ? 'destructive' : 'primary',
        loading: isPending,
        disabled: loading || standings.length === 0,
      }}
      secondaryAction={{ label: 'Annuleren', onClick: () => onOpenChange(false), variant: 'secondary' }}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="season-label">Seizoenlabel</Label>
          <Input
            id="season-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="bv. 2025-2026"
          />
        </div>

        {exists && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Er bestaat al een gearchiveerd klassement voor <strong>{label}</strong>. Bevestig om te overschrijven.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <div className="text-sm font-medium text-brand-800 mb-2">Preview eindklassement</div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Laden...
            </div>
          ) : standings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen klassementgegevens beschikbaar.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-brand-100 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-brand-50 text-brand-900 text-xs uppercase">
                  <tr>
                    <th className="px-2 py-1 text-left w-8">#</th>
                    <th className="px-2 py-1 text-left">Team</th>
                    <th className="px-2 py-1 text-center">G</th>
                    <th className="px-2 py-1 text-center">Pt</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s) => (
                    <tr key={s.position} className="border-t border-brand-50">
                      <td className="px-2 py-1 font-semibold">{s.position}</td>
                      <td className="px-2 py-1">{s.team_name}</td>
                      <td className="px-2 py-1 text-center">{s.played}</td>
                      <td className="px-2 py-1 text-center font-bold">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
};

export default ArchiveSeasonModal;
