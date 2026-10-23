import React, { useEffect, useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { STATUSES, CATEGORIES, TECH_AREAS } from '../lookups.js';

export const EMPTY_FILTERS = {
  q: '',
  status: '',
  category: '',
  technology: '',
  sort: 'newest',
};

export default function FilterBar({
  value,
  onChange,
  totalCount,
  filteredCount,
  withSort = true,
}) {
  const [q, setQ] = useState(value.q || '');

  // Debounce search input
  useEffect(() => {
    if (q === value.q) return undefined;
    const t = setTimeout(() => onChange({ ...value, q }), 200);
    return () => clearTimeout(t);
  }, [q, value, onChange]);

  useEffect(() => {
    setQ(value.q || '');
  }, [value.q]);

  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  const clearField = (k) => {
    if (k === 'q') setQ('');
    onChange({ ...value, [k]: '' });
  };

  const clearAll = () => {
    setQ('');
    onChange(EMPTY_FILTERS);
  };

  const hasActiveFilters = Boolean(
    value.q || value.status || value.category || value.technology
  );

  return (
    <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/50 p-4 sm:p-4.5 shadow-xs mb-6 space-y-3 transition-colors">
      {/* PRIMARY CONTROLS ROW */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search by title, description, ID, or submitter..."
            aria-label="Search ideas"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl bg-[#FAF8FE] dark:bg-[#251D4A] border border-[#E2D9F3] dark:border-purple-900/60 text-[#1E1B4B] dark:text-purple-100 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#7C3AED] focus:bg-white transition"
          />
          {q && (
            <button
              type="button"
              onClick={() => clearField('q')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              aria-label="Filter by Status"
              value={value.status}
              onChange={set('status')}
              className={`text-xs rounded-xl pl-3 pr-8 py-2.5 border transition font-medium cursor-pointer appearance-none ${
                value.status
                  ? 'bg-purple-50 text-[#6B2FA8] border-purple-300 font-semibold'
                  : 'bg-[#FAF8FE] dark:bg-[#251D4A] border-[#E2D9F3] dark:border-purple-900/60 text-[#334155] dark:text-purple-200 hover:border-purple-300'
              }`}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              aria-label="Filter by Category"
              value={value.category}
              onChange={set('category')}
              className={`text-xs rounded-xl pl-3 pr-8 py-2.5 border transition font-medium cursor-pointer appearance-none ${
                value.category
                  ? 'bg-purple-50 text-[#6B2FA8] border-purple-300 font-semibold'
                  : 'bg-[#FAF8FE] dark:bg-[#251D4A] border-[#E2D9F3] dark:border-purple-900/60 text-[#334155] dark:text-purple-200 hover:border-purple-300'
              }`}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
          </div>

          {/* Technology Area Dropdown */}
          <div className="relative">
            <select
              aria-label="Filter by Technology area"
              value={value.technology}
              onChange={set('technology')}
              className={`text-xs rounded-xl pl-3 pr-8 py-2.5 border transition font-medium cursor-pointer appearance-none ${
                value.technology
                  ? 'bg-purple-50 text-[#6B2FA8] border-purple-300 font-semibold'
                  : 'bg-[#FAF8FE] dark:bg-[#251D4A] border-[#E2D9F3] dark:border-purple-900/60 text-[#334155] dark:text-purple-200 hover:border-purple-300'
              }`}
            >
              <option value="">All technologies</option>
              {TECH_AREAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
          </div>

          {/* Sort Control */}
          {withSort && (
            <div className="relative">
              <select
                aria-label="Sort ideas"
                value={value.sort}
                onChange={set('sort')}
                className="text-xs rounded-xl pl-3 pr-8 py-2.5 border bg-[#FAF8FE] dark:bg-[#251D4A] border-[#E2D9F3] dark:border-purple-900/60 text-[#334155] dark:text-purple-200 hover:border-purple-300 font-medium cursor-pointer appearance-none"
              >
                <option value="newest">Newest first</option>
                <option value="votes">Most votes</option>
                <option value="score">Highest scored</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE FILTER TAGS & RESULT COUNT */}
      {(hasActiveFilters || filteredCount !== undefined) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-purple-50 dark:border-purple-900/30 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">


            {value.q && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-purple-100/80 text-[#6B2FA8] font-medium">
                Search: "{value.q}"
                <button
                  type="button"
                  onClick={() => clearField('q')}
                  className="hover:text-purple-900 cursor-pointer"
                  aria-label="Remove search filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {value.status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-purple-100/80 text-[#6B2FA8] font-medium">
                Status: {value.status}
                <button
                  type="button"
                  onClick={() => clearField('status')}
                  className="hover:text-purple-900 cursor-pointer"
                  aria-label="Remove status filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {value.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-purple-100/80 text-[#6B2FA8] font-medium">
                Category: {value.category}
                <button
                  type="button"
                  onClick={() => clearField('category')}
                  className="hover:text-purple-900 cursor-pointer"
                  aria-label="Remove category filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {value.technology && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-purple-100/80 text-[#6B2FA8] font-medium">
                Tech: {value.technology}
                <button
                  type="button"
                  onClick={() => clearField('technology')}
                  className="hover:text-purple-900 cursor-pointer"
                  aria-label="Remove technology filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] text-[#6B2FA8] dark:text-purple-300 hover:underline font-semibold ml-1 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {filteredCount !== undefined && (
            <div className="text-[11.5px] text-[#64748B] font-medium ml-auto">
              Showing <b className="text-[#1E1B4B] dark:text-purple-200">{filteredCount}</b>
              {totalCount !== undefined && totalCount !== filteredCount && (
                <span> of {totalCount}</span>
              )}{' '}
              ideas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
