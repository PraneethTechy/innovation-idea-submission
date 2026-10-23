import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  ThumbsUp,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Layers,
  LayoutGrid,
  List as ListIcon,
  Compass,
  ArrowUpRight,
  Cpu,
  Cloud,
  Database,
  Wifi,
  Bot,
  BarChart3,
  X,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSpark } from '../hooks/SparkContext.jsx';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { A } from '../hooks/useNav.jsx';
import { Pill, DueBadge, AsyncView } from '../components/ui.jsx';
import IdeaCard from '../components/IdeaCard.jsx';
import { fdate } from '../lib/dates.js';

// Category color mappings matching the IdeaCenter design system
const CATEGORY_STYLES = {
  'Customer pain point': {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
  },
  'Value-add': {
    bg: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60',
  },
  'New product': {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60',
  },
  'Process improvement': {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
  },
  'Internal efficiency': {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
  },
};

// Technology tag color and icon mappings
const TECH_STYLES = {
  Cloud: {
    bg: 'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50',
    icon: Cloud,
  },
  GenAI: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
    icon: Sparkles,
  },
  Data: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
    icon: Database,
  },
  IoT: {
    bg: 'bg-teal-50 text-teal-700 border-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50',
    icon: Wifi,
  },
  Automation: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    icon: Bot,
  },
  Domo: {
    bg: 'bg-violet-50 text-violet-700 border-violet-200/70 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50',
    icon: BarChart3,
  },
  Other: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200/70 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50',
    icon: Layers,
  },
};

export default function MyIdeasPage() {
  const user = useCurrentUser();
  const { openIdea, version } = useSpark();
  const state = useAsync(() => api.listIdeas({ scope: 'mine' }), [version, user?.id]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'votes' | 'title'

  return (
    <div className="w-full pb-20">
      <AsyncView
        state={state}
        isEmpty={(d) => d.length === 0}
        empty={
          <div className="bg-white dark:bg-[#1E1740] rounded-3xl border border-[#E4DCF5] dark:border-purple-900/60 p-10 sm:p-14 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-[#6B2FA8] dark:text-purple-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Sparkles size={28} />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] dark:text-purple-100 mb-2">
              Start Your Innovation Journey
            </h2>
            <p className="text-sm text-slate-500 dark:text-purple-300/80 mb-7 leading-relaxed">
              You haven't submitted any ideas yet. Share a problem you noticed or an innovative solution that could create value for GWC.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <A
                to="/employee/submit"
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] hover:from-[#582090] hover:to-[#7C3AED] text-white font-semibold text-sm inline-flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Submit your first idea</span>
              </A>
              <A
                to="/employee/ideas"
                className="h-11 px-5 rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-semibold text-sm inline-flex items-center gap-1.5 transition"
              >
                <Compass size={15} />
                <span>Explore peer ideas</span>
              </A>
            </div>
          </div>
        }
      >
        {(list) => (
          <MyIdeasContent
            list={list}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortBy={sortBy}
            setSortBy={setSortBy}
            openIdea={openIdea}
          />
        )}
      </AsyncView>
    </div>
  );
}

function MyIdeasContent({
  list,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  openIdea,
}) {
  // Aggregate KPIs
  const totalIdeas = list.length;
  const needsInfoIdeas = list.filter((i) => i.status === 'Needs info');
  const underReviewCount = list.filter(
    (i) => i.status === 'Under review' || i.status === 'Submitted'
  ).length;
  const approvedCount = list.filter((i) => i.status === 'Approved').length;
  const rejectedCount = list.filter((i) => i.status === 'Rejected').length;
  const totalVotes = list.reduce((sum, i) => sum + (i.voteCount || 0), 0);

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    return list
      .filter((i) => {
        if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          i.title?.toLowerCase().includes(q) ||
          i.id?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.technology?.toLowerCase().includes(q) ||
          i.solution?.toLowerCase().includes(q) ||
          i.problem?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'votes') return (b.voteCount || 0) - (a.voteCount || 0);
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [list, statusFilter, searchQuery, sortBy]);

  const feedbackText = (i) => {
    if (i.status === 'Rejected') return `Rejected: ${i.reason || 'Not aligned with current roadmap'}`;
    if (i.status === 'Needs info') return 'Action needed: Reviewers requested additional clarity.';
    if (i.status === 'Approved') return i.stage ? `Advancing to: ${i.stage}` : 'Approved for proof of concept';
    if (i.status === 'Under review') return 'Evaluation in progress with Innovation Committee';
    return 'Submitted and queued for committee review';
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 sm:mt-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-purple-100 tracking-tight">
            My ideas
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A9A1C9] mt-1.5 max-w-xl">
            Track real-time evaluation status, committee feedback, and peer backing for every idea you proposed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <A
            to="/employee/submit"
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] hover:from-[#582090] hover:to-[#7C3AED] text-white !text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            style={{ color: '#ffffff' }}
          >
            <Plus size={16} className="text-white shrink-0" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>Submit an idea</span>
          </A>
          <A
            to="/employee/ideas"
            className="h-10 px-4 rounded-xl bg-white dark:bg-[#1E1740] border border-purple-200/80 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 transition shadow-2xs"
          >
            <Compass size={14} />
            <span className="hidden sm:inline">Explore ideas</span>
          </A>
        </div>
      </div>

      {/* 2. FOUR INNOVATION KPI METRIC CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" aria-label="Portfolio metrics">
        {/* Card 1: Total Submitted */}
        <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/60 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-[#8B5CF6]/50 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-purple-300/80">
              Total Proposals
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100/80 dark:bg-purple-900/50 text-[#6B2FA8] dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200/60">
              <Layers size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-purple-100">
              {totalIdeas}
            </span>
            <p className="text-[11.5px] text-[#6B6684] dark:text-[#A9A1C9] m-0">
              Ideas submitted by you
            </p>
          </div>
        </div>

        {/* Card 2: Active in Pipeline */}
        <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/60 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-[#8B5CF6]/50 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-purple-300/80">
              Active in Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 border border-sky-200/60">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-purple-100">
              {underReviewCount + needsInfoIdeas.length}
            </span>
            <p className="text-[11.5px] text-[#6B6684] dark:text-[#A9A1C9] m-0">
              Under committee evaluation
            </p>
          </div>
        </div>

        {/* Card 3: Peer Upvotes */}
        <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/60 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-[#8B5CF6]/50 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-purple-300/80">
              Total Upvotes
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-200/60">
              <ThumbsUp size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-purple-100">
              {totalVotes}
            </span>
            <p className="text-[11.5px] text-[#6B6684] dark:text-[#A9A1C9] m-0">
              Upvotes received on your ideas
            </p>
          </div>
        </div>

        {/* Card 4: Approved / Advancing */}
        <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/60 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-[#8B5CF6]/50 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-purple-300/80">
              Approved & Advancing
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-purple-100">
              {approvedCount}
            </span>
            <p className="text-[11.5px] text-[#6B6684] dark:text-[#A9A1C9] m-0">
              Approved for next stage
            </p>
          </div>
        </div>
      </section>

      {/* 3. PRIORITY ACTION CALLOUT: REVIEWER QUESTION AWAITING REPLY */}
      {needsInfoIdeas.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/80 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-amber-950/50 rounded-2xl border border-amber-300/80 dark:border-amber-800/70 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/80 shadow-2xs">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-[#1E1B4B] dark:text-amber-100 m-0">
                  Action Required: Reviewer Question Awaiting Reply
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300/80">
                  {needsInfoIdeas.length === 1 ? '1 idea pending' : `${needsInfoIdeas.length} ideas pending`}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-amber-200/80 mt-1 m-0">
                Reviewers requested more information on{' '}
                <span className="font-semibold text-amber-900 dark:text-amber-100">
                  {needsInfoIdeas[0].id} ("{needsInfoIdeas[0].title}")
                </span>{' '}
                to continue the evaluation process.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openIdea(needsInfoIdeas[0].id)}
            className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 shrink-0 shadow-sm transition cursor-pointer"
          >
            <MessageSquare size={14} />
            <span>Open & Reply Now</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 4. INTERACTIVE TOOLBAR: SEARCH, STATUS TABS & VIEW SWITCHER */}
      <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/60 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ID, category, or keyword…"
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#FAF8FE] dark:bg-[#251D4A] border border-purple-200/70 dark:border-purple-800/60 text-xs sm:text-sm text-[#1E1B4B] dark:text-purple-100 placeholder:text-slate-400 focus:outline-none focus:border-[#6B2FA8] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Center/Right: Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All', count: totalIdeas },
            {
              id: 'Needs info',
              label: 'Needs Info',
              count: needsInfoIdeas.length,
              badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
            },
            { id: 'Under review', label: 'Under Review', count: underReviewCount },
            { id: 'Approved', label: 'Approved', count: approvedCount },
            { id: 'Rejected', label: 'Rejected', count: rejectedCount },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#6B2FA8] text-white shadow-xs'
                    : 'bg-[#FAF8FE] dark:bg-[#251D4A] border border-purple-200/60 dark:border-purple-800/60 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-100/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    active
                      ? 'bg-white/25 text-white'
                      : tab.badgeColor || 'bg-purple-100 dark:bg-purple-900/60 text-[#6B2FA8] dark:text-purple-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-1 border-t md:border-t-0 md:border-l border-purple-100 dark:border-purple-900/50 pt-2 md:pt-0 md:pl-3 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-purple-100 dark:bg-purple-900/70 text-[#6B2FA8] dark:text-purple-200 border border-purple-200/80'
                : 'text-slate-400 hover:text-purple-600'
            }`}
            title="Table View"
          >
            <ListIcon size={14} />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-purple-100 dark:bg-purple-900/70 text-[#6B2FA8] dark:text-purple-200 border border-purple-200/80'
                : 'text-slate-400 hover:text-purple-600'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      </div>

      {/* 5. MAIN CONTENT DISPLAY: TABLE OR CARDS */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/60 p-10 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-purple-300">
            No ideas match your current filter or search criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="mt-3 text-xs font-semibold text-[#6B2FA8] dark:text-purple-300 underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* PREMIUM DATA TABLE VIEW */
        <div className="bg-white dark:bg-[#1E1740] rounded-2xl sm:rounded-3xl border border-[#E4DCF5] dark:border-purple-900/60 shadow-lg shadow-purple-500/5 overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[840px]">
              <thead>
                <tr className="bg-purple-50/70 dark:bg-[#251D4A] border-b border-[#E4DCF5] dark:border-purple-900/60 text-[11.5px] font-bold text-slate-500 dark:text-purple-300 uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-28">Idea ID</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Idea Details</th>
                  <th className="py-3.5 px-4 w-40">Category & Tech</th>
                  <th className="py-3.5 px-4 w-32">Status</th>
                  <th className="py-3.5 px-4 w-24">Votes</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Reviewer Feedback & Timeline</th>
                  <th className="py-3.5 px-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/70 dark:divide-purple-900/40 text-xs sm:text-[13px]">
                {filteredList.map((i) => {
                  const isNeedsInfo = i.status === 'Needs info';
                  const isRejected = i.status === 'Rejected';
                  const isApproved = i.status === 'Approved';

                  const catStyle = CATEGORY_STYLES[i.category] || {
                    bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
                  };
                  const techInfo = TECH_STYLES[i.technology] || {
                    bg: 'bg-purple-50 text-purple-700 border-purple-200/70',
                    icon: Cpu,
                  };
                  const TechIcon = techInfo.icon;

                  return (
                    <tr
                      key={i.id}
                      onClick={() => openIdea(i.id)}
                      className="group hover:bg-[#FAF8FE] dark:hover:bg-[#251D4A]/50 transition-colors cursor-pointer"
                    >
                      {/* 1. ID Column */}
                      <td className="py-4 px-5 align-top">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/60 whitespace-nowrap">
                          {i.id}
                        </span>
                      </td>

                      {/* 2. Idea Details Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1 max-w-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openIdea(i.id);
                            }}
                            className="text-left font-bold text-[#1E1B4B] dark:text-[#EEE9FC] group-hover:text-[#6B2FA8] dark:group-hover:text-purple-300 leading-snug transition-colors cursor-pointer"
                          >
                            {i.title}
                          </button>
                          <p className="text-[12px] text-slate-500 dark:text-[#A9A1C9] line-clamp-2 leading-relaxed m-0">
                            {i.solution || i.problem || 'No description provided.'}
                          </p>
                        </div>
                      </td>

                      {/* 3. Category & Technology */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catStyle.bg} whitespace-nowrap`}
                          >
                            {i.category || 'General'}
                          </span>
                          {i.technology && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${techInfo.bg} whitespace-nowrap`}
                            >
                              <TechIcon size={11} />
                              <span>{i.technology}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Status Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <Pill status={i.status} />
                          <div>
                            <DueBadge idea={i} />
                          </div>
                        </div>
                      </td>

                      {/* 5. Votes Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white dark:bg-[#251D4A] border border-purple-200 dark:border-purple-800/60 text-xs font-semibold text-[#6B2FA8] dark:text-purple-300 whitespace-nowrap shadow-2xs">
                          <ThumbsUp size={12} className="text-[#6B2FA8] dark:text-purple-300" />
                          <span className="font-bold">{i.voteCount || 0}</span>
                        </div>
                      </td>

                      {/* 6. Reviewer Feedback & Timeline Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          {isNeedsInfo ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200/80 font-medium text-[11.5px]">
                              <AlertCircle size={12} className="text-amber-600 shrink-0" />
                              <span>{feedbackText(i)}</span>
                            </div>
                          ) : isRejected ? (
                            <p className="text-[11.5px] text-rose-700 dark:text-rose-300 font-medium m-0">
                              {feedbackText(i)}
                            </p>
                          ) : isApproved ? (
                            <p className="text-[11.5px] text-emerald-700 dark:text-emerald-300 font-semibold m-0">
                              {feedbackText(i)}
                            </p>
                          ) : (
                            <p className="text-[11.5px] text-slate-500 dark:text-[#A9A1C9] m-0">
                              {feedbackText(i)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 7. Action Column */}
                      <td className="py-4 px-4 align-top text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openIdea(i.id);
                          }}
                          className="h-8 px-3 rounded-lg border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-100/80 dark:hover:bg-purple-900/60 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <span>{isNeedsInfo ? 'Reply' : 'View'}</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUAL CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((idea) => (
            <div
              key={idea.id}
              onClick={() => openIdea(idea.id)}
              className="bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/60 p-5 shadow-xs hover:shadow-xl hover:border-[#8B5CF6]/60 transition-all flex flex-col justify-between cursor-pointer space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/60">
                    {idea.id}
                  </span>
                  <Pill status={idea.status} />
                </div>

                <h3 className="font-bold text-[16px] text-[#1E1B4B] dark:text-[#EEE9FC] leading-snug line-clamp-2">
                  {idea.title}
                </h3>

                <p className="text-[12.5px] text-slate-500 dark:text-[#A9A1C9] line-clamp-3 leading-relaxed">
                  {idea.solution || idea.problem || 'No description provided.'}
                </p>

                {/* Reviewer Note Callout Box */}
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium border ${
                    idea.status === 'Needs info'
                      ? 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200'
                      : idea.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200'
                      : 'bg-purple-50/70 text-slate-600 border-purple-100 dark:bg-purple-950/30 dark:text-purple-200'
                  }`}
                >
                  <p className="m-0 leading-snug">{feedbackText(idea)}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-50 dark:border-purple-900/30 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B2FA8] dark:text-purple-300">
                  <ThumbsUp size={13} />
                  <span>{idea.voteCount || 0} votes</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openIdea(idea.id);
                  }}
                  className="text-xs font-bold text-[#6B2FA8] dark:text-purple-300 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Open details</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
