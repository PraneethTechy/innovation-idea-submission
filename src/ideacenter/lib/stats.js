import { STATUSES, CATEGORIES, TECH_AREAS, REPLY_SLA_DAYS } from '../lookups.js';
import { DAY, daysSince } from './dates.js';
import { annualBenefit } from './roi.js';

const countBy = (list, keys, pick) => {
  const out = Object.fromEntries(keys.map((k) => [k, 0]));
  list.forEach((i) => { const k = pick(i); if (k in out) out[k] += 1; });
  return out;
};

// One place that computes the numbers, used by the mock adapter's getStats() and by Home.
export function computeStats(ideas) {
  const replied = ideas.filter((i) => i.firstFeedbackAt).map((i) => (i.firstFeedbackAt - i.createdAt) / DAY);
  const withBenefit = ideas.filter((i) => annualBenefit(i.financialBenefit, i.benefitPeriod) !== null);
  return {
    total: ideas.length,
    last30Days: ideas.filter((i) => daysSince(i.createdAt) <= 30).length,
    inAction: ideas.filter((i) => i.status === 'Approved' || i.status === 'In build').length,
    delivered: ideas.filter((i) => i.status === 'Delivered').length,
    avgDaysToFirstReply: replied.length ? replied.reduce((a, b) => a + b, 0) / replied.length : null,
    waitingTooLong: ideas.filter((i) => !i.firstFeedbackAt && daysSince(i.createdAt) > REPLY_SLA_DAYS).length,
    unassigned: ideas.filter((i) => !i.assigneeId).length,
    byStatus: countBy(ideas, STATUSES, (i) => i.status),
    byCategory: countBy(ideas, CATEGORIES, (i) => i.category),
    byTechnology: countBy(ideas, TECH_AREAS, (i) => i.technology),
    // Yearly figure: monthly x 12, annual x 1, one-time x 1 (counted once).
    totalAnnualBenefit: withBenefit.reduce((s, i) => s + annualBenefit(i.financialBenefit, i.benefitPeriod), 0),
    ideasWithBenefit: withBenefit.length,
  };
}
