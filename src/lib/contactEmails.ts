/** Split op komma of puntkomma; lege waarden weg. */
export function parseContactEmails(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [""];
  const parts = raw
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [""];
}

/** Opslaan als komma-gescheiden lijst (backward compatible). */
export function joinContactEmails(emails: readonly string[]): string {
  return emails.map((email) => email.trim()).filter(Boolean).join(", ");
}

export function isValidContactEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function validateContactEmails(raw: string): string | null {
  const emails = parseContactEmails(raw).filter((email) => email.trim());
  if (emails.length === 0) return null;

  for (const email of emails) {
    if (!isValidContactEmail(email)) {
      return `"${email.trim()}" is geen geldig e-mailadres`;
    }
  }
  return null;
}
