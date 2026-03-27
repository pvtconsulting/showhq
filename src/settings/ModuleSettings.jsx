/**
 * ModuleSettings — Admin UI for toggling modules on/off.
 *
 * Only visible to org owners and admins. Each module shows as a card
 * with a toggle switch. Toggling updates org.settings.modules in
 * Supabase and the sidebar updates immediately.
 */
import { useState, useCallback } from "react";
import {
  Calendar, ClipboardList, Users, Truck, Map, FileText,
  Loader2, Check, AlertCircle,
} from "lucide-react";
import { useOrg } from "../shell/OrgProvider.jsx";
import { MODULE_REGISTRY } from "../shared/modules.js";

const ICON_MAP = { Calendar, ClipboardList, Users, Truck, Map, FileText };

/** Toggle switch component */
function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
        enabled ? "bg-brand-500" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/** Single module card with toggle */
function ModuleCard({ moduleKey, moduleInfo }) {
  const { currentOrg, toggleModule } = useOrg();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const modules = currentOrg?.settings?.modules || {};
  const isEnabled = modules[moduleKey]?.enabled === true;
  const activatedAt = modules[moduleKey]?.activated_at;

  const Icon = ICON_MAP[moduleInfo.icon] || FileText;

  const handleToggle = useCallback(
    async (newValue) => {
      setSaving(true);
      setError("");
      const { error: err } = await toggleModule(moduleKey, newValue);
      if (err) setError(err);
      setSaving(false);
    },
    [moduleKey, toggleModule],
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${moduleInfo.color}15` }}
          >
            <Icon size={20} style={{ color: moduleInfo.color }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900">{moduleInfo.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {moduleInfo.description}
            </p>
            {isEnabled && activatedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Activated {new Date(activatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}
          <Toggle enabled={isEnabled} onChange={handleToggle} disabled={saving} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-xs text-red-600">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}

export default function ModuleSettings() {
  const { currentOrg, currentRole } = useOrg();
  const isAdmin = currentRole === "owner" || currentRole === "admin";

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <AlertCircle size={32} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access restricted</h2>
        <p className="text-sm text-gray-500">
          Only organization owners and admins can manage module settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage modules for {currentOrg?.name}. Enable or disable modules to customize
          your workspace.
        </p>
      </div>

      {/* Module toggles */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Modules</h2>
        {Object.entries(MODULE_REGISTRY).map(([key, info]) => (
          <ModuleCard key={key} moduleKey={key} moduleInfo={info} />
        ))}
      </div>

      {/* Org info */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Organization</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name</span>
              <p className="font-medium text-gray-900 mt-0.5">{currentOrg?.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Slug</span>
              <p className="font-medium text-gray-900 mt-0.5">{currentOrg?.slug}</p>
            </div>
            <div>
              <span className="text-gray-500">Your role</span>
              <p className="font-medium text-gray-900 mt-0.5 capitalize">{currentRole}</p>
            </div>
            <div>
              <span className="text-gray-500">Created</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {currentOrg?.created_at
                  ? new Date(currentOrg.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
