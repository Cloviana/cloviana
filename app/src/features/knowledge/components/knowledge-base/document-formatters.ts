const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return dateFormatter.format(date);
}

export function formatFullDate(value: string) {
  return fullDateFormatter.format(new Date(value));
}
