import { LIMITS, CATEGORIES, TECH_AREAS, BENEFIT_TYPES, BENEFIT_PERIODS, SUBMITTER_TYPES, DOMAINS, TIMELINES } from '../lookups.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v) => EMAIL.test(String(v || '').trim());

// Returns { fieldName: 'plain-language message' }. Empty object means valid.
// Used by the form (to guide people) and by the mock adapter (standing in for the server, which must check again).
export function validateIdea(p, { needsContact = true } = {}) {
  const e = {};
  const t = (v) => String(v ?? '').trim();

  if (needsContact) {
    if (!t(p.name)) e.name = 'Enter your name.';
    else if (t(p.name).length > LIMITS.name) e.name = `Keep your name under ${LIMITS.name} characters.`;
    if (!isEmail(p.email) || t(p.email).length > LIMITS.email) e.email = 'Enter a valid email address.';
    if (!SUBMITTER_TYPES.includes(p.submitterType)) e.submitterType = 'Choose Employee or External.';
  }

  // Step 1: Idea basics
  if (!t(p.title)) e.title = 'Add a title so reviewers can recognise your idea.';
  else if (t(p.title).length > LIMITS.title) e.title = `Keep the title under ${LIMITS.title} characters.`;

  // Domain & Other
  if (!p.domain) e.domain = 'Select which domain your idea belongs to.';
  else if (p.domain === 'Other' && !t(p.otherDomain)) e.otherDomain = 'Please specify the domain.';

  // Technology & Other
  if (!p.technology) e.technology = 'Choose a technology area.';
  else if (p.technology === 'Other' && !t(p.otherTechnology)) e.otherTechnology = 'Please specify the technology area.';

  // Timeline & Other
  if (!p.timeline) e.timeline = 'Choose an estimated timeline to build.';
  else if (p.timeline === 'Other' && !t(p.otherTimeline)) e.otherTimeline = 'Please specify the timeline.';

  // Target Department Other
  if (p.targetDept === 'Other' && !t(p.otherTargetDept)) {
    e.otherTargetDept = 'Please specify the target department.';
  }

  // Category is optional / removed from submission UI
  if (p.category && !CATEGORIES.includes(p.category)) {
    e.category = 'Choose a valid category.';
  }

  // Step 2: Problem & Solution
  if (!t(p.problem)) e.problem = 'Describe the problem and who faces it.';
  else if (t(p.problem).length > LIMITS.problem) e.problem = `Keep this under ${LIMITS.problem} characters.`;
  if (!t(p.solution)) e.solution = 'Describe your proposed solution.';
  else if (t(p.solution).length > LIMITS.solution) e.solution = `Keep this under ${LIMITS.solution} characters.`;

  // Step 3: Business impact
  if (!p.benefitType) e.benefitType = 'Choose the expected value type.';
  else if (p.benefitType === 'Other' && !t(p.otherBenefitType)) e.otherBenefitType = 'Please specify the expected value type.';

  if (!t(p.benefitDescription)) e.benefitDescription = 'Explain the expected value and assumptions.';
  else if (t(p.benefitDescription).length > LIMITS.benefitDescription) e.benefitDescription = `Keep this under ${LIMITS.benefitDescription} characters.`;

  // Optional ROI numbers must be zero or greater.
  for (const k of ['investment', 'financialBenefit']) {
    const v = p[k];
    if (v !== '' && v !== null && v !== undefined && (!Number.isFinite(Number(v)) || Number(v) < 0)) {
      e[k] = 'Enter an amount of zero or more.';
    }
  }
  if (p.benefitPeriod && !BENEFIT_PERIODS.includes(p.benefitPeriod)) e.benefitPeriod = 'Choose a benefit period.';
  if (t(p.stack).length > LIMITS.stack) e.stack = `Keep this under ${LIMITS.stack} characters.`;
  if (t(p.plan).length > LIMITS.plan) e.plan = `Keep this under ${LIMITS.plan} characters.`;

  return e;
}

// Step-specific validator for multi-step stepper navigation
export function validateStep(step, p, { needsContact = true } = {}) {
  const e = {};
  const t = (v) => String(v ?? '').trim();

  if (step === 1) {
    if (!t(p.title)) e.title = 'Add a title so reviewers can recognise your idea.';
    else if (t(p.title).length > LIMITS.title) e.title = `Keep the title under ${LIMITS.title} characters.`;

    if (!p.domain) e.domain = 'Select which domain your idea belongs to.';
    else if (p.domain === 'Other' && !t(p.otherDomain)) e.otherDomain = 'Please specify the domain.';

    if (!p.technology) e.technology = 'Choose a technology area.';
    else if (p.technology === 'Other' && !t(p.otherTechnology)) e.otherTechnology = 'Please specify the technology area.';

    if (!p.timeline) e.timeline = 'Choose an estimated timeline to build.';
    else if (p.timeline === 'Other' && !t(p.otherTimeline)) e.otherTimeline = 'Please specify the timeline.';

    if (p.targetDept === 'Other' && !t(p.otherTargetDept)) {
      e.otherTargetDept = 'Please specify the target department.';
    }
  } else if (step === 2) {
    if (!t(p.problem)) e.problem = 'Describe the problem and who faces it.';
    else if (t(p.problem).length > LIMITS.problem) e.problem = `Keep this under ${LIMITS.problem} characters.`;

    if (!t(p.solution)) e.solution = 'Describe your proposed solution.';
    else if (t(p.solution).length > LIMITS.solution) e.solution = `Keep this under ${LIMITS.solution} characters.`;

    if (t(p.stack).length > LIMITS.stack) e.stack = `Keep this under ${LIMITS.stack} characters.`;
    if (t(p.plan).length > LIMITS.plan) e.plan = `Keep this under ${LIMITS.plan} characters.`;
  } else if (step === 3) {
    if (!p.benefitType) e.benefitType = 'Choose the expected value type.';
    else if (p.benefitType === 'Other' && !t(p.otherBenefitType)) e.otherBenefitType = 'Please specify the expected value type.';

    if (!t(p.benefitDescription)) e.benefitDescription = 'Explain the expected value and assumptions.';
    else if (t(p.benefitDescription).length > LIMITS.benefitDescription) e.benefitDescription = `Keep this under ${LIMITS.benefitDescription} characters.`;

    for (const k of ['investment', 'financialBenefit']) {
      const v = p[k];
      if (v !== '' && v !== null && v !== undefined && (!Number.isFinite(Number(v)) || Number(v) < 0)) {
        e[k] = 'Enter an amount of zero or more.';
      }
    }
  } else if (step === 4) {
    if (needsContact) {
      if (!t(p.name)) e.name = 'Enter your name.';
      else if (t(p.name).length > LIMITS.name) e.name = `Keep your name under ${LIMITS.name} characters.`;
      if (!isEmail(p.email) || t(p.email).length > LIMITS.email) e.email = 'Enter a valid email address.';
      if (!SUBMITTER_TYPES.includes(p.submitterType)) e.submitterType = 'Choose Employee or External.';
    }
  }

  return e;
}
