# Spark (GWC Idea Center): front end, version 1

Phase 1 of the company flow: **Capture** (submit and track) and **Review** (screen, score, decide).
Backlog and tracker, showcase and leadership dashboards are Phase 2: nothing is built for them, and `routes.js` is where they plug in.

It runs on a **mock data layer** (in memory, resets on reload). No backend, no sign-in, no new dependencies.

## Run it

```
npm install
npm run dev        # open http://localhost:5173/ideas
npm run build
```

In development with the mock adapter, a **"Viewing as"** drop-down in the header switches between Public visitor, Associate, Reviewer and Admin. It is a demo tool: it is **not in production builds**.
To start a built or dev copy as a given role without the switcher: `VITE_MOCK_ROLE=public|associate|reviewer|admin`.

Mock details: email code is `123456`; a guest tracking link can be tried with the code `demo-needs-info-0012` (shown on the Track page in dev).

## Put it into the real site

1. Work on your own branch `<yourname>/idea-center`. **Never merge to `main`: a merge deploys the whole site to production.**
2. Copy only the folder `src/ideacenter/` into the real repo.
3. In `src/App.jsx` add two lines (and `lazy`, `Suspense` to the existing React import if missing):
   ```jsx
   const IdeaCenterApp = lazy(() => import('./ideacenter/IdeaCenterApp.jsx'));
   // ...first thing inside the App component:
   if (window.location.pathname.startsWith('/ideas')) return <Suspense fallback={null}><IdeaCenterApp /></Suspense>;
   ```
4. Make sure the host loads the **Montserrat** font. The module does not load fonts (no external calls). The stand-in host here uses the `@fontsource/montserrat` package, which is *not* part of this folder.
5. `lucide-react` is the only package the folder imports besides React. No Radix, no router, no other new dependency.
6. Run the host's own `npm run build` and lint before you open a pull request.

Optional: `<IdeaCenterApp theme="dark" />` follows the host's theme and hides Spark's own toggle. Without it, Spark keeps its own light/dark toggle (the only thing it stores in `localStorage`).

## Folder map

| Path | What it is |
|---|---|
| `IdeaCenterApp.jsx` | Root: wrapper `.spark-root`, theme, header, routes, toast, drawer |
| `lookups.js` | **All lists, limits and scoring settings** (statuses, categories, technology areas, reasons, stages, criteria and weights, 3.5 line, 14-day reply promise, ID prefix) |
| `roles.js`, `permissions.js` | Roles in one config; **every permission decision** in one file |
| `routes.js` | Route table (add Phase 2 pages here) |
| `api/ideaApi.js` | The single door for data. `VITE_IDEA_API=mock` (default) or `http` |
| `api/mockAdapter.js` | In-memory adapter that also plays the server's part (checks, IDs, rules) |
| `api/httpAdapter.js` | Calls the draft API contract. `VITE_IDEA_API_BASE` sets the base URL (default `/api`) |
| `api/auth.js` | Placeholder for the Microsoft (Entra ID) token. Not built |
| `pages/`, `components/`, `hooks/`, `lib/` | Screens, pieces, hooks (navigation, current user, async), helpers (ROI, scoring, dates, validation) |
| `ideacenter.css` | All styles, every rule scoped under `.spark-root`, every class starts with `sp-` |

## What follows the brief

- Roles: public visitor, associate, reviewer, admin. A public visitor can only submit and track their own idea by a private link, and can never browse other ideas.
- The CIO's ten fields in order, his exact category and technology lists. ROI is **optional**: investment, benefit, period (Annual, Monthly, One-time), confidence (Rough, Validated). The ROI turns the benefit into a yearly figure first (monthly x 12; one-time counted once and labelled "first year"). Nothing shows when investment is empty or zero.
- Public submission: email check with a six-digit code, a placeholder bot check (no third-party script), length limits, no uploads, privacy notice. Signed-in people get name and email read-only.
- Review: 4 criteria, equal weights, 1 to 5; "Recommended to approve" at a weighted score of 3.5 or more (advice only). Approve needs all scores and a next stage; Reject needs a reason and a note; Ask for more info needs a question; Move to build only from Approved; Mark delivered only from In build. History is append-only. Reply promise 14 days with badges (amber at 3 days or fewer, red overdue).
- Needs info loop: the submitter answers from the private tracking link (guest) or from My ideas (signed in); the idea returns to Under review.
- Dashboard (admin): ideas submitted, average days to first reply, waiting more than 14 days, not yet assigned, by stage, by category, by technology area, total entered benefit per year and how many ideas included one.
- Every list has loading, empty and error states. Votes update at once and roll back on failure. Details drawer traps focus, closes on Escape, and returns focus.
- Safety: all user text is rendered as plain text, no `dangerouslySetInnerHTML`, no analytics, no third-party scripts, no AI calls, no file uploads.

## Fixed from the prototype

Votes and ownership use user ids (not names). The idea ID is made by the data layer (the real server will make it). Ideas are not stored in the browser. The reviewer list comes from the data layer. The role switcher is dev-only. ROI annualises first. Kaizen leftovers are removed (type switch, type filter and its stray "+", dashboard counter, Kaizen seed items). "Signed in as" only shows when someone is signed in.

## Assumptions I made (please confirm; all easy to change)

1. **Sensitive-data question kept** (No / Yes / Not sure, optional, in "Additional details"): it is in the CIO prototype but not in the brief's field list. `permissions.canView` has a marked place for the "hide sensitive ideas" rule, which is **not decided**, so today every signed-in person can view every idea.
2. **"Recommended to approve" shows only when all four criteria are scored.** The brief does not say what to do with partial scores.
3. **Contact details** (email) are shown only to the assigned reviewer, admins and the submitter.
4. **Dashboard benefit total** adds yearly figures (monthly x 12, annual x 1, one-time x 1).
5. A reviewer sees only assigned ideas in the review queue and can only decide on those, as in the brief. (The rule "a reviewer who decides on an unassigned idea becomes its reviewer" is built in the mock but only an admin can reach unassigned ideas today.)
6. **Public "Employee or External"**: guests choose; signed-in people are Employee and read-only.
7. The mock's **reasons and stages** still include "Kaizen quick win" (kept until confirmed).
8. Idea ID format `IDEA-0001`, prefix in `lookups.js`.

## Draft API contract: two additions needed

The brief's contract has no step that swaps the emailed code for a verification token, and no signed-in reply endpoint. This code assumes:

- `POST /public/verify-code` with `{ email, code }` returns `{ verificationToken }`
- `POST /ideas/:id/reply` with `{ text }` (signed-in submitter answers a "Needs info" question)

Everything else follows section 6 of the brief. Lists return `voteCount` and `votedByMe` (never other people's votes), and never return tracking tokens.

## Open questions that change this code

- Are outside guests allowed at all? If **employees only**: delete `components/EmailVerify.jsx`, `components/BotCheck.jsx`, `pages/TrackPage.jsx` and the public branches in `SubmitPage.jsx`, `routes.js`, `Header.jsx`. That is the whole change.
- The 5 scoring criteria and weights: edit `SCORING_CRITERIA` in `lookups.js` only.
- Field 10 (ROI): the CIO's message is cut off. If it becomes required, only the validation in `lib/validate.js` changes.

## Checked

`npm run build` passes; `eslint` is clean; no console errors across all roles; screenshots in `screenshots/` (light and dark). Role switcher and mock hints are absent from the production bundle.
