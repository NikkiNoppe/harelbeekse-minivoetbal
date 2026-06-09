// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireMatchMutationAccess } from "../_shared/auth.ts";
// @ts-ignore
import { Resend } from "https://esm.sh/resend@2.0.0";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

const ADMIN_EMAIL = "noppe.nikki@icloud.com";

const escapeHtml = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("nl-BE", {
      weekday: "short", day: "numeric", month: "long", year: "numeric"
    });
  } catch { return iso; }
};

const normalizeCardType = (raw: unknown): "yellow" | "red" | "double_yellow" | "none" => {
  const v = (typeof raw === "string" ? raw : "").toLowerCase();
  if (v === "yellow" || v === "geel") return "yellow";
  if (v === "red" || v === "rood") return "red";
  if (v === "double_yellow" || v === "2x geel" || v === "double-yellow") return "double_yellow";
  return "none";
};

const yellowCount = (cardType: string) => {
  const n = normalizeCardType(cardType);
  if (n === "yellow") return 1;
  if (n === "double_yellow") return 2;
  return 0;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  try {
    const { matchId } = await req.json();
    if (!matchId || typeof matchId !== "number") {
      return new Response(JSON.stringify({ error: "matchId vereist" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: matchRow, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("home_team_id, away_team_id")
      .eq("match_id", matchId)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return new Response(JSON.stringify({ error: "Wedstrijd niet gevonden" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const auth = await requireMatchMutationAccess(
      req,
      supabaseAdmin,
      matchRow.home_team_id,
      matchRow.away_team_id,
    );
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY niet geconfigureerd" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = supabaseAdmin;
    const resend = new Resend(RESEND_API_KEY);

    // Load suspension rules
    const { data: rulesRow } = await supabase
      .from("application_settings")
      .select("setting_value")
      .eq("setting_category", "suspension_rules")
      .eq("is_active", true)
      .maybeSingle();
    const yellowRules: Array<{ min_cards: number; max_cards: number; suspension_matches: number }> =
      (rulesRow?.setting_value as any)?.yellow_card_rules ?? [];
    const sortedRules = [...yellowRules].sort((a, b) => a.min_cards - b.min_cards);

    const findRuleMatches = (count: number): number => {
      let m = 0;
      for (const r of sortedRules) {
        if (count >= r.min_cards && count <= r.max_cards) m = r.suspension_matches;
      }
      return m;
    };

    // Load the just-submitted match
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("match_id, match_date, home_team_id, away_team_id, home_players, away_players")
      .eq("match_id", matchId)
      .maybeSingle();
    if (matchErr || !match) {
      return new Response(JSON.stringify({ error: "Wedstrijd niet gevonden" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Collect player ids who got at least 1 yellow in this match
    type Side = "home" | "away";
    const sidePlayers: Array<{ side: Side; teamId: number; opponentTeamId: number; playerId: number; yellowsHere: number }> = [];
    const collect = (arr: any[], side: Side, teamId: number, opponentTeamId: number) => {
      for (const p of arr || []) {
        const pid = Number(p?.playerId ?? p?.player_id ?? p?.id);
        if (!pid) continue;
        const y = yellowCount(p?.cardType ?? p?.card_type ?? p?.kaart);
        if (y > 0) sidePlayers.push({ side, teamId, opponentTeamId, playerId: pid, yellowsHere: y });
      }
    };
    collect(match.home_players as any[], "home", match.home_team_id!, match.away_team_id!);
    collect(match.away_players as any[], "away", match.away_team_id!, match.home_team_id!);

    if (sidePlayers.length === 0) {
      return new Response(JSON.stringify({ success: true, triggered: 0 }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const playerIds = [...new Set(sidePlayers.map((s) => s.playerId))];

    // Load all submitted matches to count yellows historically
    const { data: allSubmitted } = await supabase
      .from("matches")
      .select(`
        match_id, match_date, home_team_id, away_team_id, home_players, away_players,
        home_team:teams!matches_home_team_id_fkey(team_name),
        away_team:teams!matches_away_team_id_fkey(team_name)
      `)
      .eq("is_submitted", true)
      .order("match_date", { ascending: true });

    // Load all future matches per team for "suspended for" calculation
    const { data: allMatches } = await supabase
      .from("matches")
      .select(`
        match_id, match_date, home_team_id, away_team_id,
        home_team:teams!matches_home_team_id_fkey(team_name),
        away_team:teams!matches_away_team_id_fkey(team_name)
      `)
      .order("match_date", { ascending: true });

    // Load player details
    const { data: playersData } = await supabase
      .from("players")
      .select("player_id, first_name, last_name, team_id, teams:team_id(team_name)")
      .in("player_id", playerIds);
    const playerById = new Map<number, any>((playersData || []).map((p: any) => [p.player_id, p]));

    // Pre-index team names from submitted set
    const teamName = (m: any, teamId: number) => {
      if (m.home_team_id === teamId) return (m.home_team as any)?.team_name || "Onbekend";
      return (m.away_team as any)?.team_name || "Onbekend";
    };
    const opponentName = (m: any, teamId: number) => {
      if (m.home_team_id === teamId) return (m.away_team as any)?.team_name || "Onbekend";
      return (m.home_team as any)?.team_name || "Onbekend";
    };

    // For each player: determine yellows BEFORE this match and AFTER (current state, including this match)
    const matchDate = new Date(match.match_date).getTime();

    type CardEvent = { matchId: number; date: string; opponent: string; yellows: number };
    const triggers: Array<{
      playerId: number;
      teamId: number;
      cardEvents: CardEvent[];
      totalAfter: number;
      totalBefore: number;
      suspensionMatches: number;
      thresholdReached: number;
      suspendedForMatches: Array<{ date: string; opponent: string }>;
    }> = [];

    for (const pid of playerIds) {
      const pInfo = playerById.get(pid);
      if (!pInfo) continue;
      const teamId = pInfo.team_id as number;

      // Card history from all submitted matches
      const events: CardEvent[] = [];
      let totalBefore = 0;
      let totalAfter = 0;

      for (const m of allSubmitted || []) {
        const isHome = m.home_team_id === teamId;
        const playersArr = (isHome ? m.home_players : m.away_players) as any[];
        if (!Array.isArray(playersArr)) continue;
        const mine = playersArr.find((p: any) => Number(p?.playerId ?? p?.player_id ?? p?.id) === pid);
        if (!mine) continue;
        const y = yellowCount(mine.cardType ?? mine.card_type ?? mine.kaart);
        if (y === 0) continue;
        const mTime = new Date(m.match_date).getTime();
        events.push({
          matchId: m.match_id,
          date: m.match_date,
          opponent: opponentName(m, teamId),
          yellows: y,
        });
        totalAfter += y;
        if (mTime < matchDate) totalBefore += y;
      }

      const matchesBefore = findRuleMatches(totalBefore);
      const matchesAfter = findRuleMatches(totalAfter);

      // Trigger only if a NEW threshold was reached (more matches now than before)
      if (matchesAfter > matchesBefore && matchesAfter > 0) {
        // Determine which threshold rule was reached
        let thresholdReached = 0;
        for (const r of sortedRules) {
          if (totalAfter >= r.min_cards && totalAfter <= r.max_cards) thresholdReached = r.min_cards;
        }

        // Compute suspended-for matches: next N team matches after this match
        const teamFutureMatches = (allMatches || [])
          .filter((m: any) => (m.home_team_id === teamId || m.away_team_id === teamId)
            && new Date(m.match_date).getTime() > matchDate)
          .slice(0, matchesAfter)
          .map((m: any) => ({
            date: m.match_date,
            opponent: opponentName(m, teamId),
          }));

        triggers.push({
          playerId: pid,
          teamId,
          cardEvents: events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
          totalAfter,
          totalBefore,
          suspensionMatches: matchesAfter,
          thresholdReached,
          suspendedForMatches: teamFutureMatches,
        });
      }
    }

    if (triggers.length === 0) {
      return new Response(JSON.stringify({ success: true, triggered: 0 }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Look up team manager emails per team
    const teamIds = [...new Set(triggers.map((t) => t.teamId))];
    const { data: teamUsers } = await supabase
      .from("team_users")
      .select("team_id, user_id, users:user_id(email, role)")
      .in("team_id", teamIds);

    const emailsByTeamId = new Map<number, string[]>();
    for (const tu of teamUsers || []) {
      const u = (tu as any).users;
      if (!u?.email) continue;
      if (u.role !== "player_manager") continue;
      const list = emailsByTeamId.get(tu.team_id) || [];
      if (!list.includes(u.email)) list.push(u.email);
      emailsByTeamId.set(tu.team_id, list);
    }

    const sentResults: any[] = [];

    for (const t of triggers) {
      const player = playerById.get(t.playerId);
      const playerName = `${player?.first_name ?? ""} ${player?.last_name ?? ""}`.trim() || `Speler ${t.playerId}`;
      const playerTeamName = (player?.teams as any)?.team_name || "Onbekend Team";

      const recipients = new Set<string>([ADMIN_EMAIL]);
      for (const e of emailsByTeamId.get(t.teamId) || []) recipients.add(e);

      const subject = `Automatische schorsing: ${playerName} (${playerTeamName})`;

      const cardListHtml = t.cardEvents
        .map((e) => `<li>${escapeHtml(formatDate(e.date))} — vs <strong>${escapeHtml(e.opponent)}</strong>${e.yellows > 1 ? ` (${e.yellows} gele kaarten)` : ""}</li>`)
        .join("");

      const suspendedListHtml = t.suspendedForMatches.length
        ? t.suspendedForMatches
            .map((m) => `<li>${escapeHtml(formatDate(m.date))} — vs <strong>${escapeHtml(m.opponent)}</strong></li>`)
            .join("")
        : "<li><em>Geen geplande wedstrijden gevonden om de schorsing op uit te zitten.</em></li>";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <h2 style="color: #b91c1c; margin: 0 0 16px;">Automatische schorsing</h2>
          <p>Beste,</p>
          <p>
            Speler <strong>${escapeHtml(playerName)}</strong> van <strong>${escapeHtml(playerTeamName)}</strong>
            is automatisch geschorst na het bereiken van <strong>${t.totalAfter} gele kaarten</strong>
            (drempel vanaf ${t.thresholdReached} kaarten = ${t.suspensionMatches} wedstrijd${t.suspensionMatches > 1 ? "en" : ""} schorsing).
          </p>

          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px;"><strong>Gele kaarten ontvangen tijdens:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">${cardListHtml}</ul>
          </div>

          <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px;"><strong>Geschorst voor de volgende ${t.suspensionMatches} wedstrijd${t.suspensionMatches > 1 ? "en" : ""}:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">${suspendedListHtml}</ul>
          </div>

          <p style="font-size: 12px; color: #6b7280;">
            Dit is een automatisch bericht van Harelbeekse Minivoetbal. Bij vragen over deze schorsing kan u contact opnemen via ${ADMIN_EMAIL}.
          </p>
          <p style="margin-top: 24px;">Met vriendelijke groet,<br/>Harelbeekse Minivoetbal</p>
        </div>
      `;

      const to = [...recipients];
      try {
        const r = await resend.emails.send({
          from: "Harelbeekse Minivoetbal <noreply@resend.dev>",
          to,
          subject,
          html,
        });
        sentResults.push({ playerId: t.playerId, to, ok: true, id: (r as any)?.data?.id });
        console.log("[notify-auto-suspension] sent", { playerId: t.playerId, to });
      } catch (e: any) {
        console.error("[notify-auto-suspension] send error", e);
        sentResults.push({ playerId: t.playerId, to, ok: false, error: e?.message });
      }
    }

    return new Response(JSON.stringify({ success: true, triggered: triggers.length, sent: sentResults }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in notify-auto-suspension:", error);
    const msg = error instanceof Error ? error.message : "Onbekende fout";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
