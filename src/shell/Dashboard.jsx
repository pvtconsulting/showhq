/**
 * Dashboard — ShowHQ home view.
 *
 * Shows the current event summary and quick-access cards
 * for each enabled module. Acts as the hub of the platform.
 */
import { useNavigate } from "react-router-dom";
import {
  Calendar, ClipboardList, Users, Truck, Map, FileText,
  ArrowRight, AlertCircle,
} from "lucide-react";
import { useOrg } from "./OrgProvider.jsx";

const ICON_MAP = { Calendar, ClipboardList, Users, Truck, Map, FileText };

/** Format a date string to a readable format */
function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { currentOrg, currentEvent, enabledModules, events } = useOrg();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {currentOrg?.name || "Dashboard"}
        </h1>
        {currentEvent ? (
          <p className="text-sm text-gray-500 mt-1">
            {currentEvent.name} — {fmtDate(currentEvent.start_date)} to{" "}
            {fmtDate(currentEvent.end_date)}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            {events.length > 0
              ? "Select an event from the sidebar to get started"
              : "No events yet — create one to get started"}
          </p>
        )}
      </div>

      {/* Event info card */}
      {currentEvent && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{currentEvent.name}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-500">
                <span>Show: {fmtDate(currentEvent.start_date)} – {fmtDate(currentEvent.end_date)}</span>
                {currentEvent.load_in_date && (
                  <span>Load-in: {fmtDate(currentEvent.load_in_date)}</span>
                )}
                {currentEvent.load_out_date && (
                  <span>Load-out: {fmtDate(currentEvent.load_out_date)}</span>
                )}
              </div>
              {currentEvent.venues && (
                <div className="text-sm text-gray-500 mt-1">
                  {currentEvent.venues.name}{currentEvent.venues.city ? `, ${currentEvent.venues.city}` : ""}
                </div>
              )}
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-700 capitalize">
              {currentEvent.status || "active"}
            </span>
          </div>
        </div>
      )}

      {/* No event selected warning */}
      {!currentEvent && events.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <AlertCircle size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            Select an event from the sidebar to see module data and start working.
          </p>
        </div>
      )}

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledModules.map((mod) => {
          const Icon = ICON_MAP[mod.icon] || FileText;

          return (
            <button
              key={mod.key}
              onClick={() => navigate(mod.path)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left hover:border-gray-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${mod.color}15` }}
                >
                  <Icon size={18} style={{ color: mod.color }} />
                </div>
                <h3 className="text-sm font-medium text-gray-900">{mod.name}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{mod.description}</p>
              <div className="flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:text-brand-700 transition-colors">
                Open
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
