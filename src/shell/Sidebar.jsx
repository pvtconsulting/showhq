/**
 * Sidebar — ShowHQ shell navigation.
 *
 * Renders the org switcher, event selector, and module navigation
 * based on which modules are enabled for the current org.
 *
 * Design: dark sidebar (slate-900), matching StagePilot's aesthetic.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar, ClipboardList, Users, Truck, Map, FileText,
  Settings, LogOut, ChevronDown, Building2, Check,
  LayoutDashboard, ChevronsUpDown, ChevronRight,
} from "lucide-react";
import { useOrg } from "./OrgProvider.jsx";

// Map icon names from module registry to actual Lucide components
const ICON_MAP = {
  Calendar,
  ClipboardList,
  Users,
  Truck,
  Map,
  FileText,
  LayoutDashboard,
};

/** Compact org/event switcher at the top of the sidebar */
function OrgSwitcher() {
  const { orgs, currentOrg, selectOrg, events, currentEvent, selectEvent } = useOrg();
  const [orgOpen, setOrgOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const orgRef = useRef(null);
  const eventRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (orgRef.current && !orgRef.current.contains(e.target)) setOrgOpen(false);
      if (eventRef.current && !eventRef.current.contains(e.target)) setEventOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="px-3 py-4 border-b border-white/10">
      {/* Org picker */}
      <div ref={orgRef} className="relative mb-2">
        <button
          onClick={() => setOrgOpen(!orgOpen)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          <Building2 size={16} className="text-brand-400 shrink-0" />
          <span className="text-sm font-medium text-white truncate flex-1">
            {currentOrg?.name || "Select org..."}
          </span>
          <ChevronsUpDown size={14} className="text-gray-500 shrink-0" />
        </button>

        {orgOpen && orgs.length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => { selectOrg(org); setOrgOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-left"
              >
                <span className="truncate flex-1">{org.name}</span>
                {org.id === currentOrg?.id && (
                  <Check size={14} className="text-brand-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Event picker */}
      {currentOrg && (
        <div ref={eventRef} className="relative">
          <button
            onClick={() => setEventOpen(!eventOpen)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <Calendar size={14} className="text-gray-500 shrink-0" />
            <span className="text-xs text-gray-400 truncate flex-1">
              {currentEvent?.name || "Select event..."}
            </span>
            <ChevronDown size={12} className="text-gray-600 shrink-0" />
          </button>

          {eventOpen && events.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
              {events.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => { selectEvent(evt); setEventOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <span className="truncate flex-1">{evt.name}</span>
                  {evt.id === currentEvent?.id && (
                    <Check size={14} className="text-brand-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Single nav item in the sidebar */
function NavItem({ to, label, icon: Icon, color, isActive }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        isActive
          ? "bg-white/10 text-white font-medium"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon
        size={18}
        style={isActive ? { color } : undefined}
        className={isActive ? "" : "text-gray-500"}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function Sidebar({ onSignOut }) {
  const { enabledModules, currentOrg, currentRole } = useOrg();
  const location = useLocation();

  const isAdmin = currentRole === "owner" || currentRole === "admin";

  return (
    <aside className="w-60 h-screen bg-shell-sidebar flex flex-col shrink-0 border-r border-white/5">
      {/* Logo / Brand */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">ShowHQ</span>
      </div>

      {/* Org + Event Switcher */}
      <OrgSwitcher />

      {/* Module Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* Dashboard (always visible when an org is selected) */}
        {currentOrg && (
          <NavItem
            to="/"
            label="Dashboard"
            icon={LayoutDashboard}
            color="#6366F1"
            isActive={location.pathname === "/"}
          />
        )}

        {/* Enabled modules */}
        {enabledModules.map((mod) => {
          const Icon = ICON_MAP[mod.icon] || FileText;
          const isActive = location.pathname.startsWith(mod.path);

          return (
            <NavItem
              key={mod.key}
              to={mod.path}
              label={mod.name}
              icon={Icon}
              color={mod.color}
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
        {isAdmin && (
          <NavItem
            to="/settings"
            label="Settings"
            icon={Settings}
            color="#94A3B8"
            isActive={location.pathname.startsWith("/settings")}
          />
        )}
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors text-left"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
