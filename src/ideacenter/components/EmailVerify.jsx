import React, { useEffect, useRef, useState } from 'react';
import { api, isMock } from '../api/ideaApi.js';
import { MOCK_CODE } from '../api/mockAdapter.js';
import { asMessage } from '../api/errors.js';
import { isEmail } from '../lib/validate.js';

// Public visitors confirm their email with a six-digit code before they can submit.
// `onVerified(token | null)` hands the verification token to the form; null means "not verified (any more)".
export default function EmailVerify({ email, onVerified }) {
  const [stage, setStage] = useState('idle'); // idle | sent | verified
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const report = useRef(onVerified);
  report.current = onVerified;

  // Changing the email after verifying means starting again.
  useEffect(() => { setStage('idle'); setCode(''); setMsg(''); report.current(null); }, [email]);

  const send = async () => {
    setBusy(true); setMsg('');
    try { await api.publicVerifyEmail(email.trim()); setStage('sent'); setMsg('We sent a six-digit code to your email.'); }
    catch (e) { setMsg(asMessage(e)); }
    setBusy(false);
  };
  const verify = async () => {
    setBusy(true); setMsg('');
    try { const r = await api.publicVerifyCode(email.trim(), code.trim()); setStage('verified'); report.current(r.verificationToken); setMsg(''); }
    catch (e) { setMsg(asMessage(e)); }
    setBusy(false);
  };

  return (
    <div className="bg-[#FAF8FE] dark:bg-[#1E1740] border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 mb-4.5" aria-live="polite">
      <p className="text-xs text-[#646C8C] dark:text-[#A9A1C9] mb-2 leading-relaxed">
        <b className="text-[#1E1B4B] dark:text-[#EEE9FC]">Check your email.</b> We send a six-digit code so we know the address is yours.{isMock ? ` (Mock: the code is ${MOCK_CODE}.)` : ''}
      </p>
      {stage === 'verified' ? (
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5">
          Email verified ✓
        </span>
      ) : (
        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-purple-200 dark:border-purple-800 text-[#6B2FA8] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition disabled:opacity-50 cursor-pointer"
            disabled={busy || !isEmail(email)}
            onClick={send}
          >
            {stage === 'sent' ? 'Send a new code' : 'Send code'}
          </button>
          {stage === 'sent' && (
            <>
              <label className="sr-only" htmlFor="f-code">Six-digit code</label>
              <input
                id="f-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="flex-[1_1_140px] min-w-0 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-2.5 py-1.5 bg-white dark:bg-[#251D4A] text-xs text-[#1E1B4B] dark:text-[#EEE9FC] focus:outline-none focus:ring-1.5 focus:ring-[#7C3AED]"
              />
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#6B2FA8] text-white hover:bg-[#582090] transition disabled:opacity-50 cursor-pointer"
                disabled={busy || code.length !== 6}
                onClick={verify}
              >
                Verify
              </button>
            </>
          )}
        </div>
      )}
      {msg && <div className="text-xs text-[#646C8C] dark:text-[#A9A1C9] mt-2" role="status">{msg}</div>}
    </div>
  );
}
