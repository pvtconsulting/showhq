/**
 * ProductionPlaceholder — Placeholder for the Production Schedule module.
 * Phase 2a: Master timeline, run of show, daily calls, venue advance.
 */
import { ClipboardList } from "lucide-react";

export default function ProductionPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#7C3AED15" }}
        >
          <ClipboardList size={32} style={{ color: "#7C3AED" }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Production Schedule</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Day-of timeline, run of show, daily calls, venue advance, F&B, housing,
          transportation, security, and credentials.
        </p>
        <span className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
          Phase 2a — Coming soon
        </span>
      </div>
    </div>
  );
}
