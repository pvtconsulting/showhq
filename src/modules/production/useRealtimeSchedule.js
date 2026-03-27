/**
 * useRealtimeSchedule — Supabase Realtime subscription for schedule_items.
 *
 * Listens for INSERT, UPDATE, DELETE on schedule_items filtered by event_id.
 * Calls onUpdate() whenever a change is detected so the parent can reload data.
 */
import { useEffect, useRef } from "react";
import { supabase } from "../../shared/supabase.js";

/**
 * Subscribe to realtime changes on schedule_items for a given event.
 * @param {string} eventId - The event to watch
 * @param {function} onUpdate - Callback when any change occurs
 */
export function useRealtimeSchedule(eventId, onUpdate) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`schedule-items-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "schedule_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Debounce-style: call the latest callback
          callbackRef.current?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);
}
