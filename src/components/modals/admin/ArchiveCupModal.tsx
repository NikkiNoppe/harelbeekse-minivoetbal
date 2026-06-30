import React, { useEffect, useState } from 'react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { archiveService, deriveSeasonLabel, ArchivedCupWinner } from '@/services/archiveService';
import { useArchives, useArchiveCup } from '@/hooks/useArchives';
import { seasonService } from '@/services/seasonService';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, Trophy } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ArchiveCupModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [label, setLabel] = useState('');
  const [cup, setCup] = useState<ArchivedCupWinner | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: archives } = useArchives();
  const { mutateAsync, isPending } = useArchiveCup();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const season = await seasonService.getSeasonData().catch(() => null);
        setLabel(deriveSeasonLabel(season?.season_start_date, season?.season_end_date));
        const snap = await archiveService.snapshotCurrentCupFinal();
        setCup(snap);
      } catch (e: any) {
        toast({ title: 'Fout bij laden', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, toast]);

  const exists = !!archives?.find((a) => a.season_label === label && a.cup_winner);

  const handleConfirm = async () => {
    if (!label.trim()) {
      toast({ title: 'Seizoenlabel ontbreekt', variant: 'destructive' });
      return;
    }
    if (!cup) {
      toast({ title: 'Geen bekerfinale gevonden om te archiveren', variant: 'destructive' });
      return;
    }
    try {
      await mutateAsync({ label: label.trim(), cup });
      toast({ title: 'Beker gearchiveerd', description: `${cup.winner} bewaard als winnaar.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Fout bij archiveren', description: e.message, variant: 'destructive' });
    }
  };

  const updateField = <K extends keyof ArchivedCupWinner>(key: K, value: ArchivedCupWinner[K]) => {
    setCup((prev) => ({
      winner: prev?.winner ?? '',
      runner_up: prev?.runner_up ?? '',
      home_score: prev?.home_score ?? null,
      away_score: prev?.away_score ?? null,
      match_date: prev?.match_date ?? null,
      final: prev?.final,
      semi_finals: prev?.semi_finals,
      ...prev,
      [key]: value,
    }));
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Beker archiveren"
      subtitle="Bewaar de bekerwinnaar en finale-uitslag van dit seizoen."
      size="md"
      showCloseButton
      primaryAction={{
        label: exists ? 'Overschrijven' : 'Archiveer beker',
        onClick: handleConfirm,
        variant: exists ? 'destructive' : 'primary',
        loading: isPending,
        disabled: loading || !cup?.winner,
      }}
      secondaryAction={{ label: 'Annuleren', onClick: () => onOpenChange(false), variant: 'secondary' }}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="cup-label">Seizoenlabel</Label>
          <Input id="cup-label" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>

        {exists && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Er bestaat al een gearchiveerde beker voor <strong>{label}</strong>. Bevestig om te overschrijven.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Laden...
          </div>
        ) : !cup ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Geen bekerfinale gevonden (match met nummer <code>FINAL</code>). Speel de finale eerst af.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-semibold">Finale-resultaat</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Winnaar</Label>
                  <Input value={cup.winner} onChange={(e) => updateField('winner', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Verliezer</Label>
                  <Input value={cup.runner_up} onChange={(e) => updateField('runner_up', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Score winnaar</Label>
                  <Input
                    type="number"
                    value={cup.home_score ?? ''}
                    onChange={(e) =>
                      updateField('home_score', e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Score verliezer</Label>
                  <Input
                    type="number"
                    value={cup.away_score ?? ''}
                    onChange={(e) =>
                      updateField('away_score', e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </div>
              </div>
              {cup.final && (
                <p className="text-xs text-amber-800/70">
                  Bekerfinale · {cup.final.home_team} – {cup.final.away_team}
                </p>
              )}
            </div>
            {(cup.semi_finals?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-brand-100 bg-brand-50/30 p-3 space-y-2">
                <p className="text-xs font-medium text-brand-800">Halve finales (worden mee gearchiveerd)</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {cup.semi_finals!.map((round) => (
                    <li key={round.label}>
                      {round.home_team} – {round.away_team}
                      {round.home_score !== null && round.away_score !== null
                        ? ` (${round.home_score}–${round.away_score})`
                        : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AppModal>
  );
};

export default ArchiveCupModal;
