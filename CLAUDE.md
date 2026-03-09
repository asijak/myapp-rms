# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Commands

**Backend** (`/server`):
```bash
cd server && npm run dev      # nodemon, port 4000
cd server && npm start        # production
```

**Frontend** (`/client`):
```bash
cd client && npm run dev      # Vite dev server, port 5173
cd client && npm run build    # production build
cd client && npm run format   # prettier
```

No monorepo root scripts — run commands inside `server/` or `client/` separately.

---

## Architecture Overview

### Monorepo Layout
```
myapp/
├── server/   Express + MongoDB (ES Modules, Node 18+)
└── client/   Vue 3 + Vite + Tailwind v4 (ES Modules)
```

### Backend
- **Entry**: `server/src/index.js` → connects MongoDB → seeds rubrics → starts Express
- **App**: `server/src/app.js` — CORS (CLIENT_URL), `express.json` 5 MB limit, cookie-parser, mongo-sanitize, Passport session
- **Auth base**: `/api/auth` (no `/v1`) — all other resources at `/api/v1/*`
- **Auth**: JWT in httpOnly cookie; Google OAuth via Passport (`/api/auth/google`)
- **RBAC**: `protect` middleware attaches `req.user` with populated roles; `requirePermission(perm)` checks `role.permissions[]`; `super_admin` role bypasses all permission checks
- **Validation**: Joi schemas in `validators/`, applied via `validate.middleware.js` with `stripUnknown: true` — **any field not in the schema is silently dropped**

### Frontend
- **Layouts**: `AdminLayout.vue` (SaaSSidebar + inline topbar) and `UserLayout.vue` (sticky header + KeepAlive RouterView). Auth pages are standalone.
- **Router guard** (`router/index.js`): enforces admin/user boundary strictly — admins are blocked from `/user/*` routes and vice versa.
- **Public vacancies**: `/vacancies` is a separate route (no auth) loading `user/Vacancies.vue` — avoids the admin router boundary.
- **State**: 5 Pinia stores — `auth`, `settings`, `notifications`, `roles`, `recruitment`. Auth store has `initialized` flag; always `await authStore.fetchCurrentUser()` before routing.
- **API client** (`api/axios.js`): `withCredentials: true`; 401 → logout + redirect to `/auth/login?session=expired`.

### Design System (non-negotiable)
- **Icons**: PrimeIcons ONLY (`pi pi-*`) — PrimeVue component library is NOT installed, only icons
- **Buttons**: use global CSS classes `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-gold`, `.btn-ghost` — never `bg-blue-600` or `bg-[var(--text-main)]`
- **No hardcoded colors**: use CSS variables exclusively (see below)
- **No `@apply`**: use utility classes or CSS variables directly in `style` blocks

**CSS Variables** (defined in `client/src/assets/main.css`):
```
--color-primary       #4A4D8F   Purple Navy (buttons, active states)
--color-primary-dark  #3B3E75   hover
--color-primary-light #EDEDF8   tinted bg
--color-primary-ring  #5B84BA   focus rings
--color-navy          #001F3F   sidebar, headers
--color-gold          #EFBF04   accents
--surface             #ffffff
--bg-app              #F0F2F7
--border-main         #DDE1EC
--text-main           #001F3F
--text-sub            #36454F
--text-muted          #607080
--text-faint          #9DAABB
```
**Undefined variables** (do not use): `--surface-2`, `--border-strong`, `--border-subtle` — use `--surface`/`--bg-app` and `--border-main` instead.

**Global CSS classes**: `.animate-fade-in-up`, `.animate-fade-in`, `.animate-zoom-in`, `.animate-slide-down`, `.page-fade-enter/leave`, `.custom-scrollbar`, `.btn-*`, `.input`, `.field`, `.badge`, `.card`, `.card-raised`, `.th`, `.td`, `.tr-hover`, `.tr-selected`

### Key Data Models
- **Application statuses**: `applied → verifying → comparative_assessment → ranked → disqualified | appointed`
- **Job statuses**: `draft → published → closed → archived`
- **Hiring tracks**: `teaching | teaching_related | non_teaching`
- **User**: stores `bio` and `links {facebook,linkedin,twitter}` — NOT in Profile model
- **Profile**: CS Form 212 data (name, education, eligibility, experience, training, family, etc.)
- **Application.applicantData**: snapshot of PDS at submission time (not live profile data)
- **Rubric field**: `track` (not `category`)

### UI Components
All reusable UI components are in `client/src/components/ui/` and exported from `index.js`:
`AppButton`, `AppBadge`, `AppModal`, `AppInput`, `AppSelect`, `AppTextarea`, `AppTableReport`, `AppPageHeader`, `AppDataTable`, `AppDrawer`, `AppTabs`, `AppAlert`, `AppCard`, `AppAvatar`, `AppSpinner`, `AppSkeleton`, `AppToaster`, `AppToast`, `AppPagination`, `AppDropdown`, `AppBreadcrumb`, `AppTooltip`, `AppDivider`, `AppCheckbox`, `AppRadio`, `AppSwitch`, `EmptyState`, `StatCard`

`AppBadge` covers all status variants: `applied`, `verifying`, `comparative_assessment`, `ranked`, `disqualified`, `appointed`, `draft`, `published`, `closed`, `archived`

### Global Directives (registered in `main.js`)
- `v-can="'permission_name'"` — hides element if user lacks permission (reactive)
- `v-role="'role_name'"` — hides element if user lacks role (reactive)
- `v-click-outside="callback"` — fires callback on outside click
- `$toast` (inject) — SweetAlert2 toast mixin (top-end, 3s)
- `$swal` (inject) — full SweetAlert2 instance

### KeepAlive + onActivated
`UserLayout.vue` wraps `<RouterView>` in `<KeepAlive>`. All `/user/*` pages must implement **both** `onMounted` and `onActivated` for data fetching, or data won't refresh when navigating back to a cached page.

### Known Gotchas
- Joi `stripUnknown: true` silently drops any field not in the schema — always add new Job fields to both `jobSchema` and `jobUpdateSchema` in `job.validator.js`
- Smart/curly quotes (`"` `"`) in `.vue` files break Vite — always use straight ASCII quotes
- `pdfmake`: use `require('pdfmake/js/Printer').default` (browser bundle) — not the default import
- `AdminTopbar.vue` and `AdminSidebar.vue` are legacy and NOT used — `SaaSSidebar.vue` is the active admin sidebar
- `/user/notifications` route does NOT exist — do not link to it
- `statusConfig` in `statusColors.js` maps `comparative_assessment` → label `"Verified"` (not "Comparative Assessment")
