/**
 * ModuleGuard — Route guard that checks if a module is enabled.
 *
 * Wraps a route's element. If the module is disabled for the current org,
 * redirects to the dashboard instead of rendering the module.
 */
import { Navigate } from "react-router-dom";
import { useOrg } from "./OrgProvider.jsx";

export default function ModuleGuard({ moduleKey, children }) {
  const { checkModule, currentOrg } = useOrg();

  // If no org is selected yet, don't block — the shell will show the org picker
  if (!currentOrg) return null;

  // If the module is enabled, render its content
  if (checkModule(moduleKey)) return children;

  // Module is disabled — redirect to dashboard
  return <Navigate to="/" replace />;
}
