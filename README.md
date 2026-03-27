# ShowHQ

The operating system for production companies. Manage rehearsals, production schedules, floor plans, staffing, vendors, and event letters — all in one place.

## Architecture

ShowHQ is a **modular monolith** built with React + Vite + Tailwind CSS, backed by Supabase (Postgres + Auth + RLS). Each feature area lives in its own module folder under `src/modules/`, sharing a common shell, auth layer, and org context.

### Modules

| Module | Path | Status |
|---|---|---|
| Rehearsal (StagePilot) | `src/modules/rehearsal/` | Shell ready |
| Production Schedule | `src/modules/production/` | Shell ready |
| Floor Plans | `src/modules/floorplans/` | Shell ready |
| Event Letter | `src/modules/eventletter/` | Shell ready |
| Staffing | `src/modules/staffing/` | Shell ready |
| Vendors | `src/modules/vendors/` | Shell ready |

Modules can be toggled on/off per organization via org settings.

### Key directories

```
src/
  shell/        # Layout, sidebar, auth, org picker
  shared/       # Supabase client, auth hooks, module registry
  modules/      # Feature modules (one folder each)
  settings/     # Org-level module settings
```

## Getting started

```bash
# Install dependencies
npm install

# Start dev server (port 3001)
npm run dev

# Build for production
npm run build
```

### Environment variables (optional)

Copy `.env.example` to `.env` and fill in your values. The app ships with safe defaults pointing to the shared Supabase project.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment

Deployed via **Vercel**, connected to the `main` branch of this repo. Pushes to `main` trigger automatic builds.

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

## Tech stack

- **Frontend:** React 18, React Router 6, Tailwind CSS 3
- **Backend:** Supabase (Postgres 17, Auth, Row Level Security)
- **Build:** Vite 5
- **Hosting:** Vercel
