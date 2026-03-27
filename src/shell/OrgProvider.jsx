/**
 * OrgProvider — React context providing org, event, and module state
 * to the entire ShowHQ shell.
 *
 * This is the central nervous system of ShowHQ. Every component can
 * access the current org, selected event, enabled modules, and the
 * user's role within the org.
 *
 * State is persisted to localStorage so the user returns to their
 * last-used org and event on reload.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getMyOrganizations, getEvents, updateOrgSettings } from "../shared/supabase.js";
import { getEnabledModules, isModuleEnabled, MODULE_REGISTRY } from "../shared/modules.js";

const OrgContext = createContext(null);

const STORAGE_KEY = "showhq_context";

/** Read persisted org/event IDs from localStorage */
function loadPersistedContext() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist current org/event IDs to localStorage */
function persistContext(orgId, eventId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ orgId, eventId }));
  } catch {
    // localStorage not available — silently continue
  }
}

export function OrgProvider({ user, children }) {
  // ── Org list ──
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // ── Selected org ──
  const [currentOrg, setCurrentOrg] = useState(null);
  const [currentRole, setCurrentRole] = useState(null); // 'owner' | 'admin' | 'member'

  // ── Events for current org ──
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // ── Selected event ──
  const [currentEvent, setCurrentEvent] = useState(null);

  // ── Load orgs on mount ──
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setOrgsLoading(true);

    getMyOrganizations().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load organizations:", error.message);
        setOrgsLoading(false);
        return;
      }

      const orgList = (data || []).map((row) => ({
        ...row.organizations,
        role: row.role,
      }));
      setOrgs(orgList);
      setOrgsLoading(false);

      // Restore persisted org selection (or pick the first one)
      const persisted = loadPersistedContext();
      const match = orgList.find((o) => o.id === persisted?.orgId);
      if (match) {
        setCurrentOrg(match);
        setCurrentRole(match.role);
      } else if (orgList.length === 1) {
        setCurrentOrg(orgList[0]);
        setCurrentRole(orgList[0].role);
      }
    });

    return () => { cancelled = true; };
  }, [user]);

  // ── Load events when org changes ──
  useEffect(() => {
    if (!currentOrg) {
      setEvents([]);
      setCurrentEvent(null);
      return;
    }

    let cancelled = false;
    setEventsLoading(true);

    getEvents(currentOrg.id).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load events:", error.message);
        setEventsLoading(false);
        return;
      }

      setEvents(data || []);
      setEventsLoading(false);

      // Restore persisted event or pick the first one
      const persisted = loadPersistedContext();
      const match = (data || []).find((e) => e.id === persisted?.eventId);
      if (match) {
        setCurrentEvent(match);
      } else if (data?.length === 1) {
        setCurrentEvent(data[0]);
      } else {
        setCurrentEvent(null);
      }
    });

    return () => { cancelled = true; };
  }, [currentOrg]);

  // ── Persist on change ──
  useEffect(() => {
    if (currentOrg) {
      persistContext(currentOrg.id, currentEvent?.id || null);
    }
  }, [currentOrg, currentEvent]);

  // ── Derived: enabled modules for current org ──
  const enabledModules = useMemo(
    () => getEnabledModules(currentOrg?.settings),
    [currentOrg?.settings],
  );

  /** Check if a specific module is enabled */
  const checkModule = useCallback(
    (moduleKey) => isModuleEnabled(currentOrg?.settings, moduleKey),
    [currentOrg?.settings],
  );

  // ── Actions ──

  /** Switch to a different org */
  const selectOrg = useCallback((org) => {
    setCurrentOrg(org);
    setCurrentRole(org.role);
    setCurrentEvent(null); // Reset event when switching orgs
  }, []);

  /** Switch to a different event */
  const selectEvent = useCallback((event) => {
    setCurrentEvent(event);
  }, []);

  /** Toggle a module on or off for the current org */
  const toggleModule = useCallback(
    async (moduleKey, enabled) => {
      if (!currentOrg) return { error: "No org selected" };

      // Validate module key exists in registry
      if (!MODULE_REGISTRY[moduleKey]) {
        return { error: `Unknown module: ${moduleKey}` };
      }

      // Build updated settings
      const currentSettings = currentOrg.settings || {};
      const currentModules = currentSettings.modules || {};
      const existingModuleData = currentModules[moduleKey] || {};
      const updatedModules = {
        ...currentModules,
        [moduleKey]: {
          ...existingModuleData,
          enabled,
          ...(enabled && !existingModuleData.activated_at
            ? { activated_at: new Date().toISOString() }
            : {}),
        },
      };

      const updatedSettings = { ...currentSettings, modules: updatedModules };
      const { data, error } = await updateOrgSettings(currentOrg.id, updatedSettings);

      if (error) {
        console.error("Failed to toggle module:", error.message);
        return { error: error.message };
      }

      // Update local state so UI reacts immediately
      setCurrentOrg((prev) => ({ ...prev, settings: data.settings }));

      // Also update the org in the orgs list
      setOrgs((prev) =>
        prev.map((o) => (o.id === currentOrg.id ? { ...o, settings: data.settings } : o)),
      );

      return { data };
    },
    [currentOrg],
  );

  /** Refresh org data (e.g., after settings change elsewhere) */
  const refreshOrg = useCallback(async () => {
    if (!user) return;
    const { data } = await getMyOrganizations();
    if (data) {
      const orgList = data.map((row) => ({
        ...row.organizations,
        role: row.role,
      }));
      setOrgs(orgList);

      // Update current org if it exists in the new list
      if (currentOrg) {
        const updated = orgList.find((o) => o.id === currentOrg.id);
        if (updated) {
          setCurrentOrg(updated);
          setCurrentRole(updated.role);
        }
      }
    }
  }, [user, currentOrg]);

  const value = useMemo(
    () => ({
      // Org state
      orgs,
      orgsLoading,
      currentOrg,
      currentRole,
      selectOrg,
      refreshOrg,

      // Event state
      events,
      eventsLoading,
      currentEvent,
      selectEvent,

      // Module state
      enabledModules,
      checkModule,
      toggleModule,
    }),
    [
      orgs, orgsLoading, currentOrg, currentRole, selectOrg, refreshOrg,
      events, eventsLoading, currentEvent, selectEvent,
      enabledModules, checkModule, toggleModule,
    ],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/** Hook to access org context. Throws if used outside OrgProvider. */
export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return ctx;
}
