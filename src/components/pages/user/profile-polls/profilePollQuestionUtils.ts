const OPTION_MARKER_REGEX = /(?=[🅐🅑🅒🅓🅔🅕🅖🅗🅘])|(?=\s[A-F]\)\s)/u;
const OPTION_START_REGEX = /^[🅐🅑🅒🅓🅔🅕🅖🅗🅘]|^[A-F]\)/u;
const DAY_NAMES =
  /^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag)\b/i;

const WEEKDAY_OPTION_NUMBERS: Record<string, number> = {
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6,
  zondag: 7,
};

const CIRCLED_OPTION_LETTERS = ["🅐", "🅑", "🅒", "🅓", "🅔", "🅕", "🅖", "🅗", "🅘"] as const;

const DAY_ABBREVIATIONS: Record<string, string> = {
  maandag: "Ma",
  dinsdag: "Di",
  woensdag: "Wo",
  donderdag: "Do",
  vrijdag: "Vr",
  zaterdag: "Za",
  zondag: "Zo",
};

function extractWeekdayKey(main: string): string | null {
  const match = main.match(/^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag)\b/i);
  return match ? match[1].toLowerCase() : null;
}

/** Nummer uit optieletter (🅐=1, 🅑=2, …) of A)=1, B)=2, … */
export function getPollOptionLetterNumber(label: string): number | null {
  const trimmed = label.trim();
  for (let i = 0; i < CIRCLED_OPTION_LETTERS.length; i++) {
    if (trimmed.startsWith(CIRCLED_OPTION_LETTERS[i])) return i + 1;
  }
  const match = trimmed.match(/^([A-F])\)/);
  if (match) return match[1].charCodeAt(0) - "A".charCodeAt(0) + 1;
  return null;
}

/** Sorteer op weekdag; Donderdag altijd als laatste; bij gelijke dag op letter. */
export function getPollOptionSortRank(label: string): number {
  const parsed = parseOptionLabel(label);
  const day = extractWeekdayKey(parsed.main);
  const letter = getPollOptionLetterNumber(label) ?? 99;
  if (!day) return 5000 + letter;
  if (day === "donderdag") return 10000 + letter;
  return (WEEKDAY_OPTION_NUMBERS[day] ?? 50) * 100 + letter;
}

export function sortPollOptionsForDisplay<T extends { label: string }>(options: T[]): T[] {
  return [...options].sort(
    (a, b) => getPollOptionSortRank(a.label) - getPollOptionSortRank(b.label),
  );
}

function normalizeOptionMainForMatch(main: string): string {
  return cleanPollDisplayText(main).toLowerCase().replace(/\s+/g, " ");
}

export function getInlineNoteForOption(
  label: string,
  inlineOptions: ParsedPollOptionLine[],
): string | null {
  const parsed = parseOptionLabel(label);

  if (parsed.letter) {
    const letterMatch = inlineOptions.find((option) => option.letter === parsed.letter);
    if (letterMatch) return letterMatch.note ?? null;
  }

  const labelLetterNum = getPollOptionLetterNumber(label);
  if (labelLetterNum !== null) {
    const letterMatch = inlineOptions.find((option) => {
      const idx = CIRCLED_OPTION_LETTERS.indexOf(
        option.letter as (typeof CIRCLED_OPTION_LETTERS)[number],
      );
      return idx >= 0 && idx + 1 === labelLetterNum;
    });
    if (letterMatch) return letterMatch.note ?? null;
  }

  const normalizedMain = normalizeOptionMainForMatch(parsed.main);
  const mainMatch = inlineOptions.find(
    (option) => normalizeOptionMainForMatch(option.main) === normalizedMain,
  );
  if (mainMatch) return mainMatch.note ?? null;

  const day = extractWeekdayKey(parsed.main);
  if (!day) return null;
  const dayMatches = inlineOptions.filter((option) => extractWeekdayKey(option.main) === day);
  if (dayMatches.length === 1) return dayMatches[0].note ?? null;

  return null;
}

export interface ParsedPollOptionLine {
  letter: string;
  main: string;
  note: string | null;
}

export interface ParsedPollQuestion {
  intro: string;
  inlineOptions: ParsedPollOptionLine[];
  hasInlineOptions: boolean;
}

export interface FormattedPollOption {
  number: number;
  displayLine: string;
  bodyLine: string;
  detailNote: string | null;
  note: string | null;
}

function cleanPollDisplayText(text: string): string {
  return text
    .replace(/\s*\(\s*vast\s*\)/gi, "")
    .replace(/\s*\(\s*variabel\s*\)/gi, "")
    .replace(/\s*\(\s*onder voorbehoud\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatHourTokenWithMinutes(token: string): string {
  const match = token.trim().match(/^(\d{1,2})u(\d{2})?$/i);
  if (!match) return token.trim();
  const hour = match[1];
  const minutes = match[2] ?? "00";
  return `${hour}u${minutes}`;
}

function parseTimePartToStartEnd(timePart: string): { start: string; end: string } {
  const compact = timePart.replace(/\s/g, "");
  const rangeMatch = compact.match(/^(\d{1,2}u\d{0,2})-(\d{1,2}u\d{0,2})$/i);
  if (rangeMatch) {
    return {
      start: formatHourTokenWithMinutes(rangeMatch[1]),
      end: formatHourTokenWithMinutes(rangeMatch[2]),
    };
  }

  const singleMatch = compact.match(/^(\d{1,2}u\d{0,2})$/i);
  if (singleMatch) {
    const start = formatHourTokenWithMinutes(singleMatch[1]);
    const end = formatHourTokenWithMinutes(addOneHourToStart(normalizeHourToken(singleMatch[1])));
    return { start, end };
  }

  const fallback = formatTimeRangePart(timePart);
  const [start, end] = fallback.split("-");
  return {
    start: formatHourTokenWithMinutes(start ?? fallback),
    end: formatHourTokenWithMinutes(end ?? addOneHourToStart(normalizeHourToken(fallback))),
  };
}

function formatPollLocationDisplay(location: string): string {
  const cleaned = cleanPollDisplayText(location);
  if (/dageraad|harelbeke/i.test(cleaned)) return "Harelbeke";
  if (/vlasschaard|bavikhove/i.test(cleaned)) return "Bavikhove";
  return cleaned;
}

function formatPollOptionBodyLine(day: string, timePart: string, location: string): string {
  const abbr = DAY_ABBREVIATIONS[day.toLowerCase()] ?? day;
  const { start, end } = parseTimePartToStartEnd(timePart);
  return `${abbr} - ${start} - ${end} - ${formatPollLocationDisplay(location)}`;
}

function normalizeHourToken(token: string): string {
  const match = token.trim().match(/^(\d{1,2})u(\d{2})?$/i);
  if (!match) return token.trim();
  const hour = match[1];
  const minutes = match[2];
  if (!minutes || minutes === "00") return `${hour}u`;
  return `${hour}u${minutes}`;
}

function addOneHourToStart(start: string): string {
  const match = start.match(/^(\d{1,2})u(\d{2})?$/i);
  if (!match) return start;
  const hour = (parseInt(match[1], 10) + 1) % 24;
  const minutes = match[2];
  if (!minutes || minutes === "00") return `${hour}u`;
  return `${hour}u${minutes}`;
}

function formatTimeRangePart(timePart: string): string {
  const compact = timePart.replace(/\s/g, "");
  const rangeMatch = compact.match(/^(\d{1,2}u\d{0,2})-(\d{1,2}u\d{0,2})$/i);
  if (rangeMatch) {
    return `${normalizeHourToken(rangeMatch[1])}-${normalizeHourToken(rangeMatch[2])}`;
  }

  const singleMatch = compact.match(/^(\d{1,2}u\d{0,2})$/i);
  if (singleMatch) {
    const start = normalizeHourToken(singleMatch[1]);
    return `${start}-${addOneHourToStart(start)}`;
  }

  return timePart.trim();
}

function formatAvailabilityNote(note: string | null): string | null {
  if (!note) return null;

  const blockedMatch = note.match(/~?\s*(\d+)\s*x\b[^.]*(?:geblokkeerd|niet\s+beschikbaar|blok)/i);
  if (blockedMatch) {
    return `${blockedMatch[1]}x niet beschikbaar`;
  }

  const cleaned = cleanPollDisplayText(note);
  return cleaned || null;
}

function normalizePollTextDashes(text: string): string {
  return text.replace(/[\u2010-\u2015\u2212–—]/g, "-");
}

function parseOptionMainLine(main: string): {
  day: string;
  timePart: string;
  location: string;
} | null {
  const cleaned = normalizePollTextDashes(cleanPollDisplayText(main));
  const match = cleaned.match(
    /^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag)\s+(.+?)\s+-\s+(.+)$/i,
  );

  if (!match) return null;

  return {
    day: match[1],
    timePart: match[2].trim(),
    location: match[3].trim(),
  };
}

function splitOptionLine(line: string): ParsedPollOptionLine {
  const letter = line.slice(0, 2).trim();
  const rest = line.slice(2).trim();
  const [main, ...noteParts] = rest.split(/→/);
  const note = noteParts.join("→").trim();
  return {
    letter,
    main: cleanPollDisplayText(main.trim()),
    note: note ? cleanPollDisplayText(note) : null,
  };
}

export function parsePollQuestion(question: string): ParsedPollQuestion {
  const trimmed = question.trim();
  const parts = trimmed
    .split(OPTION_MARKER_REGEX)
    .map((part) => part.trim())
    .filter(Boolean);

  const isOptionLine = (value: string) => OPTION_START_REGEX.test(value);

  if (parts.length <= 1) {
    if (isOptionLine(trimmed)) {
      return {
        intro: "",
        inlineOptions: [splitOptionLine(trimmed)],
        hasInlineOptions: true,
      };
    }
    return { intro: cleanPollDisplayText(trimmed), inlineOptions: [], hasInlineOptions: false };
  }
  const intro = !isOptionLine(parts[0]) ? cleanPollDisplayText(parts[0]) : "";
  const optionParts = intro ? parts.slice(1) : parts;

  return {
    intro,
    inlineOptions: optionParts.map(splitOptionLine),
    hasInlineOptions: optionParts.length > 0,
  };
}

export function parseOptionLabel(label: string): ParsedPollOptionLine {
  const trimmed = label.trim();
  if (OPTION_START_REGEX.test(trimmed)) {
    return splitOptionLine(trimmed);
  }

  const [main, ...noteParts] = trimmed.split(/→/);
  const note = noteParts.join("→").trim();
  return {
    letter: "",
    main: cleanPollDisplayText(main.trim()),
    note: note ? cleanPollDisplayText(note) : null,
  };
}

function formatPollDetailNoteText(raw: string): string {
  if (/^onder voorbehoud\s*[-–—]/i.test(raw)) {
    return raw.replace(/^onder voorbehoud\s*[-–—]\s*indien de volleybalclub/i, "Onder voorbehoud - Indien de volleybal");
  }
  if (/^indien de volleybal/i.test(raw)) {
    return `Onder voorbehoud - ${raw.replace(/^indien de volleybalclub/i, "Indien de volleybal")}`;
  }
  return raw;
}

function getPollDetailNoteForDisplay(
  note: string | null | undefined,
  fallbackNote?: string | null,
): string | null {
  const raw = note
    ? cleanPollDisplayText(note)
    : fallbackNote
      ? cleanPollDisplayText(fallbackNote)
      : null;
  if (!raw) return null;
  return formatPollDetailNoteText(raw);
}

export function formatPollOptionDisplay(
  index: number,
  label: string,
  fallbackNote?: string | null,
): FormattedPollOption {
  const parsed = parseOptionLabel(label);
  const number = index + 1;
  const detailNote = getPollDetailNoteForDisplay(parsed.note, fallbackNote);
  const structured = parseOptionMainLine(parsed.main);

  if (structured) {
    const bodyLine = formatPollOptionBodyLine(
      structured.day,
      structured.timePart,
      structured.location,
    );
    return {
      number,
      displayLine: `${number}. ${bodyLine}`,
      bodyLine,
      detailNote,
      note: formatAvailabilityNote(parsed.note),
    };
  }

  const dayMatch = parsed.main.match(/^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag)\b/i);
  const timeLocationMatch = normalizePollTextDashes(cleanPollDisplayText(parsed.main)).match(
    /^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag)\s+(.+?)\s+-\s+(.+)$/i,
  );
  const bodyLine = timeLocationMatch
    ? formatPollOptionBodyLine(
        timeLocationMatch[1],
        timeLocationMatch[2].trim(),
        timeLocationMatch[3].trim(),
      )
    : dayMatch
      ? formatPollOptionBodyLine(dayMatch[0], parsed.main.slice(dayMatch[0].length).trim(), "")
      : parsed.main;

  return {
    number,
    displayLine: `${number}. ${bodyLine}`,
    bodyLine,
    detailNote,
    note: formatAvailabilityNote(parsed.note),
  };
}

export function formatParsedOptionLine(
  index: number,
  line: ParsedPollOptionLine,
): FormattedPollOption {
  const syntheticLabel = line.note
    ? `${line.letter} ${line.main} → ${line.note}`
    : line.letter
      ? `${line.letter} ${line.main}`
      : line.main;
  return formatPollOptionDisplay(index, syntheticLabel);
}

export function formatPollResponseCompactLine(label: string, number: number): string {
  const parsed = parseOptionLabel(label);
  const structured = parseOptionMainLine(parsed.main);

  if (structured) {
    const { start, end } = parseTimePartToStartEnd(structured.timePart);
    const abbr = DAY_ABBREVIATIONS[structured.day.toLowerCase()] ?? structured.day.toLowerCase();
    return `${number}. ${abbr} ${start}-${end}`;
  }

  const dayMatch = parsed.main.match(
    /^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag)\s+(.+)/i,
  );
  if (dayMatch) {
    const timePart = dayMatch[2].split(/\s+[–—-]\s+/)[0]?.trim() ?? dayMatch[2].trim();
    const timeRange = formatTimeRangePart(timePart.replace(/\s/g, ""));
    return `${number}. ${dayMatch[1].toLowerCase()} ${timeRange}`;
  }

  return formatPollOptionDisplay(number - 1, label).displayLine;
}

export function buildPollOptionDisplayNumberMap(
  options: Array<{ id: string; label: string }>,
): Map<string, number> {
  const sorted = sortPollOptionsForDisplay(options);
  return new Map(sorted.map((opt, index) => [opt.id, index + 1]));
}

export function getPollOptionDisplayNumberForLabel(
  label: string,
  options: Array<{ id: string; label: string }>,
): number {
  const sorted = sortPollOptionsForDisplay(options);
  const index = sorted.findIndex((opt) => opt.label === label);
  return index >= 0 ? index + 1 : 1;
}

export function getPollResponseSelectionLines(
  optionLabels: string[] | undefined,
  optionIds: string[] | undefined,
  pollOptions: Array<{ id: string; label: string }>,
): string[] {
  const labels =
    optionLabels?.length
      ? optionLabels
      : (optionIds ?? [])
          .map((id) => pollOptions.find((opt) => opt.id === id)?.label)
          .filter((label): label is string => Boolean(label));

  if (labels.length === 0) return [];

  return sortPollOptionsForDisplay(labels.map((label) => ({ label }))).map((item) =>
    formatPollResponseCompactLine(item.label, getPollOptionDisplayNumberForLabel(item.label, pollOptions)),
  );
}
