import React from 'react';
import { STATUS_COLOR } from '../lookups.js';
import { dueInfo } from '../lib/dates.js';
import { isRecommended } from '../lib/scoring.js';

const STATUS_PILL_STYLES = {
  'Submitted': 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60',
  'Under review': 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-900/60',
  'Needs info': 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-900/60',
  'Approved': 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/50 border-teal-200/80 dark:border-teal-900/60',
  'In build': 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-900/60',
  'Delivered': 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900/60',
  'Rejected': 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-900/60',
  'Parked': 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/50',
};

const STATUS_DOT_STYLES = {
  'Submitted': 'bg-slate-500',
  'Under review': 'bg-blue-600',
  'Needs info': 'bg-amber-500',
  'Approved': 'bg-teal-600',
  'In build': 'bg-purple-600',
  'Delivered': 'bg-emerald-600',
  'Rejected': 'bg-rose-600',
  'Parked': 'bg-slate-400',
};

export function Pill({ status }) {
  const pillStyle = STATUS_PILL_STYLES[status] || STATUS_PILL_STYLES['Submitted'];
  const dotStyle = STATUS_DOT_STYLES[status] || STATUS_DOT_STYLES['Submitted'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border ${pillStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      <span>{status}</span>
    </span>
  );
}

export const Tag = ({ children }) => (
  <span className="inline-block text-xs text-[#646C8C] dark:text-[#A9A1C9] border border-purple-200/60 dark:border-purple-800/50 rounded-md px-2 py-0.5 bg-white/50 dark:bg-[#1E1740]/50 font-medium">
    {children}
  </span>
);

export function DueBadge({ idea }) {
  const d = dueInfo(idea);
  const colorClass =
    d.kind === 'late'
      ? 'text-rose-600 dark:text-rose-400 font-semibold'
      : d.kind === 'soon'
      ? 'text-amber-600 dark:text-amber-400 font-semibold'
      : 'text-[#646C8C] dark:text-[#A9A1C9] font-medium';
  return <span className={`text-xs ${colorClass}`}>{d.text}</span>;
}

export const Recommended = ({ scores }) =>
  isRecommended(scores) ? (
    <span className="inline-block text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 bg-teal-50 dark:bg-teal-950/40 rounded-md px-2 py-0.5 whitespace-nowrap">
      Recommended to approve
    </span>
  ) : null;

// ---- the three states every list needs ----
export function Loading({ rows = 3, label = 'Loading' }) {
  return (
    <div className="grid gap-3 w-full" role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-24 rounded-2xl border border-purple-200/60 dark:border-purple-900/50 bg-purple-100/40 dark:bg-purple-950/30 animate-pulse" />
      ))}
    </div>
  );
}

export const EmptyState = ({ children }) => (
  <div className="bg-white/60 dark:bg-[#1E1740]/60 backdrop-blur-md border border-dashed border-purple-200 dark:border-purple-800/60 rounded-2xl p-8 text-center text-[#646C8C] dark:text-[#A9A1C9] text-sm">
    {children}
  </div>
);

export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/60 rounded-2xl p-8 text-center text-[#1E1B4B] dark:text-[#EEE9FC]" role="alert">
      <p className="mb-3 text-sm text-rose-700 dark:text-rose-300">{message}</p>
      {onRetry && (
        <button
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}

// Renders loading / error / empty / content for any async list.
export function AsyncView({ state, isEmpty, empty, rows, children }) {
  if (state.loading && !state.data) return <Loading rows={rows} />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (state.data && isEmpty?.(state.data)) return <EmptyState>{empty}</EmptyState>;
  return state.data ? children(state.data) : null;
}

// Horizontal bar list (plain HTML bars, no chart library).
export function BarList({ items, colorOf }) {
  const max = Math.max(1, ...items.map(([, n]) => n));
  return items.map(([label, n]) => (
    <div className="grid grid-cols-[140px_1fr_28px] gap-2.5 items-center my-2 text-xs sm:text-[13px] text-[#1E1B4B] dark:text-[#EEE9FC]" key={label}>
      <span className="truncate">{label}</span>
      <div className="bg-purple-100/60 dark:bg-purple-950/60 rounded-md h-3 overflow-hidden">
        <i
          className="block h-3 rounded-md transition-all duration-300 min-w-[4px] bg-[#6B2FA8] dark:bg-[#A855F7]"
          style={{
            width: `${(n / max) * 100}%`,
            ...(colorOf ? { backgroundColor: `var(${colorOf(label)})` } : {}),
          }}
        />
      </div>
      <b className="text-right text-[#1E1B4B] dark:text-[#EEE9FC]">{n}</b>
    </div>
  ));
}

export function Field({ label, error, hint, children, htmlFor, counter, className }) {
  return (
    <div className={`${className !== undefined ? className : 'mb-2 sm:mb-2.5'} ${error ? 'text-rose-600 dark:text-rose-400' : ''}`}>
      <label htmlFor={htmlFor} className="block font-semibold mb-0.5 text-xs text-[#1E1B4B] dark:text-purple-100">
        {label}
      </label>
      {hint && (
        <p className="text-[11px] text-[#646C8C] dark:text-[#A9A1C9] mb-0.5 leading-snug" id={htmlFor ? `${htmlFor}-hint` : undefined}>
          {hint}
        </p>
      )}
      {children}
      {counter}
      {error && (
        <div className="text-rose-600 dark:text-rose-400 text-[11px] mt-0.5 font-medium" id={htmlFor ? `${htmlFor}-err` : undefined} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
