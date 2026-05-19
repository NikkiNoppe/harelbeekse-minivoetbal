import React, { useEffect, useMemo, useState } from 'react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Copy, Check, Info, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seasonService } from '@/services/seasonService';
import { deriveSeasonLabel } from '@/services/archiveService';
import {
  PLAYOFF_ARCHIVE,
  PlayoffArchiveEntry,
} from '@/data/playoffArchive';

interface StandingRow {
  position: number;
  team_name: string;
  points: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standings: StandingRow[];
  topTeamCount: number;
  bottomTeamCount: number;
}

const PlayoffArchiveSnapshotModal: React.FC<Props> = ({
  open,
  onOpenChange,
  standings,
  topTeamCount,
  bottomTeamCount,
}) => {
  const { toast } = useToast();
  const [label, setLabel] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    (async () => {
      try {
        const season = await seasonService.getSeasonData().catch(() => null);
        setLabel(deriveSeasonLabel(season?.season_start_date, season?.season_end_date));
      } catch {
        setLabel(deriveSeasonLabel());
      }
    })();
  }, [open]);

  const entry: PlayoffArchiveEntry = useMemo(() => {
    const sorted = [...standings].sort((a, b) => a.position - b.position);
    const top = sorted
      .filter((s) => s.position <= topTeamCount)
      .map((s) => ({ position: s.position, team_name: s.team_name, total_points: s.points }));
    const bottom = sorted
      .filter((s) => s.position > topTeamCount && s.position <= topTeamCount + bottomTeamCount)
      .map((s) => ({ position: s.position, team_name: s.team_name, total_points: s.points }));
    return {
      season_label: label || 'YYYY-YYYY',
      top_ranking: top,
      bottom_ranking: bottom,
      final: null,
    };
  }, [standings, topTeamCount, bottomTeamCount, label]);

  const snippet = useMemo(() => {
    // Render compact, paste-ready JS object literal
    const lines: string[] = [];
    lines.push('  {');
    lines.push(`    season_label: '${entry.season_label}',`);
    lines.push('    top_ranking: [');
    entry.top_ranking.forEach((r) => {
      lines.push(
        `      { position: ${r.position}, team_name: ${JSON.stringify(r.team_name)}, total_points: ${r.total_points ?? 0} },`,
      );
    });
    lines.push('    ],');
    lines.push('    bottom_ranking: [');
    entry.bottom_ranking.forEach((r) => {
      lines.push(
        `      { position: ${r.position}, team_name: ${JSON.stringify(r.team_name)}, total_points: ${r.total_points ?? 0} },`,
      );
    });
    lines.push('    ],');
    lines.push('    final: {');
    lines.push(`      home_team: ${JSON.stringify(entry.top_ranking[0]?.team_name ?? '')},`);
    lines.push(`      away_team: ${JSON.stringify(entry.top_ranking[1]?.team_name ?? '')},`);
    lines.push('      home_score: null,');
    lines.push('      away_score: null,');
    lines.push('      match_date: null,');
    lines.push('    },');
    lines.push('  },');
    return lines.join('\n');
  }, [entry]);

  const exists = PLAYOFF_ARCHIVE.some((e) => e.season_label === entry.season_label);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast({ title: 'Snippet gekopieerd', description: 'Plak deze in src/data/playoffArchive.ts' });
      setTimeout(() => setCopied(false), 2500);
    } catch (e: any) {
      toast({ title: 'Kopiëren mislukt', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Playoff archief - snapshot"
      subtitle="Genereer een snippet en plak die in src/data/playoffArchive.ts"
      size="lg"
      showCloseButton
      primaryAction={{
        label: copied ? 'Gekopieerd' : 'Kopieer snippet',
        onClick: handleCopy,
        variant: 'primary',
      }}
      secondaryAction={{ label: 'Sluiten', onClick: () => onOpenChange(false), variant: 'secondary' }}
    >
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs leading-relaxed">
            Playoff-archief is bewust <strong>hardcoded</strong> (niet in Supabase). Pas de teamvolgorde
            en finalescore aan in de snippet voor je plakt in{' '}
            <code className="text-[11px]">src/data/playoffArchive.ts</code> binnen de array{' '}
            <code className="text-[11px]">PLAYOFF_ARCHIVE</code>.
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="po-label">Seizoenlabel</Label>
          <Input id="po-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          {exists && (
            <p className="text-xs text-amber-700 mt-1">
              Let op: er bestaat al een hardcoded entry met dit label.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3 space-y-2">
          <div className="flex items-center gap-2 text-purple-800">
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold">Huidige stand als startpunt</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {entry.top_ranking.length} top-teams · {entry.bottom_ranking.length} bottom-teams.
            Aangevuld vanuit de competitiestand.
          </p>
        </div>

        <div className="relative">
          <Label className="text-xs">Snippet (paste-ready)</Label>
          <pre className="mt-1 text-[11px] leading-relaxed bg-slate-950 text-slate-100 rounded-lg p-3 overflow-auto max-h-72 font-mono">
{snippet}
          </pre>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            className="absolute top-6 right-2 h-7"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </AppModal>
  );
};

export default PlayoffArchiveSnapshotModal;
