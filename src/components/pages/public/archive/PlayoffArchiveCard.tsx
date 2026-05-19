import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy } from 'lucide-react';
import { PlayoffArchiveEntry } from '@/data/playoffArchive';
import { cn } from '@/lib/utils';

interface Props {
  entry: PlayoffArchiveEntry | null;
}

const RankList: React.FC<{
  title: string;
  variant: 'top' | 'bottom';
  rows: PlayoffArchiveEntry['top_ranking'];
}> = ({ title, variant, rows }) => {
  if (!rows || rows.length === 0) return null;
  const accent =
    variant === 'top'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider', accent)}>
          {title}
        </Badge>
      </div>
      <ol className="divide-y divide-purple-100 rounded-lg border border-purple-100 bg-white overflow-hidden">
        {rows.map((r) => (
          <li
            key={`${variant}-${r.position}`}
            className="flex items-center justify-between px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                  r.position === 1
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-purple-100 text-purple-800',
                )}
              >
                {r.position}
              </span>
              <span className="font-medium truncate">{r.team_name}</span>
            </div>
            {typeof r.total_points === 'number' && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {r.total_points} ptn
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

const PlayoffArchiveCard: React.FC<Props> = ({ entry }) => {
  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
          <Target className="w-4 h-4 text-purple-700" />
          Playoffs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!entry ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Geen playoff-archief voor dit seizoen.
          </div>
        ) : (
          <>
            {entry.final && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-center gap-2 text-amber-800 mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Finale</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{entry.final.home_team}</span>
                  <span className="font-bold mx-3 tabular-nums">
                    {entry.final.home_score ?? '-'} – {entry.final.away_score ?? '-'}
                  </span>
                  <span className="font-medium truncate text-right">{entry.final.away_team}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RankList title="Playoff 1" variant="top" rows={entry.top_ranking} />
              <RankList title="Playoff 2" variant="bottom" rows={entry.bottom_ranking} />
            </div>
            {entry.notes && (
              <p className="text-xs text-muted-foreground italic">{entry.notes}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayoffArchiveCard;
