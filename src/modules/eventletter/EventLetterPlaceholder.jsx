/**
 * EventLetterPlaceholder — Placeholder for the Event Letter module.
 * Phase 4: Auto-compiled advance document with compliance templates.
 */
import { FileText } from "lucide-react";

export default function EventLetterPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#0891B215" }}
        >
          <FileText size={32} style={{ color: "#0891B2" }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Event Letter</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Auto-compiled advance document pulling data from all modules, with
          SAG/union/venue compliance templates and audience-filtered versions.
        </p>
        <span className="inline-flex items-center px-3 py-1.5 bg-cyan-50 text-cyan-700 text-xs font-medium rounded-full border border-cyan-200">
          Phase 4 — Coming soon
        </span>
      </div>
    </div>
  );
}
