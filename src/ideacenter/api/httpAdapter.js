// Real adapter: calls the draft API contract (brief, section 6). The backend is built separately and the contract may change.
// Signed-in calls carry the user's token; the SERVER decides who the user is and what they may do.
import { ApiError } from './errors.js';
import { getAuthToken } from './auth.js';

const BASE = (import.meta.env.VITE_IDEA_API_BASE || '/api').replace(/\/$/, '');

async function request(method, path, { query, body, auth = true } = {}) {
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null)) : '';
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = await getAuthToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}${qs}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('network', 'We could not reach the server. Check your connection and try again.', 0);
  }
  if (res.status === 401 && auth) {
    window.dispatchEvent(new CustomEvent('spark:unauthorized')); // the app sends a signed-in user back to sign-in
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error || 'error', data?.message || 'Something went wrong. Please try again.', res.status);
  return data;
}

export const httpAdapter = {
  name: 'http',
  async getMe() {
    try { return await request('GET', '/me'); } catch (e) { if (e.status === 401) return null; throw e; }
  },
  listIdeas: (q = {}) => request('GET', '/ideas', { query: { status: q.status, category: q.category, technology: q.technology, q: q.q, sort: q.sort, scope: q.scope } }),
  getIdea: (id) => request('GET', `/ideas/${encodeURIComponent(id)}`),
  createIdea: (p) => request('POST', '/ideas', { body: p }),
  toggleVote: (id) => request('POST', `/ideas/${encodeURIComponent(id)}/vote`),
  assignReviewer: (id, reviewerId) => request('POST', `/ideas/${encodeURIComponent(id)}/assign`, { body: { reviewerId } }),
  scoreIdea: (id, criterion, value) => request('POST', `/ideas/${encodeURIComponent(id)}/score`, { body: { criterion, value } }),
  decide: (id, d) => request('POST', `/ideas/${encodeURIComponent(id)}/decision`, { body: d }),
  // Not in the draft contract yet: needed for the signed-in "Needs info" reply (see README, open questions).
  submitterReply: (id, text) => request('POST', `/ideas/${encodeURIComponent(id)}/reply`, { body: { text } }),
  // Idea discussion & engagement endpoints
  addComment: (id, { type, content }) => request('POST', `/ideas/${encodeURIComponent(id)}/comments`, { body: { type, content } }),
  editComment: (id, commentId, { content }) => request('PUT', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`, { body: { content } }),
  deleteComment: (id, commentId) => request('DELETE', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`),
  addReply: (id, commentId, { content }) => request('POST', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/replies`, { body: { content } }),
  editReply: (id, commentId, replyId, { content }) => request('PUT', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/replies/${encodeURIComponent(replyId)}`, { body: { content } }),
  deleteReply: (id, commentId, replyId) => request('DELETE', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/replies/${encodeURIComponent(replyId)}`),
  toggleCommentLike: (id, commentId, replyId = null) => request('POST', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/like`, { query: replyId ? { replyId } : {} }),
  toggleResolveQuestion: (id, commentId) => request('POST', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/resolve`),
  toggleOfficialGuidance: (id, commentId) => request('POST', `/ideas/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/official-guidance`),
  listReviewers: () => request('GET', '/reviewers'),

  getStats: () => request('GET', '/stats'),


  publicVerifyEmail: (email) => request('POST', '/public/verify-email', { body: { email }, auth: false }),
  // Not in the draft contract yet: swaps the emailed code for a verification token.
  publicVerifyCode: (email, code) => request('POST', '/public/verify-code', { body: { email, code }, auth: false }),
  publicCreateIdea: (p) => request('POST', '/public/ideas', { body: p, auth: false }),
  publicTrack: (tok) => request('GET', `/public/track/${encodeURIComponent(tok)}`, { auth: false }),
  publicTrackReply: (tok, text) => request('POST', `/public/track/${encodeURIComponent(tok)}/reply`, { body: { text }, auth: false }),
};
