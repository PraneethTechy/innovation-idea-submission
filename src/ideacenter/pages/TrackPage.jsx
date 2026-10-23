import React, { useState } from 'react';
import { api, isMock } from '../api/ideaApi.js';
import { DEMO_TRACKING_TOKEN } from '../api/seed.js';
import { asMessage } from '../api/errors.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSpark } from '../hooks/SparkContext.jsx';
import { navigate } from '../hooks/useNav.jsx';
import { LIMITS, REPLY_SLA_DAYS } from '../lookups.js';
import { fdate } from '../lib/dates.js';
import { Pill, DueBadge, AsyncView } from '../components/ui.jsx';

// /ideas/track: ask for the private link or code. /ideas/track/:token: show that one idea (public, no sign-in).
export function TrackForm() {
  const [v, setV] = useState('');
  const go = (e) => {
    e.preventDefault();
    const tok = v.trim().split('/').filter(Boolean).pop();
    if (tok) navigate(`/track/${encodeURIComponent(tok)}`);
  };
  return (
    <div className="py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC]">
            Track my idea
          </h1>
          <p className="text-xs sm:text-sm text-[#646C8C] dark:text-[#A9A1C9] mt-1">
            Paste the private tracking link you got when you submitted.
          </p>
        </div>
      </div>
      <form
        className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
        onSubmit={go}
      >
        <div>
          <label htmlFor="f-track" className="block font-semibold mb-1 text-xs sm:text-[13.5px] text-[#1E1B4B] dark:text-purple-100">
            Tracking link or code
          </label>
          <input
            id="f-track"
            type="text"
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder="Paste your tracking link"
            autoComplete="off"
            className="w-full border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#251D4A] text-xs sm:text-sm text-[#1E1B4B] dark:text-[#EEE9FC] focus:outline-none focus:ring-1.5 focus:ring-[#7C3AED]"
          />
          {import.meta.env.DEV && isMock && (
            <p className="text-xs text-[#646C8C] dark:text-[#A9A1C9] mt-1.5">
              Mock demo code: <span className="font-mono text-[#6B2FA8] dark:text-[#C4B5FD]">{DEMO_TRACKING_TOKEN}</span>
            </p>
          )}
        </div>
        <button
          className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#6B2FA8] hover:bg-[#582090] text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
          type="submit"
          disabled={!v.trim()}
        >
          Find my idea
        </button>
      </form>
    </div>
  );
}

export function TrackDetail({ token }) {
  const { toast } = useSpark();
  const [tick, setTick] = useState(0);
  const state = useAsync(() => api.publicTrack(token), [token, tick]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!text.trim()) { setErr('Write a reply before sending.'); return; }
    setBusy(true); setErr('');
    try { await api.publicTrackReply(token, text); toast('Reply sent to the reviewer.'); setText(''); setTick((t) => t + 1); }
    catch (e) { setErr(asMessage(e)); }
    setBusy(false);
  };

  return (
    <div className="py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] dark:text-[#EEE9FC]">
            Track my idea
          </h1>
          <p className="text-xs sm:text-sm text-[#646C8C] dark:text-[#A9A1C9] mt-1">
            Your private view of what is happening with your idea.
          </p>
        </div>
      </div>
      <AsyncView state={state} rows={2}>
        {(t) => (
          <div className="bg-white/80 dark:bg-[#1E1740]/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-800/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex gap-2.5 flex-wrap items-center text-xs">
              <span className="font-mono font-semibold text-xs text-[#6B2FA8] dark:text-[#C4B5FD]">{t.id}</span>
              <Pill status={t.status} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
              {t.title}
            </h2>
            <p className="text-xs text-[#646C8C] dark:text-[#A9A1C9]">
              Submitted {fdate(t.createdAt)} · <DueBadge idea={t} /> · we reply within {REPLY_SLA_DAYS} days
            </p>
            {t.status === 'Rejected' && (
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                <b>Decision:</b> Rejected: {t.reason}.
              </p>
            )}
            {t.stage && (
              <p className="text-xs sm:text-sm text-[#1E1B4B] dark:text-[#EEE9FC]">
                <b>Next stage:</b> {t.stage}
              </p>
            )}
            {t.status === 'Needs info' && (
              <div className="border-t border-purple-100 dark:border-purple-900/40 mt-5 pt-4 space-y-3">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                  A reviewer needs more from you
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4363] dark:text-[#A9A1C9]">
                  {t.question}
                </p>
                <label className="sr-only" htmlFor="f-reply">Your reply</label>
                <textarea
                  id="f-reply"
                  maxLength={LIMITS.reply}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your response…"
                  className="w-full min-h-[100px] border border-purple-200/80 dark:border-purple-800/60 rounded-xl p-3 bg-white dark:bg-[#251D4A] text-xs sm:text-sm text-[#1E1B4B] dark:text-[#EEE9FC] focus:outline-none focus:ring-1.5 focus:ring-[#7C3AED]"
                />
                {err && <div className="text-xs text-rose-600 dark:text-rose-400 font-medium" role="alert">{err}</div>}
                <div>
                  <button
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6B2FA8] hover:bg-[#582090] text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                    disabled={busy}
                    onClick={send}
                  >
                    {busy ? 'Sending…' : 'Send reply'}
                  </button>
                </div>
              </div>
            )}
            <div className="border-t border-purple-100 dark:border-purple-900/40 mt-5 pt-4 space-y-3">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-[#EEE9FC]">
                History
              </h3>
              <ul className="list-none m-0 p-0 text-xs sm:text-[13px] space-y-3">
                {[...t.history].reverse().map((h, k) => (
                  <li key={k} className="pl-4 border-l-2 border-purple-200 dark:border-purple-800 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#F28C38]" />
                    <small className="text-[#646C8C] dark:text-[#A9A1C9]">{fdate(h.t)} · {h.who}</small>
                    <div className="text-[#1E1B4B] dark:text-[#EEE9FC] mt-0.5">{h.text}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </AsyncView>
    </div>
  );
}
