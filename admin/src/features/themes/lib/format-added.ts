// "Oct 15 at 11:48 pm"
export function formatAdded(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const time = date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase();
  return `${day} at ${time}`;
}
