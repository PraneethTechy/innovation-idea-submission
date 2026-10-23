// Indicative ROI. Convert the benefit to a yearly figure FIRST, so a monthly benefit is not read as a loss.
const MULTIPLIER = { Annual: 1, Monthly: 12, 'One-time': 1 };

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

export function annualBenefit(benefit, period) {
  const b = num(benefit);
  if (b === null || !Number.isFinite(b) || b < 0) return null;
  return b * (MULTIPLIER[period] ?? 1);
}

// Returns null when there is nothing to show (investment empty or zero, or benefit empty).
export function computeRoi({ investment, financialBenefit, benefitPeriod }) {
  const inv = num(investment);
  const annual = annualBenefit(financialBenefit, benefitPeriod);
  if (inv === null || !Number.isFinite(inv) || inv <= 0 || annual === null) return null;
  return {
    annualBenefit: annual,
    net: annual - inv,
    percent: ((annual - inv) / inv) * 100,
    oneTime: benefitPeriod === 'One-time', // label as "first year"
  };
}

export const inr = (n) =>
  Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
