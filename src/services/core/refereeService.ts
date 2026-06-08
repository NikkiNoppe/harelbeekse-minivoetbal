import { fetchRefereesForSession } from "@/services/scheidsrechter/scheidsSessionFetch";

export interface Referee {
  user_id: number;
  username: string;
  email?: string;
}

export const refereeService = {
  async getReferees(): Promise<Referee[]> {
    return fetchRefereesForSession();
  },

  async getRefereeById(userId: number): Promise<Referee | null> {
    const referees = await fetchRefereesForSession(userId);
    return referees[0] ?? null;
  },
};
