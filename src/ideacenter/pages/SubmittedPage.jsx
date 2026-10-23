import React, { useEffect, useState } from 'react';
import { A, getNavState, navigate, BASE } from '../hooks/useNav.jsx';
import { useSpark } from '../hooks/SparkContext.jsx';
import { REPLY_SLA_DAYS } from '../lookups.js';
import {
  CheckCircle2,
  Copy,
  Check,
  Layers,
  Compass,
  PlusCircle,
  Clock,
} from 'lucide-react';

// Confirmation: idea ID, acknowledgement and (for guests) the private tracking link.
export default function SubmittedPage() {
  const s = getNavState();
  const { toast } = useSpark();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!s?.id) navigate('/employee/submit');
  }, [s]);

  if (!s?.id) return null;

  const link = s.trackingUrl ? `${window.location.origin}${s.trackingUrl}` : '';

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(s.id);
      setCopiedId(true);
      toast(`Idea ID ${s.id} copied to clipboard!`);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast('Could not copy automatically. Please copy manually.');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast('Private tracking link copied.');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast('Copy did not work. Select the link and copy it.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6 sm:my-10 px-4">
      <div className="bg-white dark:bg-[#1E1740] border border-purple-200/80 dark:border-purple-800/60 rounded-3xl p-6 sm:p-9 shadow-xl shadow-purple-500/5 text-center relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-purple-200/40 dark:from-purple-900/30 to-transparent blur-3xl pointer-events-none" />

        {/* Success checkmark badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/25 ring-8 ring-emerald-50 dark:ring-emerald-950/40">
          <CheckCircle2 size={32} className="stroke-[2.5]" />
        </div>

        {/* Heading requested by user */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC] tracking-tight">
          Thank you for submitting!
        </h1>

        {/* Message requested by user */}
        <p className="text-sm sm:text-base font-medium text-purple-700 dark:text-purple-300 mt-2 max-w-lg mx-auto">
          Leadership will review and will update about the status.
        </p>

        {/* Reference ID Pill */}
        <div className="mt-6 inline-flex items-center gap-3 bg-slate-50 dark:bg-[#251D4A] border border-purple-100 dark:border-purple-800/60 rounded-2xl px-5 py-3 shadow-2xs">
          <div className="text-left">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#646C8C] dark:text-[#A9A1C9]">
              Idea Reference ID
            </div>
            <div className="font-mono font-bold text-lg sm:text-xl text-[#6B2FA8] dark:text-[#C4B5FD]">
              {s.id}
            </div>
          </div>
          <button
            type="button"
            onClick={copyId}
            className="p-2 rounded-xl text-purple-600 dark:text-purple-300 hover:bg-purple-100/60 dark:hover:bg-purple-900/50 transition cursor-pointer"
            title="Copy Idea ID"
          >
            {copiedId ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Review Commitment / Workflow Step info */}
        <div className="mt-6 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-left max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={16} />
            </div>
            <div className="text-xs text-[#1E1B4B] dark:text-[#EEE9FC] leading-relaxed">
              <div className="font-semibold text-sm text-[#1E1B4B] dark:text-[#EEE9FC] mb-0.5">
                Review Commitment
              </div>
              Your proposal has entered the review pipeline. Leadership and reviewers typically respond within{' '}
              <span className="font-bold text-[#6B2FA8] dark:text-purple-300">{REPLY_SLA_DAYS} business days</span> with feedback or next steps.
            </div>
          </div>
        </div>

        {/* Guest tracking link if present */}
        {link && (
          <div className="mt-6 pt-5 border-t border-purple-100 dark:border-purple-900/40 text-left">
            <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
              Your Private Tracking Link
            </h3>
            <p className="text-xs text-[#646C8C] dark:text-[#A9A1C9] mt-1 mb-2">
              Keep this link secure. It is the only way for guests to track updates and communicate with reviewers.
            </p>
            <div className="flex gap-2 flex-wrap items-center bg-[#FAF8FE] dark:bg-[#251D4A] border border-purple-200/80 dark:border-purple-800/60 rounded-xl p-3 my-3 break-all font-mono text-xs text-[#1E1B4B] dark:text-[#EEE9FC]">
              <span id="sp-tracklink" className="flex-1">{link}</span>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                onClick={copyLink}
              >
                {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-purple-100 dark:border-purple-900/40">
          {link ? (
            <>
              <A
                to={link.replace(window.location.origin + BASE, '')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#6B2FA8] hover:bg-[#582090] text-white shadow-md shadow-purple-600/20 transition inline-flex items-center gap-2"
              >
                <span>Track my idea</span>
              </A>
              <A
                to="/employee/submit"
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition inline-flex items-center gap-2"
              >
                <PlusCircle size={15} />
                <span>Submit another idea</span>
              </A>
              <A
                to="/employee/ideas"
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition inline-flex items-center gap-2"
              >
                <Compass size={15} />
                <span>Explore ideas</span>
              </A>
            </>
          ) : (
            <>
              {/* PRIMARY BUTTON: "View my ideas" properly navigating to /employee/my-ideas */}
              <A
                to="/employee/my-ideas"
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#6B2FA8] hover:bg-[#582090] text-white shadow-md shadow-purple-600/20 transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Layers size={16} />
                <span>View my ideas</span>
              </A>
              <A
                to="/employee/ideas"
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition inline-flex items-center gap-2"
              >
                <Compass size={15} />
                <span>Explore ideas</span>
              </A>
              <A
                to="/employee/submit"
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition inline-flex items-center gap-2"
              >
                <PlusCircle size={15} />
                <span>Submit another idea</span>
              </A>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
