// Roles in one place. Version 1 has three. Phase 2 adds Approver, Execution lead, Team and Leadership:
// add them here with a rank, then use hasRole() in permissions.js.
export const ROLES = {
  associate: { label: 'Associate', rank: 1 },
  reviewer: { label: 'Reviewer', rank: 2 },
  admin: { label: 'Admin', rank: 3 },
};

export function hasRole(user, minRole) {
  if (!user) return false;
  const have = ROLES[user.role]?.rank ?? 0;
  return have >= (ROLES[minRole]?.rank ?? Infinity);
}
