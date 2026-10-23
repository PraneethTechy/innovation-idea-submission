import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ArrowUpDown,
  User,
  Building,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/ideaApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSpark } from '../hooks/SparkContext.jsx';
import { STATUSES, STATUS_COLOR, CATEGORIES } from '../lookups.js';
import { fdate } from '../lib/dates.js';
import { Pill, Tag, AsyncView } from '../components/ui.jsx';

export default function ManageIdeasPage() {
  const { openIdea, bump, toast, version } = useSpark();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const state = useAsync(() => api.listIdeas({}), [version]);

  const handleStatusChange = async (ideaId, newStatus) => {
    setUpdatingId(ideaId);
    try {
      await api.decide(ideaId, {
        status: newStatus,
        note: `Status modified to "${newStatus}" via Pipeline Manager.`,
        stage: newStatus === 'Approved' ? 'Kaizen quick win' : newStatus === 'In build' ? 'Lab build backlog' : '',
      });
      bump();
      toast(`Updated ${ideaId} status to "${newStatus}".`);
    } catch (err) {
      toast(`Failed to update status: ${err.message || 'Error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-200/60 anim-fade-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Idea Pipeline Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Update lifecycle statuses, track stage progression, and manage leadership review notes.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs flex flex-wrap items-center gap-3 anim-kpi">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, ID, or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
          />
        </div>

        {/* Status Filter */}
        <div className="w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-44">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {(search || statusFilter || categoryFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setCategoryFilter('');
            }}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 px-2 py-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Interactive Table */}
      <AsyncView state={state} rows={6} isEmpty={(d) => d.length === 0} empty="No ideas found in the pipeline.">
        {(ideas) => {
          const filtered = ideas.filter((item) => {
            if (statusFilter && item.status !== statusFilter) return false;
            if (categoryFilter && item.category !== categoryFilter) return false;
            if (search) {
              const query = search.toLowerCase();
              const matchTitle = (item.title || '').toLowerCase().includes(query);
              const matchId = (item.id || '').toLowerCase().includes(query);
              const matchWho = (item.submitterName || '').toLowerCase().includes(query);
              if (!matchTitle && !matchId && !matchWho) return false;
            }
            return true;
          });

          return (
            <div className="bg-white rounded-3xl border border-purple-200/80 shadow-sm overflow-hidden anim-content">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-purple-50/60 border-b border-purple-100 text-slate-600 font-semibold">
                      <th className="py-3.5 px-4 font-mono">ID</th>
                      <th className="py-3.5 px-4">Idea Title & Category</th>
                      <th className="py-3.5 px-4">Submitter</th>
                      <th className="py-3.5 px-4">Lifecycle Status</th>
                      <th className="py-3.5 px-4">Assigned Stage</th>
                      <th className="py-3.5 px-4">Submitted</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((idea) => {
                      return (
                        <tr
                          key={idea.id}
                          className="hover:bg-purple-50/30 transition-colors group"
                        >
                          {/* ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-800 whitespace-nowrap">
                            {idea.id}
                          </td>

                          {/* Title & Category */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <button
                              type="button"
                              onClick={() => openIdea(idea.id)}
                              className="font-bold text-slate-900 hover:text-purple-700 hover:underline text-left line-clamp-1 block mb-0.5"
                            >
                              {idea.title}
                            </button>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                {idea.category || 'General'}
                              </span>
                              {idea.technology && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                                  {idea.technology}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Submitter */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 block">{idea.submitterName}</span>
                            <span className="text-[11px] text-slate-500">{idea.dept || idea.submitterType}</span>
                          </td>

                          {/* Interactive Status Selector */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={idea.status}
                              disabled={updatingId === idea.id}
                              onChange={(e) => handleStatusChange(idea.id, e.target.value)}
                              className="py-1 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 cursor-pointer shadow-2xs"
                              style={{
                                borderLeftWidth: '4px',
                                borderLeftColor: `var(${STATUS_COLOR[idea.status] || '--c-submitted'})`,
                              }}
                            >
                              {STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Stage */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {idea.stage ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                {idea.stage}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Unassigned</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {fdate(idea.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openIdea(idea.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-purple-700 hover:bg-purple-100 font-semibold text-xs transition"
                            >
                              <span>Details</span>
                              <ExternalLink size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No ideas match the active filters.
                </div>
              )}
            </div>
          );
        }}
      </AsyncView>
    </div>
  );
}
