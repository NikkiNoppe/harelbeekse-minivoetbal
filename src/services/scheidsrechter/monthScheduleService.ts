import { fetchScheidsScheduleForMonth } from "@/services/scheidsrechter/scheidsSessionFetch";

export interface ScheduleMatch {
  match_id: number;
  match_date: string;
  location: string | null;
  home_team_name: string;
  away_team_name: string;
}

export interface ScheduleCluster {
  cluster_key: string;
  poll_month: string;
  match_date: string;
  location: string;
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

export const buildClusterKey = (matchDateIso: string, location: string | null): string => {
  const date = toDateKey(matchDateIso);
  const loc = (location || 'onbekend').trim().toLowerCase().replace(/\s+/g, '-');
  return `${date}__${loc}`;
};

function clusterMatchesForMonth(month: string, rows: Awaited<ReturnType<typeof fetchScheidsScheduleForMonth>>): ScheduleCluster[] {
  const grouped = new Map<string, ScheduleCluster>();

  rows.forEach((m) => {
    const key = buildClusterKey(m.match_date, m.location);
    const match: ScheduleMatch = {
      match_id: m.match_id,
      match_date: m.match_date,
      location: m.location,
      home_team_name: m.home_team_name || '?',
      away_team_name: m.away_team_name || '?',
    };

    if (!grouped.has(key)) {
      grouped.set(key, {
        cluster_key: key,
        poll_month: toMonthKey(m.match_date),
        match_date: toDateKey(m.match_date),
        location: m.location || 'onbekend',
        time_slot: toTimeKey(m.match_date),
        matches: [],
      });
    }

    const cluster = grouped.get(key)!;
    cluster.matches.push(match);
    if (toTimeKey(m.match_date) < cluster.time_slot) {
      cluster.time_slot = toTimeKey(m.match_date);
    }
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const dateCmp = a.match_date.localeCompare(b.match_date);
    if (dateCmp !== 0) return dateCmp;
    return a.location.localeCompare(b.location);
  });
}

export const monthScheduleService = {
  async getClustersForMonth(month: string): Promise<ScheduleCluster[]> {
    if (!/^\d{4}-\d{2}$/.test(month)) return [];
    const rows = await fetchScheidsScheduleForMonth(month);
    return clusterMatchesForMonth(month, rows);
  },

  async getUpcomingClusters(monthsAhead = 2): Promise<ScheduleCluster[]> {
    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < monthsAhead; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    }

    const allClusters = await Promise.all(
      months.map((m) => this.getClustersForMonth(m)),
    );

    return allClusters.flat().sort((a, b) => {
      const dateCmp = a.match_date.localeCompare(b.match_date);
      if (dateCmp !== 0) return dateCmp;
      return a.location.localeCompare(b.location);
    });
  },
};
