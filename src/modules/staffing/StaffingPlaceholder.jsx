/**
 * StaffingPlaceholder — Placeholder for the Staffing & Crew module.
 * Phase 2b: Crew pool, event rosters, time tracking, labor rules.
 */
import { Users } from "lucide-react";

export default function StaffingPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#05966915" }}
        >
          <Users size={32} style={{ color: "#059669" }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Staffing & Crew</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Org-wide crew pool, event rosters, time tracking, labor rules, and OT/penalty auto-calc.
        </p>
        <span className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
          Phase 2b — Coming soon
        </span>
      </div>
    </div>
  );
}
