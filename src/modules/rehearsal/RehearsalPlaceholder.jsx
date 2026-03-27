/**
 * RehearsalPlaceholder — Placeholder for the StagePilot module.
 *
 * In Phase 1, this will be replaced with the actual StagePilot code
 * migrated from rehearsal-command-deploy/. For now, it shows a
 * placeholder indicating the module is ready to be populated.
 */
import { Calendar, ExternalLink } from "lucide-react";

export default function RehearsalPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#2563EB15" }}
        >
          <Calendar size={32} style={{ color: "#2563EB" }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">StagePilot</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Rehearsal scheduling, speaker booking, and slot management.
          This module will be migrated from the standalone StagePilot app in Phase 1.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200">
          <ExternalLink size={14} />
          Currently running at stagepilot.ai
        </div>
      </div>
    </div>
  );
}
