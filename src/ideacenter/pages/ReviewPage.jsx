import React, { useState } from 'react';
import { api } from '../api/ideaApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSpark } from '../hooks/SparkContext.jsx';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { weightedScore } from '../lib/scoring.js';
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar.jsx';
import { Pill, Tag, DueBadge, Recommended, AsyncView } from '../components/ui.jsx';

export default function ReviewPage() {
  const user = useCurrentUser();
  const { openIdea, version } = useSpark();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const state = useAsync(() => api.listIdeas({ ...filters, scope: 'assigned' }), [filters, version, user?.id]);
  const admin = user?.role === 'admin';

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC]">
            Review queue
          </h1>
          <p className="text-xs sm:text-sm text-[#646C8C] dark:text-[#A9A1C9] mt-1">
            Score ideas, decide, and move approved ones to the next stage.
          </p>
        </div>
      </div>

      <FilterBar value={filters} onChange={setFilters} />

      <AsyncView
        state={state}
        isEmpty={(d) => d.length === 0}
        empty={admin ? 'No ideas match these filters.' : 'Nothing is assigned to you right now. An admin will assign ideas to you.'}
      >
        {(list) => (
          <div className="overflow-x-auto bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-2xl shadow-xs">
            <table className="w-full min-w-[760px] text-left border-collapse text-xs sm:text-[13px]">
              <thead className="bg-purple-50/80 dark:bg-purple-950/50 text-[#646C8C] dark:text-[#A9A1C9] font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40 whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Idea</th>
                  <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Submitted by</th>
                  <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Status</th>
                  <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Reviewer</th>
                  <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Score</th>
                  <th className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40">Reply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/70 dark:divide-purple-900/30">
                {list.map((i) => {
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
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <DueBadge idea={i} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AsyncView>
    </div>
  );
}
