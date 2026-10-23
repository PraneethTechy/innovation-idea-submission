import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Clock,
  ThumbsUp,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Send,
  User,
  ShieldCheck,
  Layers,
  Cpu,
  Cloud,
  Database,
  Wifi,
  Bot,
  BarChart3,
  Building,
  DollarSign,
  Briefcase,
  Calendar,
  ChevronRight,
  FileText,
  Lightbulb,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { asMessage } from '../api/errors.js';
import { useAsync } from '../hooks/useAsync.js';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useSpark } from '../hooks/SparkContext.jsx';
import IdeaDiscussion from './IdeaDiscussion.jsx';

import {
  canReview,
  canAssign,
  canReply,
  canView,
  isOwner,
  shouldMaskSubmitter,
  canSeeReportingManager,
  canSeeDetailedFinancials,
  canSeeGovernance,
} from '../permissions.js';

import {
  SCORING_CRITERIA,
  NEXT_STAGES,
  REJECTION_REASONS,
  EFFORT_LABEL,
  LIMITS,
} from '../lookups.js';
import { allScored, weightedScore } from '../lib/scoring.js';
import { computeRoi, annualBenefit, inr } from '../lib/roi.js';
import { fdate } from '../lib/dates.js';
import { Pill, Tag, Recommended, Loading, ErrorState } from './ui.jsx';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

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

export default function DetailsDrawer() {
  const { openId, closeIdea, bump, toast } = useSpark();
  const user = useCurrentUser();
  const ref = useRef(null);
  const state = useAsync(() => api.getIdea(openId), [openId]);

  // Focus trap, Escape to close, and focus returns to where it came from.
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeIdea();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const els = [...ref.current.querySelectorAll(FOCUSABLE)];
      if (!els.length) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (prev && prev.focus) prev.focus();
    };
  }, [closeIdea]);

  const idea = state.data;
  return (
    <>
      <div
        className="fixed inset-0 bg-[#0A1222]/50 backdrop-blur-xs z-40 transition-opacity"
        onClick={closeIdea}
        aria-hidden="true"
      />
      <aside
        className="fixed top-0 right-0 bottom-0 w-full max-w-[620px] bg-[#FAF7FF] dark:bg-[#1E1740] text-[#1F2A5C] dark:text-[#EEE9FC] z-50 overflow-y-auto p-6 sm:p-7 pb-10 border-l border-purple-200/80 dark:border-purple-800/60 shadow-2xl animate-[sp-slide_0.22s_ease]"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Idea details"
        tabIndex={-1}
      >
        {state.loading && !idea && <Loading rows={4} label="Loading idea details" />}
        {state.error && <ErrorState message={state.error} onRetry={state.reload} />}
        {idea && canView(user, idea) && (
          <DrawerBody
            idea={idea}
            user={user}
            onClose={closeIdea}
            onChanged={(updated) => {
              if (updated) state.setData(updated);
              bump();
            }}
            toast={toast}
          />
        )}
      </aside>
    </>
  );
}

function DrawerBody({ idea, user, onClose, onChanged, toast }) {
  const staff = canReview(user, idea);
  const roi = computeRoi(idea);
  const annual = annualBenefit(idea.financialBenefit, idea.benefitPeriod);

  const masked = shouldMaskSubmitter(user, idea);
  const showManager = canSeeReportingManager(user, idea);
  const showDetailedFinancials = canSeeDetailedFinancials(user, idea);
  const showGovernance = canSeeGovernance(user, idea);
  const submitterIsSelf = isOwner(user, idea);

  const catStyle = CATEGORY_STYLES[idea.category] || {
    bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };
  const techInfo = TECH_STYLES[idea.technology] || {
    bg: 'bg-purple-50 text-purple-700 border-purple-200/70',
    icon: Cpu,
  };
  const TechIcon = techInfo.icon;

  const displayAuthorName = masked ? 'Anonymous Innovator' : (idea.submitterName || 'Unknown');
  const initials = masked
    ? 'AI'
    : idea.submitterName
    ? idea.submitterName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'U';

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & CLOSE BUTTON */}
      <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-purple-900/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/80">
            {idea.id}
          </span>
          <Pill status={idea.status} />
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${catStyle.bg}`}
          >
            {idea.category}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-slate-600 dark:text-purple-200 font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          aria-label="Close details"
        >
          <X size={14} />
          <span>Close</span>
        </button>
      </div>

      {/* 2. TITLE & SUBMITTER SNAPSHOT */}
      <div className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC] leading-snug tracking-tight m-0">
          {idea.title}
        </h2>

        {/* Submitter Info & Authoritative Upvote Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-purple-300/80 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6B2FA8] to-[#A855F7] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[#1E1B4B] dark:text-purple-100">
                  {displayAuthorName}
                </span>
                {masked && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-purple-50 text-[#6B2FA8] dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60">
                    Private Recognition
                  </span>
                )}
                {!masked && submitterIsSelf && !idea.consent && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                    Private to peers
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px]">
                {idea.dept && <span>{idea.dept}</span>}
                {showManager && idea.manager && (
                  <span className="hidden sm:inline"> • Mgr: {idea.manager}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1 text-slate-400">
              <Clock size={13} />
              <span>{fdate(idea.createdAt)}</span>
            </div>
            {/* Authoritative Single Upvote Control */}
            <button
              type="button"
              onClick={async () => {
                if (!user) {
                  toast('Please sign in to like this idea.');
                  return;
                }
                try {
                  const res = await api.toggleVote(idea.id);
                  onChanged({
                    ...idea,
                    voteCount: res.voteCount,
                    votedByMe: res.votedByMe,
                  });
                  toast(res.votedByMe ? 'Liked idea!' : 'Unliked idea');
                } catch (e) {
                  toast(asMessage(e));
                }
              }}
              className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                idea.votedByMe
                  ? 'bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] text-white border-purple-500 shadow-purple-500/20'
                  : 'bg-purple-50 dark:bg-[#251D4A] border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-200 hover:bg-purple-100'
              }`}
              aria-pressed={idea.votedByMe}
              title={idea.votedByMe ? 'Click to unlike this idea' : 'Click to like this idea'}
            >
              <ThumbsUp
                size={12}
                className={`transition-transform ${
                  idea.votedByMe ? 'fill-white text-white scale-110' : 'text-[#6B2FA8] dark:text-purple-300'
                }`}
              />
              <span>
                {idea.voteCount || 0} {idea.voteCount === 1 ? 'like' : 'likes'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. STATUS CALLOUT BANNER (IF ACTION REQUIRED, APPROVED, OR REJECTED) */}
      {idea.status === 'Needs info' && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-300/80 dark:border-amber-800/60 p-4 flex items-start gap-3 shadow-2xs">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-amber-900 dark:text-amber-100 m-0">
              Reviewer Clarification Requested
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200/90 m-0 leading-relaxed">
              The Innovation Committee needs additional details before progressing. Please check the history or reply below.
            </p>
          </div>
        </div>
      )}

      {idea.status === 'Approved' && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/60 p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-emerald-950 dark:text-emerald-100 m-0">
                Approved by Committee
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 m-0">
                Next Stage: <span className="font-bold">{idea.stage || 'Proof of Concept'}</span>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Active
          </span>
        </div>
      )}

      {idea.status === 'Rejected' && (
        <div className="bg-rose-50/90 dark:bg-rose-950/40 rounded-2xl border border-rose-300/80 dark:border-rose-800/60 p-4 flex items-start gap-3 shadow-2xs">
          <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs text-rose-900 dark:text-rose-100 m-0">
              Decision: Rejected
            </h4>
            <p className="text-xs text-rose-800 dark:text-rose-200/90 m-0 mt-0.5">
              Reason: <span className="font-semibold">{idea.reason || 'Not aligned with current focus'}</span>
            </p>
          </div>
        </div>
      )}

      {/* 4. THE BLUEPRINT: PROBLEM & PROPOSED SOLUTION CARD */}
      <div className="bg-[#FAF8FE] dark:bg-[#251D4A] rounded-2xl border border-purple-200/80 dark:border-purple-800/60 p-5 space-y-4 shadow-xs">
        {/* The Problem */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-purple-300 m-0">
              The Problem & Pain Point
            </h4>
          </div>
          <p className="text-[13.5px] text-[#1E1B4B] dark:text-[#EEE9FC] leading-relaxed bg-white dark:bg-[#1E1740] p-3.5 rounded-xl border border-purple-100/80 dark:border-purple-900/40 m-0 whitespace-pre-wrap">
            {idea.problem || 'No specific problem description provided.'}
          </p>
        </div>

        {/* The Solution */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-purple-300 m-0">
              Proposed Solution & Approach
            </h4>
          </div>
          <p className="text-[13.5px] text-[#1E1B4B] dark:text-[#EEE9FC] leading-relaxed bg-white dark:bg-[#1E1740] p-3.5 rounded-xl border border-purple-100/80 dark:border-purple-900/40 m-0 whitespace-pre-wrap">
            {idea.solution || 'No specific solution outline provided.'}
          </p>
        </div>

        {/* Technology Area & Tech Stack */}
        {(idea.technology || idea.stack) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/40 text-xs">
            <span className="text-slate-500 font-medium">Technology:</span>
            {idea.technology && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${techInfo.bg}`}
              >
                <TechIcon size={12} />
                <span>{idea.technology}</span>
              </span>
            )}
            {idea.stack && (
              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-[#1E1740] border border-purple-200/70 text-slate-700 dark:text-purple-200 font-medium">
                Tools: {idea.stack}
              </span>
            )}
            {idea.effort && (
              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-[#1E1740] border border-purple-200/70 text-slate-700 dark:text-purple-200 font-medium ml-auto">
                Effort: {EFFORT_LABEL[idea.effort] || idea.effort}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5. VALUE & FINANCIAL ESTIMATE: VISIBLE ONLY TO SUBMITTER & AUTHORIZED LEADERSHIP */}
      {showDetailedFinancials && (idea.benefitType || idea.investment != null || idea.financialBenefit != null || roi) && (
        <div className="bg-white dark:bg-[#1E1740] rounded-2xl border border-purple-200/80 dark:border-purple-900/60 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#6B2FA8] dark:text-purple-300" />
              <h4 className="text-xs sm:text-[13px] font-bold text-[#1E1B4B] dark:text-purple-100 m-0">
                Value Creation & ROI Estimate
              </h4>
            </div>
            {idea.benefitType && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-[#6B2FA8] dark:bg-purple-900/50 dark:text-purple-200 border border-purple-200/70">
                {idea.benefitType}
              </span>
            )}
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[#FAF8FE] dark:bg-[#251D4A] border border-purple-100 dark:border-purple-800/50">
              <span className="text-[11px] text-slate-500 dark:text-purple-300 font-medium block">
                Estimated Investment
              </span>
              <span className="text-base font-extrabold text-[#1E1B4B] dark:text-purple-100">
                {idea.investment != null ? inr(idea.investment) : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8FE] dark:bg-[#251D4A] border border-purple-100 dark:border-purple-800/50">
              <span className="text-[11px] text-slate-500 dark:text-purple-300 font-medium block">
                Expected Benefit
              </span>
              <span className="text-base font-extrabold text-[#1E1B4B] dark:text-purple-100">
                {idea.financialBenefit != null ? inr(idea.financialBenefit) : '—'}
              </span>
              {idea.benefitPeriod && (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({idea.benefitPeriod.toLowerCase()})
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-[#6B2FA8] dark:text-purple-300 font-medium block">
                Indicative ROI
              </span>
              <span className="text-base font-black text-[#6B2FA8] dark:text-purple-200">
                {roi ? `${roi.percent.toFixed(1)}%` : '—'}
              </span>
              {idea.roiConfidence && (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Confidence: {idea.roiConfidence}
                </span>
              )}
            </div>
          </div>

          {/* Assumptions note */}
          {idea.benefitDescription && (
            <p className="text-xs text-slate-500 dark:text-[#A9A1C9] leading-relaxed pt-1 m-0">
              <span className="font-semibold text-slate-700 dark:text-purple-200">Assumptions: </span>
              {idea.benefitDescription}
            </p>
          )}
        </div>
      )}

      {/* 6. LIFECYCLE STEPPER & GOVERNANCE */}
      {/* The Idea Progress Stepper is visible to all contexts, displaying the 5-stage progress or terminal state */}
      <IdeaProgressStepper status={idea.status} stage={idea.stage} reason={idea.reason} />

      {/* Governance & Metadata card is shown ONLY to authorized Leadership and Submitter (never to peer employees) */}
      {showGovernance && (
        <div className="bg-[#FAF8FE] dark:bg-[#251D4A] rounded-2xl border border-purple-200/80 dark:border-purple-800/60 p-4 space-y-2.5 text-xs">
          <h4 className="font-bold text-[12.5px] text-[#1E1B4B] dark:text-purple-100 m-0 pb-2 border-b border-purple-100 dark:border-purple-900/40">
            Proposal Governance & Metadata
          </h4>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <div>
              <span className="text-slate-400 block">Submitter Type</span>
              <span className="font-semibold text-slate-700 dark:text-purple-200">
                {idea.submitterType || 'Employee'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Department</span>
              <span className="font-semibold text-slate-700 dark:text-purple-200">
                {idea.dept || 'Not specified'}
              </span>
            </div>
            {showManager && (
              <div>
                <span className="text-slate-400 block">Reporting Manager</span>
                <span className="font-semibold text-slate-700 dark:text-purple-200">
                  {idea.manager || 'Not specified'}
                </span>
              </div>
            )}
            {staff && (
              <div>
                <span className="text-slate-400 block">Assigned Reviewer</span>
                <span className="font-semibold text-slate-700 dark:text-purple-200">
                  {idea.assigneeName || 'Unassigned'}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block">Sensitive Data</span>
              <span className="font-semibold text-slate-700 dark:text-purple-200">
                {idea.sensitive || 'No'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Public Recognition</span>
              <span className="font-semibold text-slate-700 dark:text-purple-200">
                {idea.consent ? 'Agreed to credit' : 'Private'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6.5 ATTACHED DOCUMENTS & ARTIFACTS */}
      {idea.files && idea.files.length > 0 && (
        <div className="bg-[#FAF8FE] dark:bg-[#251D4A] rounded-2xl border border-purple-200/80 dark:border-purple-800/60 p-4 space-y-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-100 dark:border-purple-900/40">
            <FileText size={15} className="text-[#6B2FA8] dark:text-purple-300" />
            <h4 className="font-bold text-[12.5px] text-[#1E1B4B] dark:text-purple-100 m-0">
              Attached Documents & Files ({idea.files.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {idea.files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#1E1740] border border-purple-100/90 dark:border-purple-900/50 shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#6B2FA8] dark:bg-purple-900/50 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <FileText size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-purple-100 truncate text-xs m-0">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400 m-0">
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Attached file'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. INTERACTIVE ACTION SECTIONS (REPLY OR REVIEW) */}
      {!staff && <SubmitterSection idea={idea} user={user} onChanged={onChanged} toast={toast} />}
      {staff && <ReviewerSection idea={idea} user={user} onChanged={onChanged} toast={toast} />}

      {/* 8. IDEA DISCUSSION & ENGAGEMENT SECTION */}
      <IdeaDiscussion
        idea={idea}
        user={user}
        onChanged={onChanged}
        toast={toast}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5-Stage Idea Progress Stepper with Terminal States Support
// ---------------------------------------------------------------------------
function IdeaProgressStepper({ status, stage, reason }) {
  const STAGES = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'review', label: 'Committee Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'build', label: 'In Build' },
    { key: 'live', label: 'Live' },
  ];

  const isRejected = status === 'Rejected';
  const isParked = status === 'Parked';

  let currentIndex = 0;
  if (status === 'Submitted') {
    currentIndex = 0;
  } else if (status === 'Under review' || status === 'Needs info') {
    currentIndex = 1;
  } else if (status === 'Approved') {
    currentIndex = 2;
  } else if (status === 'In build') {
    currentIndex = 3;
  } else if (status === 'Delivered') {
    currentIndex = 4;
  }

  return (
    <div className="bg-[#FAF8FE] dark:bg-[#251D4A] rounded-2xl border border-purple-200/80 dark:border-purple-800/60 p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#6B2FA8] dark:text-purple-300" />
          <h4 className="text-xs sm:text-[13px] font-bold text-[#1E1B4B] dark:text-purple-100 m-0">
            Idea Progress
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-purple-300">
          Status: <strong className="text-[#6B2FA8] dark:text-purple-200">{status}</strong>
        </span>
      </div>

      {/* Terminal State Handling */}
      {isRejected ? (
        <div className="p-3.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-rose-900 dark:text-rose-200 block">
              Evaluation Concluded — Not Progressed
            </span>
            <p className="text-rose-800 dark:text-rose-300/90 m-0 leading-relaxed">
              Reason: {reason || 'Does not align with current strategic priorities.'}
            </p>
          </div>
        </div>
      ) : isParked ? (
        <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
          <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 block">
              Deferred / On Hold
            </span>
            <p className="text-amber-800 dark:text-amber-300/90 m-0 leading-relaxed">
              This initiative has been paused for evaluation in a future planning cycle.
            </p>
          </div>
        </div>
      ) : (
        /* Active 5-Stage Stepper: Submitted → Committee Review → Approved → In Build → Live */
        <div className="pt-1">
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {STAGES.map((s, idx) => {
              const isCompleted = idx < currentIndex || (idx === 4 && status === 'Delivered');
              const isCurrent = idx === currentIndex && status !== 'Delivered';

              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] text-white ring-4 ring-purple-300/40 shadow-xs'
                        : 'bg-white dark:bg-[#1E1740] border-2 border-slate-200 dark:border-purple-900 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : idx + 1}
                  </div>

                  <span
                    className={`mt-2 text-[10px] sm:text-[11px] font-bold leading-tight ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : isCurrent
                        ? 'text-[#6B2FA8] dark:text-purple-200'
                        : 'text-slate-400 dark:text-purple-400/60'
                    }`}
                  >
                    {s.label}
                  </span>

                  {isCurrent && status === 'Needs info' && (
                    <span className="text-[9px] text-amber-600 font-semibold mt-0.5">
                      Needs Info
                    </span>
                  )}
                  {isCurrent && stage && status === 'Approved' && (
                    <span className="text-[9px] text-purple-600/90 dark:text-purple-300 font-medium mt-0.5 truncate max-w-full">
                      {stage}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitterSection({ idea, user, onChanged, toast }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    if (!text.trim()) {
      setErr('Write a reply before sending.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const r = await api.submitterReply(idea.id, text);
      toast('Reply sent to the reviewer.');
      setText('');
      onChanged(r);
    } catch (e) {
      setErr(asMessage(e));
    }
    setBusy(false);
  };

  if (!canReply(user, idea)) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-[#251D4A] dark:via-[#1E1740] dark:to-[#251D4A] rounded-2xl border border-purple-200 dark:border-purple-800 p-5 space-y-3 shadow-xs">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-[#6B2FA8] dark:text-purple-300" />
        <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-purple-100 m-0">
          Reply to Innovation Committee
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-purple-300/80 m-0">
        Answer the reviewer’s inquiry. Your reply will be recorded in the audit trail and the idea will re-enter active evaluation.
      </p>
      <textarea
        id="d-reply"
        maxLength={LIMITS.reply}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your clarification or answers here…"
        className="w-full min-h-[90px] p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#1E1740] text-xs sm:text-sm text-[#1E1B4B] dark:text-purple-100 focus:outline-none focus:border-[#6B2FA8]"
      />
      {err && (
        <div className="text-xs font-semibold text-rose-600" role="alert">
          {err}
        </div>
      )}
      <div className="flex justify-end pt-1">
        <button
          className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] hover:from-[#582090] hover:to-[#7C3AED] text-white font-semibold text-xs inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          disabled={busy}
          onClick={send}
        >
          <Send size={13} />
          <span>{busy ? 'Sending…' : 'Send reply'}</span>
        </button>
      </div>
    </div>
  );
}

function ReviewerSection({ idea, user, onChanged, toast }) {
  const reviewers = useAsync(
    () => (canAssign(user) ? api.listReviewers() : Promise.resolve([])),
    [user?.id]
  );
  const [assignee, setAssignee] = useState(idea.assigneeId || '');
  const [note, setNote] = useState('');
  const [stage, setStage] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const w = weightedScore(idea.scores);

  const run = async (fn, ok) => {
    setBusy(true);
    setErr('');
    try {
      const r = await fn();
      if (ok) toast(ok);
      onChanged(r);
    } catch (e) {
      setErr(asMessage(e));
    }
    setBusy(false);
  };

  const score = (key, n) => run(() => api.scoreIdea(idea.id, key, n));
  const assign = () => run(() => api.assignReviewer(idea.id, assignee), 'Reviewer saved.');
  const decide = (status) => {
    if (status === 'Approved') {
      if (!allScored(idea.scores)) return setErr('Score every criterion before approving.');
      if (!stage) return setErr('Choose the next stage for this idea.');
    }
    if (status === 'Rejected') {
      if (!reason) return setErr('Choose a reason for rejecting.');
      if (!note.trim())
        return setErr('Add a short note so the submitter understands the decision.');
    }
    if (status === 'Needs info' && !note.trim())
      return setErr('Write the question you need answered.');
    return run(() => api.decide(idea.id, { status, note, stage, reason }), `${idea.id} updated to ${status}.`).then(
      () => setNote('')
    );
  };

  return (
    <div className="bg-[#FAF8FE] dark:bg-[#251D4A] rounded-2xl border border-purple-200/80 dark:border-purple-800/60 p-5 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
        <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-purple-100 m-0">
          Committee Review Actions
        </h3>
        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-100 text-[#6B2FA8] border border-purple-200">
          Staff Controls
        </span>
      </div>

      {canAssign(user) && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-purple-300 block" htmlFor="d-assign">
            Assigned Committee Reviewer
          </label>
          <div className="flex gap-2">
            <select
              id="d-assign"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="flex-1 h-9 px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#1E1740] text-xs text-[#1E1B4B] dark:text-purple-100"
            >
              <option value="">Unassigned</option>
              {(reviewers.data || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              className="h-9 px-3.5 rounded-xl border border-purple-200 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-100 font-semibold text-xs cursor-pointer"
              disabled={busy}
              onClick={assign}
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {/* Scoring Grid */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-purple-200">
            Rubric Evaluation
          </span>
          <span className="text-xs font-extrabold text-[#6B2FA8] dark:text-purple-300">
            Overall: {w ? `${w.toFixed(1)} / 5` : 'Not scored'}
          </span>
        </div>

        {SCORING_CRITERIA.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-purple-300">{c.label}</span>
            <div className="flex gap-1" role="group" aria-label={c.label}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  disabled={busy}
                  aria-pressed={idea.scores[c.key] === n}
                  onClick={() => score(c.key, n)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                    idea.scores[c.key] === n
                      ? 'bg-[#6B2FA8] text-white shadow-xs'
                      : 'bg-white dark:bg-[#1E1740] border border-purple-200 dark:border-purple-800 text-slate-600 hover:bg-purple-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Decision Note & Actions */}
      <div className="space-y-3 pt-2 border-t border-purple-100 dark:border-purple-900/40">
        <div>
          <label htmlFor="d-note" className="text-xs font-semibold text-slate-500 block mb-1">
            Note to Submitter
          </label>
          <textarea
            id="d-note"
            maxLength={LIMITS.note}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Feedback note or questions for the submitter…"
            className="w-full min-h-[70px] p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#1E1740] text-xs text-[#1E1B4B] dark:text-purple-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label htmlFor="d-stage" className="font-semibold text-slate-500 block mb-1">
              Next Stage (if approved)
            </label>
            <select
              id="d-stage"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full h-8 px-2 rounded-lg border border-purple-200 bg-white text-xs"
            >
              <option value="">Select stage</option>
              {NEXT_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="d-reason" className="font-semibold text-slate-500 block mb-1">
              Reason (if rejected)
            </label>
            <select
              id="d-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-8 px-2 rounded-lg border border-purple-200 bg-white text-xs"
            >
              <option value="">Select reason</option>
              {REJECTION_REASONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {err && <div className="text-xs font-semibold text-rose-600">{err}</div>}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide('Approved')}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide('Under review')}
            className="h-8 px-3 rounded-lg border border-purple-300 text-[#6B2FA8] hover:bg-purple-100 font-semibold text-xs cursor-pointer"
          >
            Start Review
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide('Needs info')}
            className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs cursor-pointer"
          >
            Ask for Info
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide('Rejected')}
            className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
