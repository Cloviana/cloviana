import { formatInTimeZone } from 'date-fns-tz';

export function formatWithDateFns(date: string) {
  const raw = formatInTimeZone(new Date(date), 'UTC', "MMM d 'at' h:mm a");
  return raw.replace(/AM|PM/, (m) => m.toLowerCase());
}
