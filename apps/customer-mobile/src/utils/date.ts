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

export interface OrderDateGroupMeta {
  readonly key: string;
  readonly title: string;
  readonly isRecentDay: boolean;
}

/**
 * Resolves the date bucket header ("Today", "Yesterday", or "Month Year")
 * for grouping order rows chronologically.
 */
export function getOrderDateGroupMeta(isoTimestamp?: string | null): OrderDateGroupMeta {
  if (!isoTimestamp) {
    return { key: 'recent', title: 'Recent', isRecentDay: false };
  }
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    return { key: 'recent', title: 'Recent', isRecentDay: false };
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return { key: 'today', title: 'Today', isRecentDay: true };
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) {
    return { key: 'yesterday', title: 'Yesterday', isRecentDay: true };
  }

  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const title = date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  return { key: monthKey, title, isRecentDay: false };
}

/**
 * Formats a compact timestamp for rows inside a date-grouped section
 * (time-only for Today/Yesterday, "Mon D" for month sections).
 */
export function formatOrderCompactTimestamp(
  isoTimestamp: string | null | undefined,
  isRecentDay: boolean
): string {
  if (!isoTimestamp) return 'Just now';
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return 'Recently';

  if (isRecentDay) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
