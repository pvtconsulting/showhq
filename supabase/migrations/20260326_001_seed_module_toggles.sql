-- ShowHQ Module Toggles — Seed existing organizations
--
-- The organizations.settings JSONB column already exists.
-- This migration adds the default module config to existing orgs
-- that don't have one yet (all current StagePilot orgs).
--
-- New orgs created via ShowHQ will get this automatically via the app.
-- This migration is SAFE to run multiple times (idempotent).

UPDATE organizations
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{modules}',
  '{
    "rehearsal": { "enabled": true, "activated_at": "2026-03-26T00:00:00Z" },
    "production": { "enabled": false },
    "staffing": { "enabled": false },
    "vendors": { "enabled": false },
    "floorplans": { "enabled": false },
    "eventletter": { "enabled": false }
  }'::jsonb
)
WHERE settings IS NULL
   OR settings = '{}'::jsonb
   OR NOT (settings ? 'modules');
