import React from 'react';
import { api } from '../api/ideaApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSpark } from '../hooks/SparkContext.jsx';
import { STATUSES, STATUS_COLOR, CATEGORIES, TECH_AREAS, REPLY_SLA_DAYS } from '../lookups.js';
import { inr } from '../lib/roi.js';
import { AsyncView, BarList } from '../components/ui.jsx';

export default function DashboardPage() {
  const { version } = useSpark();
  const state = useAsync(() => api.getStats(), [version]);

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC]">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#646C8C] dark:text-[#A9A1C9] mt-1">
            Where ideas are, and whether we are keeping our {REPLY_SLA_DAYS}-day reply promise.
          </p>
        </div>
      </div>

      <AsyncView state={state} isEmpty={(s) => s.total === 0} empty="No ideas yet, so there is nothing to show.">
        {(s) => (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 shadow-xs">
                <b className="block font-display font-black text-2xl sm:text-3xl text-[#6B2FA8] dark:text-[#C4B5FD] leading-tight mb-1">
                  {s.total}
                </b>
                <span className="text-xs sm:text-[13px] text-[#646C8C] dark:text-[#A9A1C9]">
                  Ideas submitted
                </span>
              </div>
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 shadow-xs">
                <b className="block font-display font-black text-2xl sm:text-3xl text-[#6B2FA8] dark:text-[#C4B5FD] leading-tight mb-1">
                  {s.avgDaysToFirstReply == null ? '–' : s.avgDaysToFirstReply.toFixed(1)}
                </b>
                <span className="text-xs sm:text-[13px] text-[#646C8C] dark:text-[#A9A1C9]">
                  Average days to first reply
                </span>
              </div>
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 shadow-xs">
                <b className={`block font-display font-black text-2xl sm:text-3xl leading-tight mb-1 ${s.waitingTooLong ? 'text-rose-600 dark:text-rose-400' : 'text-[#6B2FA8] dark:text-[#C4B5FD]'}`}>
                  {s.waitingTooLong}
                </b>
                <span className="text-xs sm:text-[13px] text-[#646C8C] dark:text-[#A9A1C9]">
                  Waiting longer than {REPLY_SLA_DAYS} days for a reply
                </span>
              </div>
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 shadow-xs">
                <b className="block font-display font-black text-2xl sm:text-3xl text-[#6B2FA8] dark:text-[#C4B5FD] leading-tight mb-1">
                  {s.unassigned}
                </b>
                <span className="text-xs sm:text-[13px] text-[#646C8C] dark:text-[#A9A1C9]">
                  Not yet assigned to a reviewer
                </span>
              </div>
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 shadow-xs">
                <b className="block font-display font-black text-2xl sm:text-3xl text-[#6B2FA8] dark:text-[#C4B5FD] leading-tight mb-1">
                  {inr(s.totalAnnualBenefit)}
                </b>
                <span className="text-xs sm:text-[13px] text-[#646C8C] dark:text-[#A9A1C9]">
                  Expected benefit entered by submitters, per year ({s.ideasWithBenefit} of {s.total} ideas included one)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-[#EEE9FC] mb-3">
                  Ideas by stage
                </h3>
                <BarList items={STATUSES.map((x) => [x, s.byStatus[x]])} colorOf={(x) => STATUS_COLOR[x]} />
              </div>
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-[#EEE9FC] mb-3">
                  Ideas by category
                </h3>
                <BarList items={CATEGORIES.map((x) => [x, s.byCategory[x]])} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-[#EEE9FC] mb-3">
                  Ideas by technology area
                </h3>
                <BarList items={TECH_AREAS.map((x) => [x, s.byTechnology[x]])} />
              </div>
              <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-5 shadow-xs space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                  About the benefit figure
                </h3>
                <p className="text-xs sm:text-[13px] text-[#646C8C] dark:text-[#A9A1C9] leading-relaxed">
                  These are estimates typed in by submitters, not checked numbers. Monthly figures are multiplied by 12, annual figures count once, and one-time figures count once as a first-year benefit.
                </p>
                <p className="text-xs sm:text-[13px] text-[#646C8C] dark:text-[#A9A1C9] leading-relaxed">
                  Power BI views for leadership come in Phase 2.
                </p>
              </div>
            </div>
          </div>
        )}
      </AsyncView>
    </div>
  );
}
