import React from 'react';
import { mockAdapter } from '../api/ideaApi.js';

// PLACEHOLDER for a bot check. It adds no third-party script. The real check is chosen with IT later
// (the server also rate-limits). Swap this component's inside; keep the onToken(token | null) contract.
export default function BotCheck({ checked, onToken }) {
  return (
    <label className="inline-flex items-center gap-2.5 border border-purple-200/80 dark:border-purple-800/60 rounded-xl px-3.5 py-2.5 bg-[#FAF8FE] dark:bg-[#1E1740] w-fit mb-4 font-medium text-xs sm:text-sm text-[#1E1B4B] dark:text-[#EEE9FC] cursor-pointer shadow-2xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToken(e.target.checked ? mockAdapter.MOCK_BOT_TOKEN : null)}
        className="w-4.5 h-4.5 rounded accent-[#6B2FA8] cursor-pointer"
      />
      <span>I am a person, not a bot</span>
    </label>
  );
}
