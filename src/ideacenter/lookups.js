// All lists, limits and scoring settings live here so they can change without touching components.
// Values come from the CIO prototype and the company flow slide. Items marked TBC are still open.

export const ID_PREFIX = 'IDEA'; // company flow slide: IDEA-0001. Only the prefix is configurable.
export const REPLY_SLA_DAYS = 14; // "reply promise"

// Statuses for version 1. Phase 2 tracker statuses (Backlog, Planned, In progress, QA, Done) are NOT built.
export const STATUSES = ['Submitted', 'Under review', 'Needs info', 'Approved', 'In build', 'Delivered', 'Rejected', 'Parked'];

// CSS variable that colours each status pill (defined in ideacenter.css).
export const STATUS_COLOR = {
  'Submitted': '--c-submitted',
  'Under review': '--c-review',
  'Needs info': '--c-info',
  'Approved': '--c-approved',
  'In build': '--c-build',
  'Delivered': '--c-delivered',
  'Rejected': '--c-rejected',
  'Parked': '--c-parked',
};

// The CIO's wording, exactly.
export const CATEGORIES = ['Customer pain point', 'Value-add', 'New product', 'Process improvement', 'Internal efficiency'];
export const DOMAINS = [
  'Banking & Financial Services',
  'Retail & E-commerce',
  'Healthcare & Life Sciences',
  'Supply Chain & Logistics',
  'Manufacturing & IoT',
  'Telecom & Media',
  'Energy & Utilities',
  'Internal Operations',
  'Other',
];
export const TIMELINES = [
  '< 1 month (Quick win)',
  '1 - 3 months (MVP)',
  '3 - 6 months (Enterprise build)',
  '6+ months (Strategic transformation)',
  'Other',
];
export const TARGET_DEPTS = [
  'Operations',
  'IT & Engineering',
  'Sales & Marketing',
  'Finance & Legal',
  'HR & People Operations',
  'Customer Support',
  'Cross-functional / All',
  'Other',
];
export const TECH_AREAS = ['GenAI', 'Data', 'BI', 'Domo', 'Cloud', 'IoT', 'Automation', 'Other'];
export const SUBMITTER_TYPES = ['Employee', 'External'];

export const BENEFIT_TYPES = ['Time saved', 'Cost saved', 'Revenue', 'Customer benefit', 'Multiple benefits', 'Other'];
export const BENEFIT_PERIODS = ['Annual', 'Monthly', 'One-time'];
export const ROI_CONFIDENCE = ['Rough', 'Validated'];

export const EFFORTS = [
  { value: '', label: 'Not sure' },
  { value: 'S', label: 'Small (days)' },
  { value: 'M', label: 'Medium (weeks)' },
  { value: 'L', label: 'Large (months)' },
];
export const EFFORT_LABEL = { S: 'Small', M: 'Medium', L: 'Large' };

// Optional "sensitive data" flag from the CIO prototype. Who may see flagged ideas is TBC (see permissions.canView).
export const SENSITIVE_OPTIONS = ['No', 'Yes', 'Not sure'];

// Prototype's 7 reasons and 3 stages, kept until confirmed (TBC). 'Kaizen quick win' stays in the lists for now.
export const REJECTION_REASONS = [
  'Already exists or in progress',
  'Low business value',
  'Not feasible with current resources',
  'Needs a clearer problem statement',
  'Better handled as a Kaizen quick win',
  "Outside the lab's scope",
  'Duplicate of another idea',
];
export const NEXT_STAGES = ['Lab build backlog', 'Customer ROI workshop', 'Kaizen quick win'];

// Scoring: the company flow specifies 5 weighted criteria, not defined yet (TBC).
// Until then: the prototype's 4 criteria, equal weights, each scored 1 to 5.
export const SCORING_CRITERIA = [
  { key: 'value', label: 'Business value', weight: 1 },
  { key: 'reuse', label: 'Reuse across customers', weight: 1 },
  { key: 'feasibility', label: 'Feasibility', weight: 1 },
  { key: 'roi', label: 'Customer ROI', weight: 1 },
];
export const RECOMMEND_THRESHOLD = 3.5; // weighted score out of 5. Advice only: the reviewer decides.

// Maximum lengths (characters).
export const LIMITS = {
  name: 120,
  email: 180,
  title: 120,
  problem: 1200,
  solution: 1600,
  benefitDescription: 1200,
  stack: 200,
  plan: 600,
  note: 1000,
  reply: 1000,
};
