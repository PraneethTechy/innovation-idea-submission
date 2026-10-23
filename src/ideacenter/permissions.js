// Every permission decision lives here. The interface only HIDES things; the server enforces the rules.
// `user` is null for a public visitor (not signed in).
import { hasRole } from './roles.js';

export const isSignedIn = (user) => !!user;

// Browse the shared idea feed: signed-in associates and above. A public visitor can never browse.
export function canBrowse(user) {
  return hasRole(user, 'associate');
}

// May this user open this idea's details?
// TBC: should ideas flagged sensitive be hidden from ordinary associates? Not decided.
// If it is decided, change ONLY this function (e.g. return false when idea.sensitive === 'Yes' and
// the user is not staff and not the submitter).
export function canView(user, idea) {
  if (!user || !idea) return false;
  return hasRole(user, 'associate');
}

export const canVote = (user) => hasRole(user, 'associate');
export const isOwner = (user, idea) => !!user && !!idea && idea.submitterId === user.id;
export const canSeeReviewQueue = (user) => hasRole(user, 'reviewer');
export const canSeeDashboard = (user) => hasRole(user, 'admin');
export const canAssign = (user) => hasRole(user, 'admin');

// Reviewer who is assigned to the idea, or an admin.
export function canReview(user, idea) {
  if (!user || !idea) return false;
  if (hasRole(user, 'admin')) return true;
  return hasRole(user, 'reviewer') && idea.assigneeId === user.id;
}
export const canDecide = canReview;

// Contact details are shown only to staff on the idea and to the submitter.
export function canSeeContact(user, idea) {
  return canReview(user, idea) || isOwner(user, idea);
}

// Submitter replies to a "Needs info" question (signed-in path).
export function canReply(user, idea) {
  return isOwner(user, idea) && idea.status === 'Needs info';
}

// Discussion & Engagement permissions
export function canComment(user, idea) {
  return canView(user, idea);
}

export function canEditComment(user, item) {
  return !!user && !!item && user.id === item.authorId;
}

export function canDeleteComment(user, item) {
  if (!user || !item) return false;
  return user.id === item.authorId || hasRole(user, 'admin');
}

export function isLeadership(user) {
  return hasRole(user, 'reviewer') || hasRole(user, 'admin');
}

// =========================================================================
// ROLE-AWARE CONTEXTS & VISIBILITY RULES (Peer Employee, Submitter, Leadership)
// =========================================================================

/**
 * Determines the viewer's context relative to an idea:
 * - 'leadership': Admin or assigned/committee reviewer
 * - 'submitter': The author/owner of this specific idea
 * - 'peer': Another signed-in employee viewing someone else's idea
 * - 'public': Unauthenticated visitor
 */
export function getViewerContext(user, idea) {
  if (!user) return 'public';
  if (isLeadership(user)) return 'leadership';
  if (isOwner(user, idea)) return 'submitter';
  return 'peer';
}

export const isPeer = (user, idea) => getViewerContext(user, idea) === 'peer';
export const isSubmitter = (user, idea) => getViewerContext(user, idea) === 'submitter';

/**
 * Submitter Privacy:
 * When public recognition is private (idea.consent !== true):
 * - Peers: Mask name as "Anonymous Innovator", hide manager & email
 * - Submitter & Leadership: Permitted to see real identity
 */
export function shouldMaskSubmitter(user, idea) {
  if (!idea) return false;
  if (isLeadership(user) || isOwner(user, idea)) return false;
  return !idea.consent;
}

/**
 * Reporting Manager Visibility:
 * Internal HR hierarchy data: strictly hidden from peer employees.
 * Only visible to Leadership and the Idea Submitter themselves.
 */
export function canSeeReportingManager(user, idea) {
  if (!user || !idea) return false;
  return isLeadership(user) || isOwner(user, idea);
}

/**
 * Financial & Budget Visibility:
 * Exact investment amounts, expected monetary returns, and ROI formulas
 * are visible ONLY to Leadership and the Submitter.
 * Peers see qualitative Value & Strategic Impact.
 */
export function canSeeDetailedFinancials(user, idea) {
  if (!user || !idea) return false;
  return isLeadership(user) || isOwner(user, idea);
}

/**
 * Internal Governance & Compliance Metadata:
 * Sensitive data flags, Assigned reviewer names, and intake consent flags
 * are visible ONLY to Leadership and Submitter.
 * Peers see the Idea Progress Stepper instead.
 */
export function canSeeGovernance(user, idea) {
  if (!user || !idea) return false;
  return isLeadership(user) || isOwner(user, idea);
}

/**
 * Official Guidance Designation:
 * Only authorized leadership (reviewer / admin) can mark comments or questions
 * as official leadership guidance or committee clarification.
 */
export function canDesignateOfficial(user) {
  return isLeadership(user);
}

/**
 * Question Resolution Permissions:
 * - Question author: Can resolve their own question
 * - Idea submitter: Can resolve a question on their own idea once addressed
 * - Authorized leadership: Can resolve or reopen any question
 * - Unrelated peer employee: Cannot resolve or reopen someone else's question
 */
export function canResolveQuestion(user, question, idea) {
  if (!user || !question) return false;
  const isQuestionAuthor = user.id === question.authorId;
  const isIdeaSubmitter = isOwner(user, idea);
  const isLead = isLeadership(user);
  return isQuestionAuthor || isIdeaSubmitter || isLead;
}

export function canReopenQuestion(user, question, idea) {
  return canResolveQuestion(user, question, idea);
}


