// All data goes through this file. VITE_IDEA_API picks the adapter: "mock" (default) or "http".
//
// Interface (every method returns a Promise and throws ApiError { error, message, status }):
//   getMe()                                  -> user | null
//   listIdeas({status,category,technology,q,sort,scope})  scope: 'mine' | 'assigned'
//   getIdea(id)  createIdea(payload)  toggleVote(id)  assignReviewer(id, reviewerId)
//   scoreIdea(id, criterion, value)  decide(id, {status,note,stage,reason})  submitterReply(id, text)
//   listReviewers()  getStats()
//   publicVerifyEmail(email)  publicVerifyCode(email, code)  publicCreateIdea(payload)
//   publicTrack(token)  publicTrackReply(token, text)
import { mockAdapter } from './mockAdapter.js';
import { httpAdapter } from './httpAdapter.js';

export const ADAPTER_NAME = import.meta.env.VITE_IDEA_API === 'http' ? 'http' : 'mock';
export const api = ADAPTER_NAME === 'http' ? httpAdapter : mockAdapter;
export const isMock = ADAPTER_NAME === 'mock';
export { mockAdapter };

export const resetDemoData = () => {
  if (isMock && mockAdapter._resetSeed) {
    return mockAdapter._resetSeed();
  }
};
