/**
 * VendorsPlaceholder — Placeholder for the Vendor Management module.
 * Phase 2c: Vendor directory, compliance, scopes, POs, vendor portal.
 */
import { Truck } from "lucide-react";

export default function VendorsPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#D9770615" }}
        >
          <Truck size={32} style={{ color: "#D97706" }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Vendor Management</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Vendor directory, compliance tracking, scopes of work, POs, and vendor portal.
        </p>
        <span className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
          Phase 2c — Coming soon
        </span>
      </div>
    </div>
  );
}
