import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

/** Parse an ISO UTC string and return a Date in local time. */
export function parseUTC(isoString: string): Date {
  // Backend returns naive UTC strings — append 'Z' to treat as UTC
  const normalized = isoString.endsWith("Z") ? isoString : `${isoString}Z`;
  return parseISO(normalized);
}

export function formatMatchDate(isoString: string): string {
  return format(parseUTC(isoString), "EEE, d MMM yyyy");
}

export function formatMatchTime(isoString: string): string {
  return format(parseUTC(isoString), "HH:mm");
}

export function formatMatchDateTime(isoString: string): string {
  return format(parseUTC(isoString), "EEE, d MMM yyyy · HH:mm");
}

export function formatRelative(isoString: string): string {
  const date = parseUTC(isoString);
  if (isPast(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return `in ${formatDistanceToNow(date)}`;
}

export function isMatchLocked(matchDatetime: string): boolean {
  return isPast(parseUTC(matchDatetime));
}

export function isMatchVisible(matchDatetime: string): boolean {
  const dt = parseUTC(matchDatetime);
  const cutoff = new Date(Date.now() + 12 * 60 * 60 * 1000);
  return dt <= cutoff;
}
