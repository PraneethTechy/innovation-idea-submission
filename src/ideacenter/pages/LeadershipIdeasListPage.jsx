import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Lightbulb,
  Clock,
  Settings,
  Trophy,
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  LayoutGrid,
  List,
  Compass,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  User,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { asMessage } from '../api/errors.js';
import { useAsync } from '../hooks/useAsync.js';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useSpark } from '../hooks/SparkContext.jsx';
import { navigate, A } from '../hooks/useNav.jsx';
import { canVote } from '../permissions.js';
import IdeaCard from '../components/IdeaCard.jsx';
import { Pill, Tag, Loading, AsyncView, DueBadge, Recommended } from '../components/ui.jsx';
import { weightedScore } from '../lib/scoring.js';
import { CATEGORIES, TECH_AREAS, STATUSES } from '../lookups.js';
import { fdate } from '../lib/dates.js';

// KPI Filter Category Definitions corresponding to Dashboard Cards
export const KPI_CATEGORIES = {
  total: {
    key: 'total',
    label: 'Total Ideas',
    title: 'All Innovation Ideas',
    shortTitle: 'All Ideas',
    description: 'Comprehensive pipeline of employee submissions, concepts, and initiatives across all departments.',
    icon: Lightbulb,
    iconBg: 'bg-purple-100 text-[#6D28D9] dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    badgeCls: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300',
    statSubtext: 'All submissions in system',
    match: () => true,
  },
  pending: {
    key: 'pending',
    label: 'Pending Review',
    title: 'Ideas Pending Review',
    shortTitle: 'Pending Review',
    description: 'Submissions awaiting evaluation, scoring, or decision from leadership and appointed reviewers.',
    icon: Clock,
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    badgeCls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
    statSubtext: 'Needs review / decision',
    match: (i) => i.status === 'Submitted' || i.status === 'Under review',
  },
  implementation: {
    key: 'implementation',
    label: 'In Implementation',
    title: 'Ideas in Implementation',
    shortTitle: 'In Implementation',
    description: 'Approved initiatives currently in active engineering build, prototyping, or lab pipeline.',
    icon: Settings,
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
    statSubtext: 'Active engineering pipeline',
    match: (i) => i.status === 'Approved' || i.status === 'In build',
  },
  delivered: {
    key: 'delivered',
    label: 'Delivered',
    title: 'Delivered Innovations',
    shortTitle: 'Delivered',
    description: 'Production-ready solutions and initiatives successfully rolled out live across GWC.',
    icon: Trophy,
    iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    badgeCls: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300',
    statSubtext: 'Live in production',
    match: (i) => i.status === 'Delivered',
  },
};

function normalizeFilter(param) {
  if (!param) return 'total';
  const p = param.toLowerCase().trim();
  if (p === 'pending' || p === 'pending-review' || p === 'review' || p === 'under-review') return 'pending';
  if (p === 'implementation' || p === 'in-implementation' || p === 'in-build' || p === 'build') return 'implementation';
  if (p === 'delivered' || p === 'completed' || p === 'live') return 'delivered';
  return 'total';
}

export default function LeadershipIdeasListPage({ filterParam }) {
  const user = useCurrentUser();
  const { openIdea, toast, version } = useSpark();

  // Active KPI Category Filter Tab
  const [activeTab, setActiveTab] = useState(() => normalizeFilter(filterParam));

  // Sync state if filterParam changes via URL
  useEffect(() => {
    setActiveTab(normalizeFilter(filterParam));
  }, [filterParam]);

  // View mode: Grid vs Table
  const [viewMode, setViewMode] = useState('grid');

  // Search & secondary filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [technologyFilter, setTechnologyFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Bookmarking support
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('spark_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('spark_bookmarks', JSON.stringify(next));
      } catch {
        /* storage full/blocked */
      }
      return next;
    });
  };

  // Optimistic vote overrides
  const [overrides, setOverrides] = useState({});

  // Fetch all ideas
  const state = useAsync(() => api.listIdeas({}), [version]);
  const allIdeas = state.data || [];

  // Derived KPI Counts from active data
  const counts = useMemo(() => {
    return {
      total: allIdeas.length,
      pending: allIdeas.filter(KPI_CATEGORIES.pending.match).length,
      implementation: allIdeas.filter(KPI_CATEGORIES.implementation.match).length,
      delivered: allIdeas.filter(KPI_CATEGORIES.delivered.match).length,
    };
  }, [allIdeas]);

  // Current active category definition
  const currentCategory = KPI_CATEGORIES[activeTab] || KPI_CATEGORIES.total;
  const CategoryIcon = currentCategory.icon;

  // Filter ideas based on active KPI category + secondary filters
  const displayedIdeas = useMemo(() => {
    let list = allIdeas.filter(currentCategory.match);

    // Search query filter (matches title, problem, solution, submitter, ID, dept)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((i) => {
        return (
          i.title?.toLowerCase().includes(q) ||
          i.id?.toLowerCase().includes(q) ||
          i.submitterName?.toLowerCase().includes(q) ||
          i.dept?.toLowerCase().includes(q) ||
          i.problem?.toLowerCase().includes(q) ||
          i.solution?.toLowerCase().includes(q)
        );
      });
    }

    // Category filter
    if (categoryFilter) {
      list = list.filter((i) => i.category === categoryFilter);
    }

    // Technology filter
    if (technologyFilter) {
      list = list.filter((i) => i.technology === technologyFilter);
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'votes') {
        const va = (overrides[a.id]?.voteCount ?? a.voteCount) || 0;
        const vb = (overrides[b.id]?.voteCount ?? b.voteCount) || 0;
        return vb - va;
      }
      if (sortBy === 'oldest') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      // default: newest first
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [allIdeas, activeTab, currentCategory, searchQuery, categoryFilter, technologyFilter, sortBy, overrides]);

  // Handle Tab Switch
  const handleTabChange = (key) => {
    setActiveTab(key);
    navigate(`/admin/ideas/${key}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setTechnologyFilter('');
    setSortBy('newest');
  };

  // Voting handler
  const handleVote = async (idea) => {
    const before = { votedByMe: idea.votedByMe, voteCount: idea.voteCount };
    const next = {
      votedByMe: !before.votedByMe,
      voteCount: before.voteCount + (before.votedByMe ? -1 : 1),
    };
    setOverrides((o) => ({ ...o, [idea.id]: next }));
    try {
      const r = await api.toggleVote(idea.id);
      setOverrides((o) => ({ ...o, [idea.id]: r }));
    } catch (e) {
      setOverrides((o) => ({ ...o, [idea.id]: before }));
      toast?.(`Your vote did not save. ${asMessage(e)}`);
    }
  };

  const hasSecondaryFilters = Boolean(searchQuery || categoryFilter || technologyFilter);

  return (
    <div className="space-y-5 max-w-[1380px] mx-auto py-2 sm:py-3">
      {/* 1. TOP BREADCRUMB & WORKSPACE ACTION ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-purple-200/60 dark:border-purple-800/50">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[#6D28D9] dark:text-[#C4B5FD] hover:text-[#521C85] dark:hover:text-white transition-colors cursor-pointer group self-start"
          aria-label="Back to Leadership Dashboard"
        >
          <div className="w-7 h-7 rounded-full bg-white dark:bg-[#1E1740] border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center shadow-2xs group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft size={14} />
          </div>
          <span>Back to Leadership Dashboard</span>
        </button>

        {/* Quick Links to Pipeline Manager and Review Table */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <A
            to="/admin/manage"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1740] border border-purple-200/80 dark:border-purple-800/60 text-[11.5px] font-semibold text-[#6D28D9] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 shadow-2xs transition-all"
          >
            <SlidersHorizontal size={13} />
            <span>Pipeline Manager</span>
          </A>
          <A
            to="/admin/review"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1740] border border-purple-200/80 dark:border-purple-800/60 text-[11.5px] font-semibold text-[#6D28D9] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 shadow-2xs transition-all"
          >
            <ExternalLink size={13} />
            <span>Scoring Queue</span>
          </A>
        </div>
      </div>

      {/* 2. EXECUTIVE HERO HEADER CARD WITH DYNAMIC CATEGORY CONTEXT */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#EAE4FC] via-[#F6F2FF] to-[#DFD2F9] dark:from-[#211846] dark:via-[#1A1338] dark:to-[#281D52] border border-[#D5C6F7] dark:border-purple-800/60 rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(107,47,168,0.06)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${currentCategory.iconBg}`}>
              <CategoryIcon size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B2FA8] dark:text-[#C4B5FD] bg-purple-100/80 dark:bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/40">
                  Leadership View
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${currentCategory.badgeCls}`}>
                  {counts[activeTab]} {counts[activeTab] === 1 ? 'Idea' : 'Ideas'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-[#FAF7FF] font-display tracking-tight leading-tight">
                {currentCategory.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#5D5875] dark:text-[#A9A1C9] mt-1 max-w-2xl font-normal leading-relaxed">
                {currentCategory.description}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <A
              to="/employee/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] text-white !text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/25 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              style={{ color: '#ffffff' }}
            >
              <Sparkles size={14} style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff' }}>Submit Proposal</span>
            </A>
          </div>
        </div>
      </div>

      {/* 3. FOUR INTERACTIVE KPI FILTER TABS (Directly maps to the 4 Dashboard Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {Object.values(KPI_CATEGORIES).map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.key;
          const count = counts[cat.key];

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleTabChange(cat.key)}
              className={`relative flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all text-left cursor-pointer outline-none select-none ${
                isActive
                  ? 'bg-white dark:bg-[#1E1740] border-[#7C3AED] dark:border-[#9333EA] shadow-[0_6px_22px_rgba(124,58,237,0.16)] ring-2 ring-[#7C3AED]/20 -translate-y-0.5'
                  : 'bg-white/75 dark:bg-[#1E1740]/75 hover:bg-white dark:hover:bg-[#1E1740] border-purple-100/90 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 shadow-2xs hover:shadow-xs'
              }`}
              aria-pressed={isActive}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform ${
                  isActive ? 'scale-105 ' + cat.iconBg : 'bg-purple-50/70 dark:bg-purple-950/40 text-slate-600 dark:text-purple-300 border-purple-100/60 dark:border-purple-900/40'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] sm:text-xs font-semibold truncate ${isActive ? 'text-[#7C3AED] dark:text-[#C4B5FD]' : 'text-slate-500 dark:text-purple-300'}`}>
                  {cat.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-xl sm:text-2xl font-black font-display leading-none ${isActive ? 'text-[#1E1B4B] dark:text-white' : 'text-slate-800 dark:text-purple-100'}`}>
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-purple-400 font-medium truncate">
                    ideas
                  </span>
                </div>
              </div>

              {/* Active Tab Indicator Pip */}
              {isActive && (
                <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-[#7C3AED] dark:bg-purple-400 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. DISCOVERY TOOLBAR: Search, Category, Technology, Sort & View Mode Toggle */}
      <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/50 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${currentCategory.shortTitle.toLowerCase()} by title, ID, submitter, department...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-[13px] rounded-xl bg-slate-50 dark:bg-[#251D4A]/60 border border-purple-200/70 dark:border-purple-800/50 focus:bg-white dark:focus:bg-[#251D4A] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 dark:text-purple-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#251D4A]/60 border border-purple-200/70 dark:border-purple-800/50 focus:bg-white dark:focus:bg-[#251D4A] focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 dark:text-purple-100"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Technology Filter */}
            <select
              value={technologyFilter}
              onChange={(e) => setTechnologyFilter(e.target.value)}
              className="py-2 px-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#251D4A]/60 border border-purple-200/70 dark:border-purple-800/50 focus:bg-white dark:focus:bg-[#251D4A] focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 dark:text-purple-100"
              aria-label="Filter by technology"
            >
              <option value="">All Technologies</option>
              {TECH_AREAS.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#251D4A]/60 border border-purple-200/70 dark:border-purple-800/50 focus:bg-white dark:focus:bg-[#251D4A] focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 dark:text-purple-100"
              aria-label="Sort ideas"
            >
              <option value="newest">Newest First</option>
              <option value="votes">Most Voted</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Grid vs Table View Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#251D4A] rounded-xl border border-purple-200/60 dark:border-purple-800/40 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#1E1740] text-[#7C3AED] dark:text-[#C4B5FD] shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-purple-400 hover:text-slate-700'
                }`}
                title="Grid Cards View"
                aria-label="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#1E1740] text-[#7C3AED] dark:text-[#C4B5FD] shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-purple-400 hover:text-slate-700'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List size={15} />
              </button>
            </div>

            {/* Reset Filters Button */}
            {hasSecondaryFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 text-xs font-semibold rounded-xl text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-purple-50 dark:hover:bg-purple-950/40 transition flex items-center gap-1"
                title="Reset filters"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Matching Summary */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#A9A1C9] pt-1 border-t border-purple-50 dark:border-purple-900/30">
          <span>
            Showing <strong className="text-slate-800 dark:text-purple-100">{displayedIdeas.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-purple-100">{counts[activeTab]}</strong> {currentCategory.label.toLowerCase()}
          </span>
          {hasSecondaryFilters && (
            <span className="text-purple-600 dark:text-purple-300 font-medium">Filtered search active</span>
          )}
        </div>
      </div>

      {/* 5. MAIN CONTENT AREA: REUSABLE IDEACARD GRID OR DETAILED TABLE */}
      {state.loading && !state.data ? (
        <Loading rows={4} label="Loading ideas..." />
      ) : displayedIdeas.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#1E1740] rounded-3xl border border-[#E4DCF5] dark:border-purple-900/50 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#6B2FA8] dark:text-purple-300 flex items-center justify-center mx-auto border border-purple-100 dark:border-purple-900/40">
            <Compass size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-[#1E1B4B] dark:text-purple-100">
              No ideas found for {currentCategory.label}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#A9A1C9] leading-relaxed">
              {hasSecondaryFilters
                ? 'No ideas match your active search or filter combination. Try clearing filters to see all ideas in this section.'
                : `There are currently no ideas under the ${currentCategory.label.toLowerCase()} lifecycle stage.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasSecondaryFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Clear filters</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleTabChange('total')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6B2FA8] hover:bg-[#582090] text-white shadow-xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lightbulb size={13} />
              <span>View All Ideas ({counts.total})</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* REUSABLE 3-COLUMN IDEACARD GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full">
          {displayedIdeas.map((idea) => {
            const mergedIdea = { ...idea, ...overrides[idea.id] };
            const isBookmarked = bookmarkedIds.includes(idea.id);

            return (
              <IdeaCard
                key={idea.id}
                idea={mergedIdea}
                onOpen={openIdea}
                onVote={canVote(user) ? () => handleVote(idea) : undefined}
                isBookmarked={isBookmarked}
                onToggleBookmark={toggleBookmark}
              />
            );
          })}
        </div>
      ) : (
        /* DETAILED TABLE VIEW */
        <div className="overflow-x-auto bg-white/90 dark:bg-[#1E1740]/90 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl shadow-xs">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs sm:text-[13px]">
            <thead className="bg-purple-50/80 dark:bg-purple-950/50 text-[#646C8C] dark:text-[#A9A1C9] font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">ID</th>
                <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Idea</th>
                <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Submitted by</th>
                <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Status</th>
                <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Reviewer</th>
                <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Score</th>
                <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/70 dark:divide-purple-900/30">
              {displayedIdeas.map((i) => {
                const w = weightedScore(i.scores);
                return (
                  <tr key={i.id} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition">
                    <td className="px-4 py-3.5 align-top font-mono text-xs text-[#6B2FA8] dark:text-[#C4B5FD] font-semibold">
                      {i.id}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <button
                        className="font-semibold text-left text-[#1E1B4B] dark:text-[#EEE9FC] hover:text-[#6B2FA8] dark:hover:text-[#C4B5FD] hover:underline cursor-pointer block mb-1.5"
                        onClick={() => openIdea(i.id)}
                      >
                        {i.title}
                      </button>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <Tag>{i.category}</Tag> <Tag>{i.technology}</Tag>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-medium text-[#1E1B4B] dark:text-[#EEE9FC]">{i.submitterName}</div>
                      <span className="text-xs text-[#646C8C] dark:text-[#A9A1C9]">{i.dept || i.submitterType}</span>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <Pill status={i.status} />
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      {i.assigneeName ? (
                        <span className="text-[#1E1B4B] dark:text-[#EEE9FC]">{i.assigneeName}</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-medium text-[#1E1B4B] dark:text-[#EEE9FC]">{w ? `${w.toFixed(1)} / 5` : 'Not scored'}</div>
                      <div className="mt-1"><Recommended scores={i.scores} /></div>
                    </td>
                    <td className="px-4 py-3.5 align-top text-right">
                      <button
                        type="button"
                        onClick={() => openIdea(i.id)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-[#C4B5FD] hover:bg-purple-100 transition cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
