import { REPLY_SLA_DAYS } from '../lookups.js';

export const DAY = 86400000;
export const fdate = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const daysSince = (t) => Math.floor((Date.now() - t) / DAY);

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1 min ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hr ago';
  if (diffHours < 24) return `${diffHours} hrs ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return fdate(timestamp);
}

export function formatFullDateTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Reply-promise badge: replied on a date, due in N days (amber at 3 or fewer), or N days overdue (red).
export function dueInfo(idea) {
  if (idea.firstFeedbackAt) return { kind: 'ok', text: `Replied ${fdate(idea.firstFeedbackAt)}` };
  const left = REPLY_SLA_DAYS - daysSince(idea.createdAt);
  if (left < 0) return { kind: 'late', text: `${-left} ${-left === 1 ? 'day' : 'days'} overdue` };
  if (left <= 3) return { kind: 'soon', text: `Reply due in ${left} ${left === 1 ? 'day' : 'days'}` };
  return { kind: 'ok', text: `Reply due in ${left} days` };
}

