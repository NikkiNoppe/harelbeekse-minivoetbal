/** Schatting voor competitieplanning: weken vs. uitzonderlijke dubbele speelweken. */

export const DAY_OF_WEEK_NAMES: Record<number, string> = {
  0: "Zondag",
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag",
  6: "Zaterdag",
};

export type TimeslotLike = {
  day_of_week?: number | null;
};

/** Unieke speeldagen uit geconfigureerde tijdslots, oplopend. */
export function getConfiguredPlayDays(timeslots: TimeslotLike[]): number[] {
  const days = new Set<number>();
  for (const slot of timeslots) {
    if (typeof slot.day_of_week === "number" && slot.day_of_week >= 0 && slot.day_of_week <= 6) {
      days.add(slot.day_of_week);
    }
  }
  return Array.from(days).sort((a, b) => a - b);
}

/**
 * Kies twee dagen met maximale spreiding (bv. maandag + vrijdag).
 * Bij één dag: die dag alleen; bij geen dagen: maandag + dinsdag als fallback.
 */
export function pickSpacedPlayDayPair(playDays: number[]): {
  early: number;
  late: number;
  earlyLabel: string;
  lateLabel: string;
  separated: boolean;
} {
  if (playDays.length === 0) {
    return {
      early: 1,
      late: 2,
      earlyLabel: DAY_OF_WEEK_NAMES[1],
      lateLabel: DAY_OF_WEEK_NAMES[2],
      separated: false,
    };
  }
  if (playDays.length === 1) {
    const only = playDays[0];
    return {
      early: only,
      late: only,
      earlyLabel: DAY_OF_WEEK_NAMES[only] ?? `Dag ${only}`,
      lateLabel: DAY_OF_WEEK_NAMES[only] ?? `Dag ${only}`,
      separated: false,
    };
  }

  let bestA = playDays[0];
  let bestB = playDays[playDays.length - 1];
  let bestDist = -1;
  for (let i = 0; i < playDays.length; i++) {
    for (let j = i + 1; j < playDays.length; j++) {
      const a = playDays[i];
      const b = playDays[j];
      const forward = b - a;
      const wrap = 7 - forward;
      const dist = Math.max(forward, wrap);
      if (dist > bestDist) {
        bestDist = dist;
        bestA = a;
        bestB = b;
      }
    }
  }

  const early = Math.min(bestA, bestB);
  const late = Math.max(bestA, bestB);
  return {
    early,
    late,
    earlyLabel: DAY_OF_WEEK_NAMES[early] ?? `Dag ${early}`,
    lateLabel: DAY_OF_WEEK_NAMES[late] ?? `Dag ${late}`,
    separated: early !== late,
  };
}

export type CompetitionPlanningEstimate = {
  slotsPerWeek: number;
  weeksNeeded: number;
  availableWeeks: number;
  weekDeficit: number;
  overflowMatches: number;
  /** Weken waarin sommige teams uitzonderlijk 2× spelen (ruwe schatting). */
  doublePlayWeeks: number;
  /** Haalbaar binnen kalender als we dubbele speelweken toelaten. */
  feasibleWithDoublePlay: boolean;
  dayPair: ReturnType<typeof pickSpacedPlayDayPair>;
};

/**
 * Ruwe capaciteitsschatting: standaard 1× per team per week via slotsPerWeek.
 * Tekort → uitzonderlijke dubbele speelweken, bij voorkeur op gespreide dagen.
 */
export function estimateCompetitionPlanning(input: {
  totalMatches: number;
  availableWeeks: number;
  timeslots: TimeslotLike[];
  /** Fallback als er geen tijdslots zijn (historisch ~7 speelmomenten/week). */
  defaultSlotsPerWeek?: number;
}): CompetitionPlanningEstimate {
  const configuredSlots = input.timeslots.length;
  const slotsPerWeek = Math.max(
    1,
    configuredSlots > 0 ? configuredSlots : (input.defaultSlotsPerWeek ?? 7),
  );
  const availableWeeks = Math.max(0, input.availableWeeks);
  const totalMatches = Math.max(0, input.totalMatches);
  const weeksNeeded = Math.ceil(totalMatches / slotsPerWeek);
  const weekDeficit = Math.max(0, weeksNeeded - availableWeeks);
  const capacity = availableWeeks * slotsPerWeek;
  const overflowMatches = Math.max(0, totalMatches - capacity);
  const dayPair = pickSpacedPlayDayPair(getConfiguredPlayDays(input.timeslots));

  // Elke "dubbele speelweek" kan ruwweg één extra speeldag-equivalent opvangen
  // (teams die al speelden krijgen een 2e wedstrijd op een gespreide dag).
  const doublePlayWeeks = weekDeficit;
  const feasibleWithDoublePlay =
    availableWeeks > 0 && totalMatches > 0 && weekDeficit > 0 && overflowMatches > 0
      ? doublePlayWeeks <= availableWeeks
      : weekDeficit === 0;

  return {
    slotsPerWeek,
    weeksNeeded,
    availableWeeks,
    weekDeficit,
    overflowMatches,
    doublePlayWeeks,
    feasibleWithDoublePlay: weekDeficit === 0 || feasibleWithDoublePlay,
    dayPair,
  };
}
