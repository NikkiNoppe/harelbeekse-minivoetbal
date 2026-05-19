import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import type { ArchivedStanding } from '@/services/archiveService';
import { cn } from '@/lib/utils';

interface Props {
  standings: ArchivedStanding[];
}

const StandingsArchiveCard: React.FC<Props> = ({ standings }) => {
  if (!standings || standings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Trophy className="w-5 h-5" /> Eindklassement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Geen klassement gearchiveerd voor dit seizoen.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Trophy className="w-5 h-5" /> Eindklassement
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-50 text-purple-900 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left w-8">#</th>
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-2 py-2 text-center">G</th>
                <th className="px-2 py-2 text-center hidden sm:table-cell">W</th>
                <th className="px-2 py-2 text-center hidden sm:table-cell">GL</th>
                <th className="px-2 py-2 text-center hidden sm:table-cell">V</th>
                <th className="px-2 py-2 text-center">DV-DT</th>
                <th className="px-2 py-2 text-center">+/-</th>
                <th className="px-3 py-2 text-center font-bold">Pt</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr
                  key={s.position}
                  className={cn(
                    'border-t border-purple-100',
                    s.position === 1 && 'bg-amber-50/50',
                  )}
                >
                  <td className="px-3 py-2 font-bold text-purple-700">{s.position}</td>
                  <td className="px-3 py-2 font-medium">{s.team_name}</td>
                  <td className="px-2 py-2 text-center">{s.played}</td>
                  <td className="px-2 py-2 text-center hidden sm:table-cell">{s.won}</td>
                  <td className="px-2 py-2 text-center hidden sm:table-cell">{s.draw}</td>
                  <td className="px-2 py-2 text-center hidden sm:table-cell">{s.lost}</td>
                  <td className="px-2 py-2 text-center text-xs text-muted-foreground">
                    {s.goals_for}-{s.goals_against}
                  </td>
                  <td className="px-2 py-2 text-center">{s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}</td>
                  <td className="px-3 py-2 text-center font-bold text-purple-800">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandingsArchiveCard;
