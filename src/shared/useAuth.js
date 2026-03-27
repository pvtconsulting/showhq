/**
 * useAuth — React hook for authentication state.
 * Returns { user, loading, signOut }.
 */
import { useState, useEffect, useCallback } from "react";
import { getSession, onAuthStateChange, signOut as apiSignOut } from "./supabase.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Clear stale auth tokens from URL hash (prevents 403 on reload)
      if (window.location.hash?.includes("access_token")) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    // Subscribe to auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (window.location.hash?.includes("access_token")) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
  }, []);

  return { user, loading, signOut: handleSignOut };
}
