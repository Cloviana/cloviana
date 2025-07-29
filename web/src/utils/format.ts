import { format } from 'date-fns';

export function formatWithDateFns(date: string) {
  // produces "Jul 8 at 7:40 PM"
  const raw = format(date, "MMM d 'at' h:mm a");
  // then lowercase only the AM/PM
  return raw.replace(/AM|PM/, (m) => m.toLowerCase());
}
