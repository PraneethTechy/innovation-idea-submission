import React from 'react';
import {
  Bookmark,
  ThumbsUp,
  ArrowUpRight,
  Clock,
  Cpu,
  Cloud,
  Sparkles,
  Database,
  Wifi,
  Bot,
  BarChart3,
  Layers,
  MessageSquare,
} from 'lucide-react';

import { Pill } from './ui.jsx';
import { fdate } from '../lib/dates.js';

// Category color and styling mappings for visual distinction
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

export default function IdeaCard({
  idea,
  onVote,
  onOpen,
  isBookmarked = false,
  onToggleBookmark,
  preview = false,
}) {
  const showVote = !!onVote;
  const catStyle = CATEGORY_STYLES[idea.category] || {
    bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };

  const techInfo = TECH_STYLES[idea.technology] || {
    bg: 'bg-purple-50 text-purple-700 border-purple-200/70',
    icon: Cpu,
  };
  const TechIcon = techInfo.icon;

  // Submitter initials
  const initials = idea.submitterName
    ? idea.submitterName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'U';

  return (
    <article className="group bg-white dark:bg-[#1E1740] rounded-2xl border border-[#E4DCF5] dark:border-purple-900/50 shadow-xs hover:shadow-xl hover:border-[#8B5CF6]/60 dark:hover:border-[#8B5CF6]/60 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* CARD TOP & BODY SECTION */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Top Meta Row: Category chip + Monospace ID on left, Status + Bookmark on right */}
        <div className="flex items-center justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-3 py-1 rounded-full text-[11.5px] font-semibold border ${catStyle.bg} shrink-0 whitespace-nowrap`}
            >
              {idea.category}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Pill status={idea.status} />
            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(idea.id);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                    : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this idea'}
                title={isBookmarked ? 'Bookmarked' : 'Bookmark idea'}
              >
                <Bookmark size={15} className={isBookmarked ? 'fill-amber-500' : ''} />
              </button>
            )}
          </div>
        </div>

        {/* Idea Title */}
        {preview || !onOpen ? (
          <h3 className="font-bold text-[16px] text-[#1E1B4B] dark:text-[#EEE9FC] leading-snug line-clamp-2">
            {idea.title}
          </h3>
        ) : (
          <button
            type="button"
            className="text-left font-bold text-[16px] text-[#1E1B4B] dark:text-[#EEE9FC] group-hover:text-[#6B2FA8] dark:group-hover:text-[#C4B5FD] leading-snug line-clamp-2 transition-colors cursor-pointer"
            onClick={() => onOpen(idea.id)}
          >
            {idea.title}
          </button>
        )}

        {/* Short Solution / Description */}
        <p className="text-[12.5px] text-[#64748B] dark:text-[#A9A1C9] line-clamp-3 leading-relaxed mt-2.5 flex-1">
          {idea.solution || idea.problem || 'No description provided.'}
        </p>

        {/* Submitter & Date Info */}
        <div className="flex items-center justify-between text-[11.5px] text-[#7D7796] dark:text-[#94A3B8] mt-4 pt-3.5 border-t border-purple-50 dark:border-purple-900/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-[#6B2FA8] to-[#A855F7] text-white font-bold text-[9.5px] flex items-center justify-center shrink-0 shadow-xs">
              {initials}
            </div>
            <span className="font-semibold text-[#334155] dark:text-purple-200 truncate">
              {idea.submitterName}
              {idea.dept && (
                <span className="font-normal text-slate-400"> • {idea.dept}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400 shrink-0">
            <Clock size={12} />
            <span>{fdate(idea.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* CARD BOTTOM ACTION ROW */}
      <div className="px-5 sm:px-6 py-3.5 bg-[#FAF8FE] dark:bg-[#181134] border-t border-[#E8DEF8] dark:border-purple-900/40 flex items-center justify-between gap-3">
        {/* Left: Vote / Like Button & Discussion Indicator */}
        <div className="flex items-center gap-2">
          {showVote ? (
            <button
              type="button"
              onClick={() => onVote(idea)}
              className={`inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                idea.votedByMe
                  ? 'bg-[#6B2FA8] hover:bg-[#582090] !text-white text-white shadow-xs'
                  : 'bg-white dark:bg-[#251D4A] border border-purple-200 dark:border-purple-800/60 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-100/70 hover:border-purple-300'
              }`}
              style={idea.votedByMe ? { color: '#ffffff' } : undefined}
              aria-pressed={idea.votedByMe}
              title={idea.votedByMe ? 'Click to withdraw your vote' : 'Click to back this idea'}
            >
              <ThumbsUp
                size={13}
                className={`shrink-0 ${idea.votedByMe ? 'fill-white !text-white' : 'text-[#6B2FA8] dark:text-purple-300'}`}
                style={idea.votedByMe ? { color: '#ffffff', fill: '#ffffff' } : undefined}
              />
              {/* Highlighted Vote Count Number */}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-xs font-bold leading-none shrink-0 ${
                  idea.votedByMe
                    ? 'bg-white/25 !text-white shadow-xs'
                    : 'bg-purple-100/80 dark:bg-purple-900/50 text-[#6B2FA8] dark:text-purple-200 border border-purple-200/80 dark:border-purple-700/60 shadow-xs'
                }`}
                style={idea.votedByMe ? { color: '#ffffff' } : undefined}
              >
                {idea.voteCount || 0}
              </span>
              <span
                className={`text-xs font-normal leading-none ${idea.votedByMe ? '!text-white' : 'text-[#6B2FA8] dark:text-purple-300 opacity-90'}`}
                style={idea.votedByMe ? { color: '#ffffff' } : undefined}
              >
                {idea.voteCount === 1 ? 'vote' : 'votes'}
              </span>
            </button>
          ) : (
            <div className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full bg-slate-50 dark:bg-[#251D4A] border border-slate-200 dark:border-purple-900/60 text-xs font-semibold text-slate-600 dark:text-purple-300 whitespace-nowrap">
              <ThumbsUp size={13} className="shrink-0 text-slate-400" />
              <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-xs font-bold leading-none bg-white dark:bg-purple-900/50 text-slate-700 dark:text-purple-200 border border-slate-200/80 dark:border-purple-700/60 shadow-xs shrink-0">
                {idea.voteCount || 0}
              </span>
              <span className="text-xs font-normal leading-none opacity-90">
                {idea.voteCount === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          )}

          {/* Discussion comments & questions indicator */}
          {idea.totalComments > 0 && (
            <button
              type="button"
              onClick={() => onOpen && onOpen(idea.id)}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-white dark:bg-[#251D4A] border border-purple-200 dark:border-purple-800/60 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 text-xs font-semibold shadow-2xs transition cursor-pointer"
              title={`${idea.totalComments} comments & questions`}
            >
              <MessageSquare size={12} className="text-[#6B2FA8] dark:text-purple-300" />
              <span>{idea.totalComments}</span>
            </button>
          )}
        </div>

        {/* Technology Tag & View Details Action */}
        <div className="flex items-center gap-2.5">
          {idea.technology && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${techInfo.bg}`}
            >
              <TechIcon size={12} />
              <span>{idea.technology}</span>
            </span>
          )}

          {onOpen && (
            <button
              type="button"
              onClick={() => onOpen(idea.id)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B2FA8] dark:text-purple-300 hover:text-[#4E03B9] transition cursor-pointer group-hover:translate-x-0.5"
            >
              <span>Details</span>
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
