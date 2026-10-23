// Route table for Spark Ideas & Innovation Platform.
// Supports role-based routes for Employee and Leadership workspaces.

export const ROUTES = [
  // Welcome and Role Selection Page (Default entry point)
  { match: '/', page: 'welcome', guard: () => true },

  // Employee Workspace
  { match: '/employee', page: 'employeeHome', guard: () => true },
  { match: '/employee/ideas', page: 'employeeIdeas', guard: () => true },
  { match: '/employee/submit', page: 'employeeSubmit', guard: () => true },
  { match: '/employee/my-ideas', page: 'employeeMine', guard: () => true },

  // Leadership Workspace
  { match: '/admin', page: 'adminDashboard', guard: () => true },
  { match: '/admin/ideas', page: 'adminIdeasView', guard: () => true },
  { match: '/admin/ideas/:filter', page: 'adminIdeasView', guard: () => true },
  { match: '/admin/ideas-view/:filter', page: 'adminIdeasView', guard: () => true },
  { match: '/admin/ideas-view', page: 'adminIdeasView', guard: () => true },
  { match: '/admin/review', page: 'adminReview', guard: () => true },
  { match: '/admin/manage', page: 'adminManage', guard: () => true },

  // Backward-compatible Aliases
  { match: '/browse', page: 'employeeIdeas', guard: () => true },
  { match: '/submit', page: 'employeeSubmit', guard: () => true },
  { match: '/mine', page: 'employeeMine', guard: () => true },
  { match: '/employee/mine', page: 'employeeMine', guard: () => true },
  { match: '/review', page: 'adminReview', guard: () => true },
  { match: '/dashboard', page: 'adminDashboard', guard: () => true },
  { match: '/submitted', page: 'submitted', guard: () => true },
  { match: '/track', page: 'track', guard: () => true },
  { match: '/track/:token', page: 'trackDetail', guard: () => true },
];

export function resolveRoute(path) {
  for (const r of ROUTES) {
    const a = r.match.split('/').filter(Boolean);
    const b = path.split('/').filter(Boolean);
    if (a.length !== b.length) continue;
    const params = {};
    if (a.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(b[i])), true) : seg === b[i]))) {
      return { ...r, params };
    }
  }
  return null;
}
