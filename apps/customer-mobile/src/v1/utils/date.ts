/**
 * Formats an ISO8601 timestamp into a clean relative date string
 * (e.g., "Today, 4:00 PM", "Yesterday, 2:30 PM", or "Nov 16, 2026")
 */
export function formatOrderDate(isoTimestamp?: string | null): string {
  if (!isoTimestamp) return 'Just now';

  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
