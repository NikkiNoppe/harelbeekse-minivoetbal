import { supabase } from '@/integrations/supabase/client';

/**
 * Schedule service zonder poll-afhankelijkheid.
 *
 * Filosofie: het speelschema staat al volledig in `matches`. Scheidsrechters
 * kunnen rechtstreeks per wedstrijd (of per dag+locatie cluster) aangeven of
 * ze beschikbaar zijn — er is geen aparte "poll" meer nodig.
 */

export interface ScheduleMatch {
  match_id: number;
  match_date: string; // ISO
  location: string | null;
  home_team_name: string;
  away_team_name: string;
}

export interface ScheduleCluster {
  /** Stabiele key — gebruikt als poll_group_id in referee_availability voor backwards compatibility. */
  cluster_key: string;
  poll_month: string; // YYYY-MM
  match_date: string; // YYYY-MM-DD (datum-deel)
  location: string;
  /** Vroegste tijdstip in het cluster (HH:mm). */
  time_slot: string;
  matches: ScheduleMatch[];
}

const pad = (n: number) => String(n).padStart(2, '0');

const toDateKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const toMonthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

const toTimeKey = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

/**
 * Bouwt een stabiele, deterministische cluster-key.
 * Format: `<YYYY-MM-DD>__<location>` — wedstrijden op dezelfde dag op dezelfde
 * locatie worden gegroepeerd ongeacht het exacte tijdstip (typisch volgen ze
 * elkaar op met 1u tussenpoos).
 */
export const buildClusterKey = (matchDateIso: string, location: string | null): string => {
  const date = toDateKey(matchDateIso);
  const loc = (location || 'onbekend').trim().toLowerCase().replace(/\s+/g, '-');
  return `${date}__${loc}`;
};

/**
 * Haal alle wedstrijden op voor een maand en groepeer per (datum+locatie).
 */
export const monthScheduleService = {
  async getClustersForMonth(month: string): Promise<ScheduleCluster[]> {
    if (!/^\d{4}-\d{2}$/.test(month)) return [];

    const [year, monthNum] = month.split('-').map(Number);
    const nextMonth =
      monthNum === 12
        ? `${year + 1}-01`
        : `${year}-${pad(monthNum + 1)}`;

    const { data: matches, error } = await supabase
      .from('matches')
      .select('match_id, match_date, location, home_team_id, away_team_id')
      .gte('match_date', `${month}-01`)
      .lt('match_date', `${nextMonth}-01`)
      .order('match_date', { ascending: true });

    if (error || !matches || matches.length === 0) return [];

    const teamIds = new Set<number>();
    matches.forEach((m) => {
      if (m.home_team_id) teamIds.add(m.home_team_id);
      if (m.away_team_id) teamIds.add(m.away_team_id);
    });

    const { data: teams } = await supabase
      .from('teams')
      .select('team_id, team_name')
      .in('team_id', Array.from(teamIds));

    const teamMap = new Map(teams?.map((t) => [t.team_id, t.team_name]) || []);

    // Groepeer per cluster-key
    const grouped = new Map<string, ScheduleCluster>();

    matches.forEach((m) => {
      const key = buildClusterKey(m.match_date, m.location);
      const match: ScheduleMatch = {
        match_id: m.match_id,
        match_date: m.match_date,
        location: m.location,
        home_team_name: teamMap.get(m.home_team_id!) || 'Onbekend',
        away_team_name: teamMap.get(m.away_team_id!) || 'Onbekend',
      };
      const existing = grouped.get(key);
      if (existing) {
        existing.matches.push(match);
        // Houd het vroegste tijdstip
        if (toTimeKey(m.match_date) < existing.time_slot) {
          existing.time_slot = toTimeKey(m.match_date);
        }
      } else {
        grouped.set(key, {
          cluster_key: key,
          poll_month: toMonthKey(m.match_date),
          match_date: toDateKey(m.match_date),
          location: m.location || 'Onbekend',
          time_slot: toTimeKey(m.match_date),
          matches: [match],
        });
      }
    });

    // Sorteer wedstrijden binnen elk cluster op tijd
    grouped.forEach((c) =>
      c.matches.sort((a, b) => a.match_date.localeCompare(b.match_date)),
    );

    // Sorteer clusters op datum, dan tijd, dan locatie
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.match_date !== b.match_date) return a.match_date.localeCompare(b.match_date);
      if (a.time_slot !== b.time_slot) return a.time_slot.localeCompare(b.time_slot);
      return a.location.localeCompare(b.location);
    });
  },

  /**
   * Voor scheidsrechters: haal clusters op voor de huidige + volgende maand.
   * Zo zien ze altijd wat eraan zit te komen, zonder dat een admin iets moet
   * doen.
   */
  async getUpcomingClusters(monthsAhead = 2): Promise<ScheduleCluster[]> {
    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < monthsAhead; i++) {
      const d = new Date(now.getUTCFullYear(), now.getUTCMonth() + i, 1);
      months.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
    }

    const all = await Promise.all(months.map((m) => this.getClustersForMonth(m)));
    const flat = all.flat();

    // Filter clusters die volledig in het verleden liggen (alle wedstrijden
    // voorbij), zodat de UI proper blijft.
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    return flat.filter((c) => {
      const lastMatch = c.matches[c.matches.length - 1];
      return new Date(lastMatch.match_date).getTime() >= cutoff.getTime();
    });
  },
};
