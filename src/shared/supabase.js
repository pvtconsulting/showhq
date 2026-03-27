/**
 * Supabase client — single instance shared across ShowHQ.
 *
 * Uses the publishable (anon) key which is safe to ship in client code.
 * Row Level Security policies on the database enforce access control.
 *
 * Env vars are read from Vite's import.meta.env at build time.
 * Fallback values are the existing StagePilot project (same DB).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://uysvtgbnvfndpijdejdx.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c3Z0Z2JudmZuZHBpamRlamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTg4NTksImV4cCI6MjA4OTg3NDg1OX0.g_2An5qY93wG7P7ml3JT_BRvMkhtUCj7GsI3WIOOBEk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth helpers ─────────────────────────────────────

/** Get current session */
export const getSession = () => supabase.auth.getSession();

/** Subscribe to auth state changes */
export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange(callback);

/** Sign in with email + password */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/** Sign in with magic link */
export async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return { data, error };
}

/** Sign up with email + password */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  return { data, error };
}

/** Sign out */
export const signOut = () => supabase.auth.signOut();

// ── Organization queries ─────────────────────────────

/** Get all orgs the current user belongs to, with their role */
export async function getMyOrganizations() {
  const { data, error } = await supabase
    .from("org_members")
    .select(`
      role,
      organizations (
        id,
        name,
        slug,
        settings,
        created_at
      )
    `)
    .order("created_at", { foreignTable: "organizations", ascending: false });
  return { data, error };
}

/** Get events for a specific org */
export async function getEvents(orgId) {
  const { data, error } = await supabase
    .from("events")
    .select("*, venues(*)")
    .eq("org_id", orgId)
    .order("start_date", { ascending: false });
  return { data, error };
}

/** Get a single event by ID */
export async function getEvent(eventId) {
  const { data, error } = await supabase
    .from("events")
    .select("*, venues(*)")
    .eq("id", eventId)
    .single();
  return { data, error };
}

/** Update org settings (including module toggles) */
export async function updateOrgSettings(orgId, settings) {
  const { data, error } = await supabase
    .from("organizations")
    .update({ settings })
    .eq("id", orgId)
    .select()
    .single();
  return { data, error };
}
