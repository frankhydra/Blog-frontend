// Formats a date into the { day, month } shape the postmark badge displays,
// e.g. "22" / "AUG". Used anywhere a post/letter/book shows its date stamp.
export function formatPostmark(dateString) {
  if (!dateString) return { day: '--', month: '' };
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
  };
}
