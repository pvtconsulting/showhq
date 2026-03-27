/**
 * Module registry — single source of truth for all ShowHQ modules.
 *
 * Each module has a key (used in org.settings.modules), a display name,
 * an icon name (lucide-react), a route path, and a description.
 *
 * The shell reads this registry to build nav, routes, and settings UI.
 * Adding a new module = one entry here + a component in modules/.
 */

export const MODULE_REGISTRY = {
  rehearsal: {
    key: "rehearsal",
    name: "StagePilot",
    description: "Rehearsal scheduling, speaker booking, slot management",
    icon: "Calendar",
    path: "/rehearsal",
    color: "#2563EB", // StagePilot blue
    phase: 1,
  },
  production: {
    key: "production",
    name: "Production",
    description: "Day-of timeline, run of show, daily calls, venue advance",
    icon: "ClipboardList",
    path: "/production",
    color: "#7C3AED", // Purple
    phase: 2,
  },
  staffing: {
    key: "staffing",
    name: "Staffing",
    description: "Crew pool, event rosters, time tracking, labor rules",
    icon: "Users",
    path: "/staffing",
    color: "#059669", // Green
    phase: 2,
  },
  vendors: {
    key: "vendors",
    name: "Vendors",
    description: "Vendor directory, compliance, scopes, POs, vendor portal",
    icon: "Truck",
    path: "/vendors",
    color: "#D97706", // Amber
    phase: 2,
  },
  floorplans: {
    key: "floorplans",
    name: "Floor Plans",
    description: "Version control, approval workflow, distribution tracking",
    icon: "Map",
    path: "/floor-plans",
    color: "#DC2626", // Red
    phase: 3,
  },
  eventletter: {
    key: "eventletter",
    name: "Event Letter",
    description: "Auto-compiled advance document with compliance templates",
    icon: "FileText",
    path: "/event-letter",
    color: "#0891B2", // Cyan
    phase: 4,
  },
};

/**
 * Returns the list of enabled modules for an org, based on its settings.
 * Falls back to { rehearsal: enabled } if no settings exist (StagePilot-only org).
 */
export function getEnabledModules(orgSettings) {
  const defaults = getDefaultModules();
  const modules = orgSettings?.modules || defaults;
  return Object.entries(MODULE_REGISTRY)
    .filter(([key]) => modules[key]?.enabled)
    .map(([, mod]) => mod);
}

/**
 * Check if a specific module is enabled for the current org.
 */
export function isModuleEnabled(orgSettings, moduleKey) {
  const defaults = getDefaultModules();
  const modules = orgSettings?.modules || defaults;
  return modules[moduleKey]?.enabled === true;
}

/**
 * Returns the default modules object for a new org.
 * All modules enabled by default — orgs can disable what they don't need.
 */
export function getDefaultModules() {
  const now = new Date().toISOString();
  return {
    rehearsal: { enabled: true, activated_at: now },
    production: { enabled: true, activated_at: now },
    staffing: { enabled: true, activated_at: now },
    vendors: { enabled: true, activated_at: now },
    floorplans: { enabled: true, activated_at: now },
    eventletter: { enabled: true, activated_at: now },
  };
}
