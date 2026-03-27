/**
 * OrgPicker — Full-screen org selection for users with multiple orgs
 * or when no org is selected yet.
 */
import { Building2, ChevronRight } from "lucide-react";
import { useOrg } from "./OrgProvider.jsx";

export default function OrgPicker() {
  const { orgs, selectOrg } = useOrg();

  if (orgs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-shell-bg">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-brand-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No organizations yet</h1>
          <p className="text-sm text-gray-500 mb-6">
            You're not a member of any organization. Create one to get started, or ask
            your team admin to invite you.
          </p>
          {/* TODO: Add "Create Organization" flow in Phase 1 */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-shell-bg">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Welcome to ShowHQ</h1>
          <p className="text-sm text-gray-500 mt-1">Select an organization to continue</p>
        </div>

        <div className="space-y-2">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => selectOrg(org)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{org.name}</div>
                <div className="text-xs text-gray-500 capitalize">{org.role}</div>
              </div>
              <ChevronRight
                size={16}
                className="text-gray-400 group-hover:text-brand-500 transition-colors shrink-0"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
