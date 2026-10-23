import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Clock,
  Settings,
  Trophy,
  Target,
  AlertCircle,
  TrendingUp,
  PieChart,
  FileText,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Zap,
  ThumbsUp,
  Layers,
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSpark } from '../hooks/SparkContext.jsx';
import { A, navigate } from '../hooks/useNav.jsx';
import { computeStats } from '../lib/stats.js';
import { inr } from '../lib/roi.js';
import { AsyncView } from '../components/ui.jsx';

// Profile avatar URLs with fallback
const AVATAR_MAP = {
  'Priya N.': '/assets/priya_avatar.jpg',
  'Sanjay P.': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  'Karthik R.': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
  'Lakshmi V.': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
  'Arjun M.': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
  'Arjun I.': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
  'Divya S.': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  'Imran K.': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
};

const DESIGNATION_MAP = {
  'Sanjay P.': 'Solutions Lead',
  'Priya N.': 'Data Engineer',
  'Karthik R.': 'Senior Data Engineer',
  'Lakshmi V.': 'Cloud Architect',
  'Arjun M.': 'Product Engineer',
  'Arjun I.': 'Product Engineer',
  'Divya S.': 'Pre-sales Specialist',
  'Imran K.': 'Support Lead',
  'Ravi Menon': 'External Partner',
};

function UserAvatar({ name, src, size = 32 }) {
  const [error, setError] = useState(false);
  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
    : 'U';

  const gradients = [
    'linear-gradient(135deg, #7C3AED, #A855F7)',
    'linear-gradient(135deg, #2563EB, #60A5FA)',
    'linear-gradient(135deg, #059669, #34D399)',
    'linear-gradient(135deg, #D97706, #FBBF24)',
    'linear-gradient(135deg, #E11D48, #FB7185)',
  ];
  const charCode = (name || '').charCodeAt(0) || 0;
  const grad = gradients[charCode % gradients.length];

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-white shadow-2xs border border-white/80 dark:border-purple-800/50"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: grad,
      }}
    >
      {src && !error ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

function formatSubmissionDate(ts) {
  if (!ts) return 'Recent';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getCategoryBadge(cat) {
  switch (cat) {
    case 'Operations':
    case 'Process improvement':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    case 'Value-add':
    case 'Legal & Compliance':
      return 'bg-purple-50 text-purple-700 border-purple-200/60';
    case 'Internal efficiency':
    case 'Employee Experience':
      return 'bg-rose-50 text-rose-700 border-rose-200/60';
    case 'Customer pain point':
    case 'AI & Automation':
      return 'bg-amber-50 text-amber-700 border-amber-200/60';
    case 'New product':
    case 'Productivity':
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'Submitted':
      return {
        label: 'Submitted',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      };
    case 'Under review':
      return {
        label: 'Under review',
        cls: 'bg-amber-50 text-amber-700 border-amber-200/60',
      };
    case 'Needs info':
      return {
        label: 'Needs info',
        cls: 'bg-orange-50 text-orange-700 border-orange-200/60',
      };
    case 'In build':
      return {
        label: 'In implementation',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      };
    case 'Approved':
      return {
        label: 'Approved',
        cls: 'bg-teal-50 text-teal-700 border-teal-200/60',
      };
    case 'Delivered':
      return {
        label: 'Delivered',
        cls: 'bg-purple-50 text-purple-700 border-purple-200/60',
      };
    case 'Rejected':
      return {
        label: 'Rejected',
        cls: 'bg-rose-50 text-rose-700 border-rose-200/60',
      };
    case 'Parked':
    default:
      return {
        label: status,
        cls: 'bg-slate-50 text-slate-700 border-slate-200/60',
      };
  }
}

export default function LeadershipDashboardPage() {
  const { openIdea, version } = useSpark();
  const state = useAsync(() => api.listIdeas({}), [version]);

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-[1380px] mx-auto py-1">
      <AsyncView state={state} rows={5} isEmpty={(d) => d.length === 0} empty="No ideas submitted yet.">
        {(ideas) => {
          const s = computeStats(ideas);
          const awaitingReview = ideas.filter((i) => i.status === 'Submitted' || i.status === 'Under review');
          const needsInfo = ideas.filter((i) => i.status === 'Needs info');
          const inProgress = ideas.filter((i) => i.status === 'Approved' || i.status === 'In build');
          const deliveredIdeas = ideas.filter((i) => i.status === 'Delivered');
          const totalCount = ideas.length || 1;

          // Pipeline phase calculations
          const discoveryCount =
            (s.byStatus['Submitted'] || 0) +
            (s.byStatus['Under review'] || 0) +
            (s.byStatus['Needs info'] || 0);
          const inBuildCount =
            (s.byStatus['In build'] || 0) +
            (s.byStatus['Approved'] || 0);
          const deliveredCount =
            (s.byStatus['Delivered'] || 0) +
            (s.byStatus['Rejected'] || 0) +
            (s.byStatus['Parked'] || 0);

          const discPct = Math.round((discoveryCount / totalCount) * 100);
          const buildPct = Math.round((inBuildCount / totalCount) * 100);
          const delivPct = Math.max(0, 100 - discPct - buildPct);

          const leftStages = [
            { key: 'Submitted', label: 'Submitted', count: s.byStatus['Submitted'] || 0, dotColor: 'bg-[#475569]', lineColor: 'bg-[#475569]' },
            { key: 'Needs info', label: 'Needs info', count: s.byStatus['Needs info'] || 0, dotColor: 'bg-[#D97706]', lineColor: 'bg-[#D97706]' },
            { key: 'In build', label: 'In build', count: s.byStatus['In build'] || 0, dotColor: 'bg-[#7C3AED]', lineColor: 'bg-[#7C3AED]' },
            { key: 'Rejected', label: 'Rejected', count: s.byStatus['Rejected'] || 0, dotColor: 'bg-[#E11D48]', lineColor: 'bg-[#E11D48]' },
          ];

          const rightStages = [
            { key: 'Under review', label: 'Under review', count: s.byStatus['Under review'] || 0, dotColor: 'bg-[#2563EB]', lineColor: 'bg-[#2563EB]' },
            { key: 'Approved', label: 'Approved', count: s.byStatus['Approved'] || 0, dotColor: 'bg-[#0D9488]', lineColor: 'bg-[#0D9488]' },
            { key: 'Delivered', label: 'Delivered', count: s.byStatus['Delivered'] || 0, dotColor: 'bg-[#059669]', lineColor: 'bg-[#059669]' },
            { key: 'Parked', label: 'Parked', count: s.byStatus['Parked'] || 0, dotColor: 'bg-[#64748B]', lineColor: 'bg-[#64748B]' },
          ];

          // Top Innovators from static data
          const innovatorsMap = {};
          ideas.forEach((i) => {
            const name = i.submitterName || 'Unknown';
            if (!innovatorsMap[name]) {
              innovatorsMap[name] = {
                name,
                count: 0,
                votes: 0,
                dept: i.dept || '',
                avatar: AVATAR_MAP[name] || null,
                designation: DESIGNATION_MAP[name] || i.dept || 'Solutions Specialist',
              };
            }
            innovatorsMap[name].count += 1;
            innovatorsMap[name].votes += (i.voteCount || 0);
          });
          const topInnovators = Object.values(innovatorsMap)
            .sort((a, b) => b.count - a.count || b.votes - a.votes || a.name.localeCompare(b.name))
            .slice(0, 5);

          // Top Voted Ideas (highest vote count first, deterministic tie-breaker)
          const topVotedIdeas = [...ideas]
            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0) || (b.createdAt || 0) - (a.createdAt || 0) || a.id.localeCompare(b.id))
            .slice(0, 5);

          // Recent submissions (newest first)
          const recentSubmissions = [...ideas]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 5);

          return (
            <>
              {/* Executive Hero Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 sm:pt-1.5 pb-1 anim-fade-up">
                <div className="min-w-0 flex-1 pl-3 sm:pl-6 lg:pl-8">
                  <h1 className="text-2xl sm:text-[28px] lg:text-[32px] font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC] font-display tracking-tight leading-tight">
                    Innovation at a glance
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A9A1C9] mt-1.5 max-w-2xl lg:max-w-3xl font-medium leading-normal">
                    Track progress, make informed decisions, and drive high-impact ideas across GWC.
                  </p>
                </div>

                {/* Floating Impact Card */}
                <div className="flex items-center shrink-0 self-start md:self-center">
                  <div className="hidden sm:flex items-center gap-3 bg-white/90 dark:bg-[#1E1740]/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-purple-200/80 dark:border-purple-800/60 shadow-[0_6px_20px_rgba(107,47,168,0.06)]">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                      <Zap size={16} className="fill-amber-400 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-[13px] font-bold text-[#1E1B4B] dark:text-purple-100 leading-tight">
                        Turn great ideas into real impact
                      </h4>
                      <p className="text-[11px] text-[#646C8C] dark:text-purple-300 font-medium leading-tight mt-0.5">
                        Empower innovation. Enable progress.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Four KPI Summary Cards — Interactive & Clickable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 anim-kpi">
                {/* Card 1: Total Ideas */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/admin/ideas/total')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/ideas/total')}
                  className="group relative bg-white dark:bg-[#1E1740] rounded-2xl p-3.5 sm:p-4 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_18px_rgba(107,47,168,0.04)] flex items-center justify-between gap-3 sm:gap-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-[0_10px_28px_rgba(107,47,168,0.12)] cursor-pointer select-none"
                  title="Click to view all ideas in Ideas Explorer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/50 group-hover:scale-105 transition-transform">
                      <Lightbulb size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-purple-300 truncate">
                        Total Ideas
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl sm:text-[26px] font-extrabold text-[#1E1B4B] dark:text-white font-display tracking-tight">
                          {ideas.length}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-purple-400 truncate">
                          {s.last30Days} new in 30d
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-400 dark:text-purple-500 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-all">
                    <ChevronRight size={15} />
                  </div>
                </div>

                {/* Card 2: Pending Review */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/admin/ideas/pending')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/ideas/pending')}
                  className="group relative bg-white dark:bg-[#1E1740] rounded-2xl p-3.5 sm:p-4 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_18px_rgba(107,47,168,0.04)] flex items-center justify-between gap-3 sm:gap-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-[0_10px_28px_rgba(37,99,235,0.12)] cursor-pointer select-none"
                  title={`Click to view all ${awaitingReview.length} pending review ideas`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50 group-hover:scale-105 transition-transform">
                      <Clock size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-purple-300 truncate">
                        Pending Review
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl sm:text-[26px] font-extrabold text-[#1E1B4B] dark:text-white font-display tracking-tight">
                          {awaitingReview.length}
                        </span>
                        <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 truncate">
                          {s.waitingTooLong > 0 ? `${s.waitingTooLong} overdue` : 'Needs review'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-400 dark:text-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all">
                    <ChevronRight size={15} />
                  </div>
                </div>

                {/* Card 3: In Implementation */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/admin/ideas/implementation')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/ideas/implementation')}
                  className="group relative bg-white dark:bg-[#1E1740] rounded-2xl p-3.5 sm:p-4 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_18px_rgba(107,47,168,0.04)] flex items-center justify-between gap-3 sm:gap-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-[0_10px_28px_rgba(5,150,105,0.12)] cursor-pointer select-none"
                  title={`Click to view all ${inProgress.length} ideas in implementation`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50 group-hover:scale-105 transition-transform">
                      <Settings size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-purple-300 truncate">
                        In Implementation
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl sm:text-[26px] font-extrabold text-[#1E1B4B] dark:text-white font-display tracking-tight">
                          {inProgress.length}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-purple-400 truncate">
                          Active pipeline
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-400 dark:text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-all">
                    <ChevronRight size={15} />
                  </div>
                </div>

                {/* Card 4: Delivered */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/admin/ideas/delivered')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/ideas/delivered')}
                  className="group relative bg-white dark:bg-[#1E1740] rounded-2xl p-3.5 sm:p-4 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_18px_rgba(107,47,168,0.04)] flex items-center justify-between gap-3 sm:gap-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-[0_10px_28px_rgba(107,47,168,0.12)] cursor-pointer select-none"
                  title={`Click to view all ${deliveredIdeas.length} delivered ideas`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/50 group-hover:scale-105 transition-transform">
                      <Trophy size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-purple-300 truncate">
                        Delivered
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl sm:text-[26px] font-extrabold text-[#1E1B4B] dark:text-white font-display tracking-tight">
                          {deliveredIdeas.length}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-purple-400 truncate">
                          Production live
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-400 dark:text-purple-500 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-all">
                    <ChevronRight size={15} />
                  </div>
                </div>
              </div>

              {/* Main Content Row: Top Voted Ideas (Left) & Where ideas stand (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-4.5 anim-content items-stretch">
                {/* Left: Top Voted Ideas */}
                <div className="lg:col-span-7 bg-white dark:bg-[#1E1740] rounded-2xl p-4 sm:p-5 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_20px_rgba(107,47,168,0.05)] flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-purple-100/70 dark:border-purple-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/50">
                        <ThumbsUp size={16} />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-purple-100 font-display">
                          Top Voted Ideas
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-purple-300 font-medium">
                          Ideas backed by the GWC community
                        </p>
                      </div>
                    </div>
                    <A
                      to="/admin/ideas"
                      className="text-xs sm:text-[13px] font-bold text-[#6D28D9] dark:text-purple-300 hover:text-[#552088] flex items-center gap-1 group"
                    >
                      <span>View all</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </A>
                  </div>

                  {/* Top Voted Rows */}
                  {topVotedIdeas.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-purple-400">
                      No ideas submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2 my-auto py-1.5">
                      {topVotedIdeas.map((idea, idx) => {
                        const isFirst = idx === 0;
                        const catBadge = getCategoryBadge(idea.category);

                        return (
                          <div
                            key={idea.id}
                            onClick={() => openIdea(idea.id)}
                            className={`group p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                              isFirst
                                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40 hover:border-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30'
                                : 'bg-slate-50/50 dark:bg-purple-950/30 border-slate-100 dark:border-purple-900/40 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-900/40'
                            }`}
                          >
                            {/* Rank + Title + Category + Submitter */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isFirst
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 ring-2 ring-amber-300/50'
                                    : 'bg-purple-50 text-slate-500 dark:bg-purple-950/60 dark:text-purple-400'
                                }`}
                              >
                                {idx + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <h3 className="text-xs sm:text-[13px] font-bold text-[#1E1B4B] dark:text-purple-100 truncate group-hover:text-[#6D28D9] transition-colors leading-tight">
                                  {idea.title}
                                </h3>

                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${catBadge}`}>
                                    {idea.category || idea.domain || 'Innovation'}
                                  </span>
                                  {idea.submitterName && (
                                    <span className="text-[10px] text-slate-400 dark:text-purple-400 truncate">
                                      by {idea.submitterName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Vote Count Badge + Navigation Chevron */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                                  isFirst
                                    ? 'text-amber-700 bg-amber-100/80 dark:text-amber-300 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/60'
                                    : 'text-[#6D28D9] bg-purple-50 dark:text-purple-300 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/50'
                                }`}
                              >
                                <ThumbsUp size={11} className={isFirst ? 'text-amber-600 dark:text-amber-400' : 'text-[#6D28D9] dark:text-purple-400'} />
                                <span>{idea.voteCount || 0}</span>
                              </span>
                              <ChevronRight size={14} className="text-slate-400 group-hover:text-[#6D28D9] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Where ideas stand */}
                <div className="lg:col-span-5 bg-white dark:bg-[#1E1740] rounded-2xl p-4 sm:p-5 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_20px_rgba(107,47,168,0.05)] flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-purple-100/70 dark:border-purple-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50">
                        <Layers size={16} />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-purple-100 font-display">
                          Where ideas stand
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-purple-300 font-medium">
                          Pipeline distribution across {totalCount} ideas
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{inProgress.length} active builds</span>
                    </span>
                  </div>

                  {/* Segmented Phase Progress Bar & Legend */}
                  <div className="my-2.5">
                    <div className="h-1.5 w-full rounded-full flex gap-1 overflow-hidden bg-slate-100 dark:bg-purple-950/60">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${discPct}%` }}
                        title={`Discovery: ${discoveryCount}`}
                      />
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${buildPct}%` }}
                        title={`In Build: ${inBuildCount}`}
                      />
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${delivPct}%` }}
                        title={`Delivered: ${deliveredCount}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-purple-300 px-0.5 mt-1.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span>Discovery ({discoveryCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>In Build ({inBuildCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        <span>Delivered ({deliveredCount})</span>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Grid of 8 Stage Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-auto">
                    {/* Left Column (4 items) */}
                    <div className="space-y-2">
                      {leftStages.map((stage) => (
                        <div
                          key={stage.key}
                          className="p-2 sm:p-2.5 rounded-xl border border-purple-100/70 dark:border-purple-900/40 bg-slate-50/50 dark:bg-purple-950/30 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor} shrink-0`} />
                              <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-purple-100">
                                {stage.label}
                              </span>
                            </div>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-[#6D28D9] dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 border border-purple-100/80 dark:border-purple-800/50">
                              {stage.count}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 dark:bg-purple-900/40 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${stage.lineColor}`}
                              style={{ width: `${Math.max(15, Math.min(100, Math.round((stage.count / 6) * 100)))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right Column (4 items) */}
                    <div className="space-y-2">
                      {rightStages.map((stage) => (
                        <div
                          key={stage.key}
                          className="p-2 sm:p-2.5 rounded-xl border border-purple-100/70 dark:border-purple-900/40 bg-slate-50/50 dark:bg-purple-950/30 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor} shrink-0`} />
                              <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-purple-100">
                                {stage.label}
                              </span>
                            </div>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-[#6D28D9] dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 border border-purple-100/80 dark:border-purple-800/50">
                              {stage.count}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 dark:bg-purple-900/40 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${stage.lineColor}`}
                              style={{ width: `${Math.max(15, Math.min(100, Math.round((stage.count / 6) * 100)))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Content Row: Top Innovators (Left) & Recent Submissions (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-4.5 anim-content items-stretch">
                {/* Left: Top Innovators */}
                <div className="lg:col-span-4 bg-white dark:bg-[#1E1740] rounded-2xl p-4 sm:p-5 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_20px_rgba(107,47,168,0.05)] flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-purple-100/70 dark:border-purple-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-purple-100 font-display">
                          Top Innovators
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-purple-300 font-medium">
                          Leading contributors across GWC
                        </p>
                      </div>
                    </div>
                    <A
                      to="/employee/ideas"
                      className="text-xs sm:text-[13px] font-bold text-[#6D28D9] dark:text-purple-300 hover:text-[#552088] flex items-center gap-1 group"
                    >
                      <span>View all</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </A>
                  </div>

                  {/* Innovator Rows */}
                  <div className="space-y-2 my-auto py-1.5">
                    {topInnovators.map((innovator, idx) => (
                      <div
                        key={innovator.name}
                        className="flex items-center justify-between gap-2.5 p-1.5 sm:p-2 rounded-xl hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-4 text-center font-bold text-xs ${idx === 0 ? 'text-amber-500' : 'text-slate-400 dark:text-purple-400'}`}>
                            {idx + 1}
                          </span>
                          <UserAvatar name={innovator.name} src={innovator.avatar} size={32} />
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-[13px] font-bold text-[#1E1B4B] dark:text-purple-100 truncate">
                              {innovator.name}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-purple-300 font-medium truncate">
                              {innovator.designation}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#6D28D9] dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/70 border border-purple-200/50 dark:border-purple-800/50 shrink-0">
                          {innovator.count} {innovator.count === 1 ? 'idea' : 'ideas'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Recent Submissions */}
                <div className="lg:col-span-8 bg-white dark:bg-[#1E1740] rounded-2xl p-4 sm:p-5 border border-purple-100/90 dark:border-purple-900/60 shadow-[0_4px_20px_rgba(107,47,168,0.05)] flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-purple-100/70 dark:border-purple-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-purple-100 font-display">
                          Recent Submissions
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-purple-300 font-medium">
                          Latest ideas from across GWC
                        </p>
                      </div>
                    </div>
                    <A
                      to="/admin/ideas"
                      className="text-xs sm:text-[13px] font-bold text-[#6D28D9] dark:text-purple-300 hover:text-[#552088] flex items-center gap-1 group"
                    >
                      <span>View all</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </A>
                  </div>

                  {/* Submissions Table - No horizontal scrollability */}
                  <div className="w-full overflow-hidden my-auto py-1">
                    <table className="w-full table-fixed text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-purple-100/80 dark:border-purple-900/50 text-[10px] sm:text-[11px] text-slate-400 dark:text-purple-300 font-semibold uppercase tracking-wider">
                          <th className="py-2 pr-2 font-semibold w-[33%] sm:w-[35%]">Idea Title</th>
                          <th className="py-2 px-1.5 sm:px-2 font-semibold w-[22%] sm:w-[20%]">Submitted by</th>
                          <th className="py-2 px-1 sm:px-1.5 font-semibold w-[12%] sm:w-[11%] text-center">Date</th>
                          <th className="py-2 px-1 sm:px-1.5 font-semibold w-[18%] sm:w-[17%] text-center">Category</th>
                          <th className="py-2 px-1 sm:px-1.5 font-semibold w-[12%] sm:w-[11%] text-center">Status</th>
                          <th className="py-2 pl-1 pr-0 text-right font-semibold w-[7%] sm:w-[6%]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50/70 dark:divide-purple-900/30">
                        {recentSubmissions.map((idea) => {
                          const statusInfo = getStatusBadge(idea.status);
                          const catBadge = getCategoryBadge(idea.category);

                          return (
                            <tr key={idea.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/30 transition">
                              {/* Title */}
                              <td className="py-2.5 pr-2 font-bold text-slate-900 dark:text-purple-100 truncate">
                                <span
                                  onClick={() => openIdea(idea.id)}
                                  className="truncate block hover:text-[#6D28D9] cursor-pointer transition-colors"
                                  title={idea.title}
                                >
                                  {idea.title}
                                </span>
                              </td>

                              {/* Submitted by */}
                              <td className="py-2.5 px-1.5 sm:px-2 truncate">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <UserAvatar name={idea.submitterName} src={AVATAR_MAP[idea.submitterName]} size={18} />
                                  <span className="font-semibold text-slate-700 dark:text-purple-200 truncate text-xs" title={idea.submitterName}>
                                    {idea.submitterName}
                                  </span>
                                </div>
                              </td>

                              {/* Date */}
                              <td className="py-2.5 px-1 sm:px-1.5 text-slate-500 dark:text-purple-300 font-medium text-[11px] text-center whitespace-nowrap">
                                {formatSubmissionDate(idea.createdAt)}
                              </td>

                              {/* Category */}
                              <td className="py-2.5 px-1 sm:px-1.5 text-center">
                                <span
                                  className={`inline-block max-w-full truncate px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catBadge}`}
                                  title={idea.category}
                                >
                                  {idea.category}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-2.5 px-1 sm:px-1.5 text-center whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.cls}`}>
                                  {statusInfo.label}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 pl-1 pr-0 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => openIdea(idea.id)}
                                  className="inline-flex items-center gap-0.5 text-xs font-bold text-[#6D28D9] dark:text-purple-300 hover:text-[#552088] transition group cursor-pointer"
                                  title={`View ${idea.title}`}
                                >
                                  <span>View</span>
                                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
