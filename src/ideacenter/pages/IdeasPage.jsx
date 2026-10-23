import React, { useEffect, useState, useMemo } from 'react';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Compass,
  Clock,
  Layers,
  Rocket,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { asMessage } from '../api/errors.js';
import { useAsync } from '../hooks/useAsync.js';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useSpark } from '../hooks/SparkContext.jsx';
import { navigate, A } from '../hooks/useNav.jsx';
import { REPLY_SLA_DAYS, LIMITS, CATEGORIES } from '../lookups.js';
import { canVote } from '../permissions.js';
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar.jsx';
import IdeaCard from '../components/IdeaCard.jsx';
import { Loading } from '../components/ui.jsx';

export default function IdeasPage() {
  const user = useCurrentUser();
  const { openIdea, toast, version } = useSpark();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [overrides, setOverrides] = useState({}); // optimistic vote changes

  // Local bookmarks state (persisted to localStorage)
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

  // Fetch filtered ideas
  const state = useAsync(() => api.listIdeas(filters), [filters, version]);
  useEffect(() => {
    setOverrides({});
  }, [state.data]);

  // Fetch all ideas to derive stats
  const allIdeasState = useAsync(() => api.listIdeas(EMPTY_FILTERS), [version]);

  // Stats derived from data
  const stats = useMemo(() => {
    const list = allIdeasState.data || [];
    const inBuild = list.filter((i) => i.status === 'In build').length;
    const delivered = list.filter((i) => i.status === 'Delivered').length;
    return { total: list.length, inBuild, delivered };
  }, [allIdeasState.data]);

  // Optimistic vote handler
  const vote = async (idea) => {
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
      toast(`Your vote did not save. ${asMessage(e)}`);
    }
  };

  const totalCount = allIdeasState.data?.length || 0;
  const filteredIdeas = state.data || [];

  return (
    <div className="py-6 space-y-6">
      {/* 1. DISTINCTIVE DISCOVERY HERO BANNER — Rich, Innovative Multi-Layered Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#EAE4FC] via-[#F5F0FF] to-[#DFD2F9] dark:from-[#211846] dark:via-[#1A1338] dark:to-[#281D52] border border-[#D5C6F7] dark:border-purple-800/60 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(107,47,168,0.06)]">
        {/* Soft Background Wave & Constellation Spark Network Decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* Constellation / Collaborative Network Pattern */}
          <svg
            className="absolute right-0 top-0 w-2/3 h-full opacity-35 dark:opacity-20"
            viewBox="0 0 600 240"
            fill="none"
          >
            <path
              d="M120 40 L240 90 L380 50 L520 110 M240 90 L320 180 L460 160 M380 50 L460 160 L540 190 M120 40 L180 150 L320 180 M520 110 L540 190"
              stroke="#7C3AED"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity="0.45"
            />
            <circle cx="120" cy="40" r="4" fill="#7C3AED" fillOpacity="0.7" />
            <circle cx="240" cy="90" r="5" fill="#6B2FA8" fillOpacity="0.8" />
            <circle cx="380" cy="50" r="4.5" fill="#8B5CF6" fillOpacity="0.7" />
            <circle cx="520" cy="110" r="5" fill="#A855F7" fillOpacity="0.8" />
            <circle cx="180" cy="150" r="3.5" fill="#7C3AED" fillOpacity="0.6" />
            <circle cx="320" cy="180" r="5" fill="#6B2FA8" fillOpacity="0.85" />
            <circle cx="460" cy="160" r="4" fill="#8B5CF6" fillOpacity="0.7" />
            <circle cx="540" cy="190" r="3.5" fill="#A855F7" fillOpacity="0.6" />
          </svg>

          {/* Dual Dynamic Flow Waves at Bottom */}
          <svg
            className="absolute -bottom-1 left-0 right-0 w-full h-28 opacity-45 dark:opacity-25"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hero-discover-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#DDD6FE" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="hero-discover-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 C240,95 480,20 720,65 C960,110 1080,30 1200,65 L1200,120 L0,120 Z"
              fill="url(#hero-discover-grad-1)"
            />
            <path
              d="M0,75 C200,35 440,105 680,60 C920,15 1060,85 1200,70 L1200,120 L0,120 Z"
              fill="url(#hero-discover-grad-2)"
            />
          </svg>

          {/* Ambient Radiant Glow Orbs */}
          <div className="absolute right-16 -top-16 w-88 h-88 bg-purple-400/25 rounded-full blur-3xl" />
          <div className="absolute left-1/4 -bottom-12 w-64 h-64 bg-indigo-300/20 rounded-full blur-2xl" />
          <div className="absolute right-1/3 top-10 w-48 h-48 bg-fuchsia-300/15 rounded-full blur-2xl" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-purple-950/80 text-[#6B2FA8] dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 text-[11px] font-bold tracking-wider uppercase shadow-2xs">
              <Sparkles size={12} className="text-[#7C3AED]" />
              <span>EXPLORE IDEAS</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3.5xl font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC] tracking-tight">
              Ideas from across GWC
            </h1>

            {/* Supporting Text */}
            <p className="text-sm sm:text-[14.5px] text-[#4A4363] dark:text-[#A9A1C9] leading-relaxed">
              Discover innovative ideas, support the ones you believe in, and help turn great thinking into real impact. Every idea receives structured review within {REPLY_SLA_DAYS} days.
            </p>
          </div>

          {/* Live Innovation Feed Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 shrink-0 bg-white/90 dark:bg-[#1E1740]/90 backdrop-blur-md p-4 rounded-2xl border border-white/80 dark:border-purple-800/50 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6B2FA8] via-[#7C3AED] to-[#9333EA] text-white flex items-center justify-center shadow-md shrink-0">
              <Lightbulb size={23} className="fill-white/20" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#1E1B4B] dark:text-purple-100 flex items-center gap-1.5">
                <span>Live Innovation Feed</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </p>
              <p className="text-[11.5px] text-[#64748B] dark:text-[#A9A1C9]">
                {stats.total} total submissions across GWC
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  {stats.inBuild} in build
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {stats.delivered} delivered
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COHERENT DISCOVERY TOOLBAR: Search, Filters, and Sorting */}
      <FilterBar
        value={filters}
        onChange={setFilters}
        totalCount={totalCount}
        filteredCount={filteredIdeas.length}
      />



      {/* 5. FULL-WIDTH 3-COLUMN CARDS GRID (No Right Sidebar) */}
      <div className="w-full">
        {state.loading && !state.data ? (
          <Loading rows={4} label="Loading ideas..." />
        ) : filteredIdeas.length === 0 ? (
          /* DESIGNED EMPTY STATE */
          <div className="bg-white dark:bg-[#1E1740] rounded-3xl border border-[#E4DCF5] dark:border-purple-900/50 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#6B2FA8] dark:text-purple-300 flex items-center justify-center mx-auto border border-purple-100 dark:border-purple-900/40">
              <Compass size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-bold text-[#1E1B4B] dark:text-purple-100">
                No ideas match your filters
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#A9A1C9] leading-relaxed">
                We couldn't find any submissions matching your search or active filter combination. Clear your filters or be the first to submit an idea in this space.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Clear all filters</span>
              </button>
              <A
                to="/employee/submit"
                className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#6B2FA8] hover:bg-[#582090] !text-white text-white shadow-xs transition inline-flex items-center justify-center gap-2"
                style={{ color: '#ffffff' }}
              >
                <Sparkles size={13} className="shrink-0 !text-white" style={{ color: '#ffffff' }} />
                <span className="!text-white leading-none" style={{ color: '#ffffff' }}>Submit an idea</span>
              </A>
            </div>
          </div>
        ) : (
          /* WIDE 3-COLUMN GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {filteredIdeas.map((idea) => {
              const mergedIdea = { ...idea, ...overrides[idea.id] };
              const isBookmarked = bookmarkedIds.includes(idea.id);
              return (
                <IdeaCard
                  key={idea.id}
                  idea={mergedIdea}
                  onOpen={openIdea}
                  onVote={canVote(user) ? vote : undefined}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
