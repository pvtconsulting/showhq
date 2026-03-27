/**
 * FloorPlansPlaceholder — Placeholder for the Floor Plans module.
 * Phase 3: Version control, approval workflow, distribution tracking.
 */
import { Map } from "lucide-react";

export default function FloorPlansPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#DC262615" }}
        >
          <Map size={32} style={{ color: "#DC2626" }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Floor Plans</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Version control for technical drawings with approval workflow and
          distribution tracking. TDs upload, producers approve, everyone stays current.
        </p>
        <span className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
          Phase 3 — Coming soon
        </span>
      </div>
    </div>
  );
}
