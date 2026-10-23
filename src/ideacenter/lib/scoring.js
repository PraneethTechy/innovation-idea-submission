import { SCORING_CRITERIA, RECOMMEND_THRESHOLD } from '../lookups.js';

export function allScored(scores = {}) {
  return SCORING_CRITERIA.every((c) => Number.isFinite(scores[c.key]));
}

// Weighted average out of 5 over the criteria scored so far. Returns 0 when nothing is scored.
export function weightedScore(scores = {}) {
  let sum = 0;
  let weights = 0;
  for (const c of SCORING_CRITERIA) {
    if (Number.isFinite(scores[c.key])) {
      sum += scores[c.key] * c.weight;
      weights += c.weight;
    }
  }
  return weights ? sum / weights : 0;
}

// Advice only. Shown when every criterion is scored and the weighted score is 3.5 or more.
export const isRecommended = (scores) => allScored(scores) && weightedScore(scores) >= RECOMMEND_THRESHOLD;
