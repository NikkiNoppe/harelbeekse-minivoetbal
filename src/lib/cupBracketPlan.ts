/** Bracket- en datumsuggesties voor bekertoernooi (1/8 → QF → SF → Finale). */

import {
  pickSpacedPlayDayPair,
  toMondayIso,
  type TimeslotLike,
  type VacationLike,
} from "@/lib/competitionPlanningEstimate";

export type CupRoundUi =
  | { type: "group"; name: string; subRounds: Array<{ name: string; index: number }> }
  | { type: "single"; name: string; index: number };

export type CupBracketPlan = {
  teamCount: number;
  /** Teams die in 1/8 spelen (na aftrek bye). */
  firstRoundTeams: number;
  firstRoundPairs: number;
  slotsPerWeek: number;
  /** Aantal speelweken nodig voor 1/8. */
  firstRoundWeeks: number;
  /** Altijd 3: QF, SF, Finale. */
  knockoutWeeks: 3;
  requiredWeeks: number;
  roundLabels: CupRoundUi[];
};

export type IdealCupDatesSuggestion = {
  dates: string[];
  overlappingMondays: string[];
  freeWeeksAvailable: number;
  daySeparation: ReturnType<typeof pickSpacedPlayDayPair>;
  notes: string[];
};

/** Aantal 1/8-paren: oneven aantal → 1 bye, rest speelt. */
export function getCupFirstRoundPairs(teamCount: number): number {
  const n = Math.max(0, Math.floor(teamCount));
  if (n < 2) return 0;
  const playing = n % 2 === 1 ? n - 1 : n;
  return Math.floor(playing / 2);
}

/**
 * Bereken weken/rondes op basis van teamcount en wekelijkse slotcapaciteit.
 * Structuur blijft: 1/8 (evt. gesplitst) + QF + SF + Finale.
 */
export function getCupBracketPlan(
  teamCount: number,
  slotsPerWeek: number = 7,
): CupBracketPlan {
  const slots = Math.max(1, Math.floor(slotsPerWeek) || 7);
  const pairs = getCupFirstRoundPairs(teamCount);
  const firstRoundTeams = pairs * 2;
  const firstRoundWeeks = pairs === 0 ? 0 : Math.max(1, Math.ceil(pairs / slots));
  const knockoutWeeks = 3 as const;
  const requiredWeeks = firstRoundWeeks + knockoutWeeks;

  return {
    teamCount: Math.max(0, Math.floor(teamCount)),
    firstRoundTeams,
    firstRoundPairs: pairs,
    slotsPerWeek: slots,
    firstRoundWeeks,
    knockoutWeeks,
    requiredWeeks: Math.max(knockoutWeeks, requiredWeeks),
    roundLabels: buildCupRoundLabels(firstRoundWeeks),
  };
}

export function buildCupRoundLabels(firstRoundWeeks: number): CupRoundUi[] {
  const r1 = Math.max(0, firstRoundWeeks);
  const rounds: CupRoundUi[] = [];

  if (r1 <= 0) {
    // Geen 1/8: start bij QF (zeldzaam)
  } else if (r1 === 1) {
    rounds.push({ type: "single", name: "Achtste Finales", index: 0 });
  } else {
    rounds.push({
      type: "group",
      name: "Achtste Finales",
      subRounds: Array.from({ length: r1 }, (_, i) => ({
        name: `Speelweek ${i + 1}`,
        index: i,
      })),
    });
  }

  rounds.push({ type: "single", name: "Kwart Finales", index: r1 });
  rounds.push({ type: "single", name: "Halve Finales", index: r1 + 1 });
  rounds.push({ type: "single", name: "Finale", index: r1 + 2 });
  return rounds;
}

/** Week-index voor 1/8-wedstrijd i (0-based), opeenvolgend per slotcapaciteit. */
export function assignFirstRoundWeekIndex(
  matchIndex: number,
  pairCount: number,
  firstRoundWeeks: number,
  slotsPerWeek: number,
): number {
  if (firstRoundWeeks <= 1) return 0;
  const capacity = Math.max(1, slotsPerWeek);
  const byCapacity = Math.floor(matchIndex / capacity);
  return Math.min(firstRoundWeeks - 1, Math.max(0, byCapacity));
}

/** QF / SF / Finale-indices: laatste 3 speelweken. */
export function getKnockoutWeekIndices(playingWeeksLength: number): {
  quarterFinal: number;
  semiFinal: number;
  final: number;
  firstRoundWeeks: number;
} {
  const n = Math.max(3, playingWeeksLength);
  return {
    firstRoundWeeks: Math.max(0, n - 3),
    quarterFinal: n - 3,
    semiFinal: n - 2,
    final: n - 1,
  };
}

/**
 * Kalenderdatum (YYYY-MM-DD) voor een speelweek-maandag + timeslot day_of_week
 * (0 = zondag … 6 = zaterdag).
 */
export function matchDateFromWeekMonday(
  weekMonday: string,
  dayOfWeek: number | null | undefined,
): string {
  const monday = toMondayIso(weekMonday);
  if (dayOfWeek == null || Number.isNaN(dayOfWeek)) return monday;
  const dow = Math.floor(dayOfWeek);
  // Offset vanaf maandag: zo=6, ma=0, di=1, … za=5
  const offset = dow === 0 ? 6 : dow - 1;
  const d = new Date(`${monday}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Kleine scorebonus: beker bij voorkeur vroeg in de week. */
export function earlyWeekSlotBonus(
  dayOfWeek: number | null | undefined,
  earlyDay: number,
): number {
  if (dayOfWeek == null || Number.isNaN(dayOfWeek)) return 0;
  const dist = Math.abs(Math.floor(dayOfWeek) - earlyDay);
  return Math.max(0, 3 - dist) * 0.4;
}

function isVacationMonday(monday: string, vacations: VacationLike[]): boolean {
  const m = new Date(`${monday}T12:00:00`);
  return vacations.some((vacation) => {
    if (vacation.is_active === false) return false;
    if (!vacation.start_date || !vacation.end_date) return false;
    const start = new Date(`${vacation.start_date.split("T")[0]}T12:00:00`);
    const end = new Date(`${vacation.end_date.split("T")[0]}T12:00:00`);
    return m >= start && m <= end;
  });
}

/** Alle speelbare maandagen tussen seizoensstart en -einde (excl. vakantie). */
export function listPlayableMondays(
  seasonStart: string,
  seasonEnd: string,
  vacations: VacationLike[] = [],
): string[] {
  if (!seasonStart || !seasonEnd) return [];
  let cursor = new Date(`${toMondayIso(seasonStart)}T12:00:00`);
  const end = new Date(`${toMondayIso(seasonEnd)}T12:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || cursor > end) {
    return [];
  }
  const out: string[] = [];
  while (cursor <= end) {
    const iso = toMondayIso(cursor);
    if (!isVacationMonday(iso, vacations)) out.push(iso);
    cursor.setDate(cursor.getDate() + 7);
  }
  return out;
}

/** Kies `count` indices zo gelijkmatig mogelijk over `length`. */
export function pickSpacedIndices(length: number, count: number): number[] {
  if (count <= 0 || length <= 0) return [];
  if (count === 1) return [Math.floor((length - 1) / 2)];
  if (count >= length) return Array.from({ length }, (_, i) => i);

  const picked: number[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx = Math.round((i * (length - 1)) / (count - 1));
    // Bij afrondingsbotsing: zoek dichtstbijzijnde vrije index
    if (used.has(idx)) {
      let delta = 1;
      while (delta < length) {
        if (idx + delta < length && !used.has(idx + delta)) {
          idx = idx + delta;
          break;
        }
        if (idx - delta >= 0 && !used.has(idx - delta)) {
          idx = idx - delta;
          break;
        }
        delta += 1;
      }
    }
    used.add(idx);
    picked.push(idx);
  }
  return picked.sort((a, b) => a - b);
}

/**
 * Stel ideale beker-maandagen voor: eerst weken zonder competitie,
 * gespreid over het seizoen; vul aan met overlap-weken indien nodig.
 * Bij overlap: adviseer beker vroeg / competitie laat in de week.
 */
export function suggestIdealCupDates(input: {
  requiredWeeks: number;
  seasonStart: string;
  seasonEnd: string;
  vacations?: VacationLike[];
  competitionMondays?: string[];
  timeslots?: TimeslotLike[];
}): IdealCupDatesSuggestion {
  const required = Math.max(0, Math.floor(input.requiredWeeks));
  const vacations = input.vacations ?? [];
  const competitionSet = new Set(
    (input.competitionMondays ?? []).map((d) => toMondayIso(d)),
  );
  const playable = listPlayableMondays(input.seasonStart, input.seasonEnd, vacations);
  const free = playable.filter((m) => !competitionSet.has(m));
  const busy = playable.filter((m) => competitionSet.has(m));
  const daySeparation = pickSpacedPlayDayPair(
    (input.timeslots ?? [])
      .map((t) => t.day_of_week)
      .filter((d): d is number => typeof d === "number"),
  );

  const notes: string[] = [];
  const dates: string[] = [];

  if (required === 0) {
    return {
      dates: [],
      overlappingMondays: [],
      freeWeeksAvailable: free.length,
      daySeparation,
      notes: ["Geen speelweken nodig."],
    };
  }

  if (playable.length === 0) {
    return {
      dates: [],
      overlappingMondays: [],
      freeWeeksAvailable: 0,
      daySeparation,
      notes: ["Geen speelbare weken in het seizoen (check start/eind en vakanties)."],
    };
  }

  // Fase 1: gespreid uit vrije weken
  const freePick = pickSpacedIndices(free.length, Math.min(required, free.length)).map(
    (i) => free[i],
  );
  dates.push(...freePick);

  // Fase 2: tekort opvullen met competitieweken, zo ver mogelijk van gekozen data
  if (dates.length < required && busy.length > 0) {
    const need = required - dates.length;
    const busySorted = [...busy].sort((a, b) => {
      const distA = Math.min(...dates.map((d) => Math.abs(Date.parse(a) - Date.parse(d))), Infinity);
      const distB = Math.min(...dates.map((d) => Math.abs(Date.parse(b) - Date.parse(d))), Infinity);
      return distB - distA;
    });
    // Neem gespreide selectie uit busy, daarna sorteren chronologisch
    const busyPick = pickSpacedIndices(busySorted.length, Math.min(need, busySorted.length)).map(
      (i) => busySorted[i],
    );
    dates.push(...busyPick);
  }

  // Nog tekort: vul met overige playable
  if (dates.length < required) {
    const used = new Set(dates);
    for (const m of playable) {
      if (dates.length >= required) break;
      if (!used.has(m)) dates.push(m);
    }
  }

  dates.sort();
  const finalDates = dates.slice(0, required);
  const overlappingMondays = finalDates.filter((d) => competitionSet.has(d));

  notes.push(
    `${finalDates.length} speelweek(en) voorgesteld over het seizoen (${free.length} week(en) zonder competitie beschikbaar).`,
  );
  if (overlappingMondays.length === 0) {
    notes.push("Geen overlap met bestaande competitieweken — teams spelen max. 1× die week.");
  } else {
    notes.push(
      `${overlappingMondays.length} week(en) overlappen met competitie. ` +
        (daySeparation.separated
          ? `Plan beker bij voorkeur op ${daySeparation.earlyLabel}, competitie op ${daySeparation.lateLabel}.`
          : "Probeer beker en competitie op verschillende dagen/tijden te zetten."),
    );
  }
  if (finalDates.length < required) {
    notes.push(
      `Onvoldoende weken in het seizoen: ${finalDates.length}/${required}. Verleng seizoen of verklein het deelnemersveld.`,
    );
  }

  return {
    dates: finalDates,
    overlappingMondays,
    freeWeeksAvailable: free.length,
    daySeparation,
    notes,
  };
}

export function describeCupPlan(plan: CupBracketPlan): string {
  const bye = plan.teamCount % 2 === 1;
  const parts = [
    `${plan.teamCount} team${plan.teamCount === 1 ? "" : "s"}`,
    `${plan.firstRoundPairs} achtste-finale${plan.firstRoundPairs === 1 ? "" : "s"}`,
  ];
  if (bye) parts.push("1 bye");
  parts.push(`${plan.requiredWeeks} speelweek${plan.requiredWeeks === 1 ? "" : "en"}`);
  if (plan.firstRoundWeeks > 1) {
    parts.push(`1/8 over ${plan.firstRoundWeeks} weken`);
  }
  return parts.join(" · ");
}
