/**
 * production-queries.js — Supabase queries for the Production Schedule module.
 *
 * All queries are scoped by event_id. RLS policies enforce org-level access.
 */
import { supabase } from "../../shared/supabase.js";

// ── Schedule (container) ─────────────────────────────

/** Get or create the production schedule for an event */
export async function getOrCreateSchedule(eventId, orgId, userId) {
  // Try to fetch existing schedule
  const { data: existing, error: fetchErr } = await supabase
    .from("production_schedules")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (fetchErr) return { data: null, error: fetchErr };
  if (existing) return { data: existing, error: null };

  // Create new schedule
  const { data, error } = await supabase
    .from("production_schedules")
    .insert({
      event_id: eventId,
      org_id: orgId,
      created_by: userId,
    })
    .select()
    .single();

  return { data, error };
}

// ── Schedule Items (tasks) ───────────────────────────

/** Get all schedule items for an event, optionally filtered */
export async function getScheduleItems(eventId, filters = {}) {
  let query = supabase
    .from("schedule_items")
    .select("*, rooms(name)")
    .eq("event_id", eventId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filters.date) query = query.eq("date", filters.date);
  if (filters.department) query = query.eq("department", filters.department);
  if (filters.phase) query = query.eq("phase", filters.phase);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  return { data, error };
}

/** Create a new schedule item */
export async function createScheduleItem(item) {
  const { data, error } = await supabase
    .from("schedule_items")
    .insert(item)
    .select("*, rooms(name)")
    .single();
  return { data, error };
}

/** Update a schedule item */
export async function updateScheduleItem(id, updates) {
  const { data, error } = await supabase
    .from("schedule_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, rooms(name)")
    .single();
  return { data, error };
}

/** Delete a schedule item */
export async function deleteScheduleItem(id) {
  const { error } = await supabase
    .from("schedule_items")
    .delete()
    .eq("id", id);
  return { error };
}

// ── Milestones ───────────────────────────────────────

/** Get milestones for an event */
export async function getMilestones(eventId) {
  const { data, error } = await supabase
    .from("schedule_milestones")
    .select("*")
    .eq("event_id", eventId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  return { data, error };
}

/** Create a milestone */
export async function createMilestone(milestone) {
  const { data, error } = await supabase
    .from("schedule_milestones")
    .insert(milestone)
    .select()
    .single();
  return { data, error };
}

/** Delete a milestone */
export async function deleteMilestone(id) {
  const { error } = await supabase
    .from("schedule_milestones")
    .delete()
    .eq("id", id);
  return { error };
}

// ── Daily Calls ──────────────────────────────────────

/** Get or create the daily call for a schedule + date */
export async function getOrCreateDailyCall(scheduleId, eventId, date) {
  const { data: existing, error: fetchErr } = await supabase
    .from("daily_calls")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("date", date)
    .maybeSingle();

  if (fetchErr) return { data: null, error: fetchErr };
  if (existing) return { data: existing, error: null };

  // Create with sensible defaults
  const { data, error } = await supabase
    .from("daily_calls")
    .insert({
      schedule_id: scheduleId,
      event_id: eventId,
      date,
      general_call: "07:00",
      estimated_wrap: "18:00",
    })
    .select()
    .single();

  return { data, error };
}

/** Update a daily call */
export async function updateDailyCall(id, updates) {
  const { data, error } = await supabase
    .from("daily_calls")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

// ── Rooms ────────────────────────────────────────────

/** Get active rooms for an event (via event_rooms join) */
export async function getEventRooms(eventId) {
  const { data, error } = await supabase
    .from("event_rooms")
    .select("room_id, rooms(id, name, capacity)")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return { data: data?.map((er) => er.rooms) || [], error };
}

/** Get StagePilot rehearsal slots for an event (read-only) */
export async function getRehearsalSlots(eventId) {
  const { data, error } = await supabase
    .from("slots")
    .select("id, date, start_time, duration, status, room_id, bookings(session_id, sessions(title))")
    .eq("event_id", eventId)
    .neq("status", "blocked")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  return { data, error };
}

// ── Constants ────────────────────────────────────────

export const PHASES = [
  { value: "advance", label: "Advance", color: "#6B7280" },
  { value: "load_in", label: "Load-In", color: "#D97706" },
  { value: "setup", label: "Setup", color: "#2563EB" },
  { value: "rehearsal", label: "Rehearsal", color: "#6366F1" },
  { value: "show", label: "Show", color: "#059669" },
  { value: "teardown", label: "Teardown", color: "#DC2626" },
  { value: "load_out", label: "Load-Out", color: "#9333EA" },
];

export const DEPARTMENTS = [
  { value: "production", label: "Production", color: "#1E40AF" },
  { value: "staging", label: "Staging", color: "#7C3AED" },
  { value: "audio", label: "Audio", color: "#059669" },
  { value: "video", label: "Video", color: "#0891B2" },
  { value: "lighting", label: "Lighting", color: "#D97706" },
  { value: "rigging", label: "Rigging", color: "#DC2626" },
  { value: "scenic", label: "Scenic", color: "#DB2777" },
  { value: "effects", label: "Effects", color: "#7C3AED" },
  { value: "electrical", label: "Electrical", color: "#CA8A04" },
  { value: "safety", label: "Safety", color: "#EF4444" },
  { value: "catering", label: "Catering", color: "#16A34A" },
  { value: "logistics", label: "Logistics", color: "#6366F1" },
  { value: "security", label: "Security", color: "#475569" },
  { value: "client", label: "Client", color: "#0284C7" },
  { value: "venue", label: "Venue", color: "#64748B" },
  { value: "other", label: "Other", color: "#94A3B8" },
];

export const STATUSES = [
  { value: "planned", label: "Planned", color: "#6B7280" },
  { value: "in_progress", label: "In Progress", color: "#2563EB" },
  { value: "completed", label: "Completed", color: "#059669" },
  { value: "delayed", label: "Delayed", color: "#DC2626" },
  { value: "cancelled", label: "Cancelled", color: "#94A3B8" },
  { value: "on_hold", label: "On Hold", color: "#D97706" },
];
