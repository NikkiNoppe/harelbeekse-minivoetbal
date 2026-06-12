import {
  fetchProfilePollsForSession,
  manageProfilePollForSession,
  submitProfilePollResponseForSession,
} from "./profilePollSessionFetch";

export type ProfilePollTargetRole = "player_manager" | "referee";

export interface ProfilePollOption {
  id: string;
  label: string;
}

export interface ProfilePollMyResponse {
  option_ids: string[];
  updated_at?: string;
}

export interface ProfilePollRespondent {
  user_id: number;
  username: string;
  role: string;
  option_ids?: string[];
  option_labels?: string[];
  updated_at?: string;
}

export interface ProfilePollStats {
  eligible_count: number;
  responded_count: number;
  option_counts: Record<string, number>;
  responded: ProfilePollRespondent[];
  pending: Array<{ user_id: number; username: string; role: string }>;
}

export interface ProfilePollAdmin {
  id: number;
  setting_name: string;
  title: string;
  question: string;
  options: ProfilePollOption[];
  allow_multiple: boolean;
  target_roles: ProfilePollTargetRole[];
  end_date: string;
  status: string;
  created_at?: string;
  created_by?: number;
  is_active: boolean;
  stats: ProfilePollStats;
}

export interface ProfilePollRespondentView {
  id: number;
  title: string;
  question: string;
  options: ProfilePollOption[];
  allow_multiple: boolean;
  end_date: string;
  my_response: ProfilePollMyResponse | null;
}

export interface CreateProfilePollPayload {
  title?: string;
  question: string;
  options: ProfilePollOption[];
  allow_multiple: boolean;
  target_roles: ProfilePollTargetRole[];
  end_date: string;
}

interface RpcPollResult {
  success?: boolean;
  error?: string;
  polls?: unknown[];
}

interface RpcSubmitResult {
  success?: boolean;
  error?: string;
  my_response?: ProfilePollMyResponse;
}

interface RpcManageResult {
  success?: boolean;
  error?: string;
  id?: number;
}

function parsePollsResponse(data: unknown): {
  adminPolls: ProfilePollAdmin[];
  respondentPolls: ProfilePollRespondentView[];
} {
  const result = data as RpcPollResult;
  if (!result?.success) {
    throw new Error(result?.error ?? "Kon polls niet laden");
  }

  const polls = Array.isArray(result.polls) ? result.polls : [];
  const adminPolls: ProfilePollAdmin[] = [];
  const respondentPolls: ProfilePollRespondentView[] = [];

  for (const raw of polls) {
    const p = raw as Record<string, unknown>;
    if (p.stats) {
      adminPolls.push(p as unknown as ProfilePollAdmin);
    } else {
      respondentPolls.push(p as unknown as ProfilePollRespondentView);
    }
  }

  return { adminPolls, respondentPolls };
}

export const profilePollService = {
  async getPolls(isAdmin: boolean): Promise<ProfilePollAdmin[] | ProfilePollRespondentView[]> {
    const data = await fetchProfilePollsForSession();
    const { adminPolls, respondentPolls } = parsePollsResponse(data);
    return isAdmin ? adminPolls : respondentPolls;
  },

  async submitResponse(pollId: number, optionIds: string[]): Promise<ProfilePollMyResponse> {
    const data = await submitProfilePollResponseForSession(pollId, optionIds);
    const result = data as RpcSubmitResult;
    if (!result?.success || !result.my_response) {
      throw new Error(result?.error ?? "Kon antwoord niet opslaan");
    }
    return result.my_response;
  },

  async createPoll(payload: CreateProfilePollPayload): Promise<number> {
    const data = await manageProfilePollForSession("create", undefined, payload as unknown as Record<string, unknown>);
    const result = data as RpcManageResult;
    if (!result?.success || !result.id) {
      throw new Error(result?.error ?? "Kon poll niet aanmaken");
    }
    return result.id;
  },

  async closePoll(pollId: number): Promise<void> {
    const data = await manageProfilePollForSession("close", pollId);
    const result = data as RpcManageResult;
    if (!result?.success) {
      throw new Error(result?.error ?? "Kon poll niet sluiten");
    }
  },

  async deletePoll(pollId: number): Promise<void> {
    const data = await manageProfilePollForSession("delete", pollId);
    const result = data as RpcManageResult;
    if (!result?.success) {
      throw new Error(result?.error ?? "Kon poll niet verwijderen");
    }
  },
};

export const PROFILE_POLLS_QUERY_KEY = ["profilePolls"] as const;

export function getRoleLabel(role: string): string {
  switch (role) {
    case "player_manager":
      return "Teamverantwoordelijke";
    case "referee":
      return "Scheidsrechter";
    default:
      return role;
  }
}

export function formatPollDeadline(endDate: string): string {
  try {
    return new Date(endDate).toLocaleString("nl-BE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return endDate;
  }
}
