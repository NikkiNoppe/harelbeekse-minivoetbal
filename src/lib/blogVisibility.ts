export interface BlogPostVisibility {
  published: boolean;
  visible_from?: string | null;
  visible_until?: string | null;
  published_at?: string;
}

export type BlogScheduleStatus = "draft" | "scheduled" | "live" | "expired";

function parseDateOnly(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const normalized = value.trim();
  const date = new Date(normalized.length === 10 ? `${normalized}T12:00:00` : normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getBlogScheduleStatus(
  value: BlogPostVisibility,
  referenceDate = new Date(),
): BlogScheduleStatus {
  if (!value.published) return "draft";

  const today = startOfDay(referenceDate);
  const from = value.visible_from ? startOfDay(parseDateOnly(value.visible_from)!) : null;
  const until = value.visible_until ? startOfDay(parseDateOnly(value.visible_until)!) : null;

  if (from && today < from) return "scheduled";
  if (until && today > until) return "expired";
  return "live";
}

export function isBlogPostPubliclyVisible(
  value: BlogPostVisibility,
  referenceDate = new Date(),
): boolean {
  return getBlogScheduleStatus(value, referenceDate) === "live";
}

export function formatBlogDate(value?: string | null): string {
  if (!value?.trim()) return "—";
  const parsed = parseDateOnly(value);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatBlogVisibilityRange(value: BlogPostVisibility): string {
  const from = value.visible_from?.trim();
  const until = value.visible_until?.trim();

  if (from && until) {
    return `${formatBlogDate(from)} – ${formatBlogDate(until)}`;
  }
  if (from) return `Vanaf ${formatBlogDate(from)}`;
  if (until) return `Tot ${formatBlogDate(until)}`;
  return "Altijd zichtbaar";
}

export const BLOG_STATUS_LABELS: Record<BlogScheduleStatus, string> = {
  draft: "Concept",
  scheduled: "Gepland",
  live: "Live",
  expired: "Verlopen",
};

export function validateBlogVisibilityRange(
  visibleFrom: string,
  visibleUntil: string,
): string | null {
  if (!visibleFrom || !visibleUntil) return null;

  const from = parseDateOnly(visibleFrom);
  const until = parseDateOnly(visibleUntil);
  if (!from || !until) return null;

  if (startOfDay(until) < startOfDay(from)) {
    return "Einddatum moet op of na de startdatum liggen.";
  }

  return null;
}
