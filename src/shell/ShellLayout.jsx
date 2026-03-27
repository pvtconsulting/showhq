/**
 * ShellLayout — The top-level layout component.
 *
 * Renders sidebar + main content area. Acts as the Outlet wrapper
 * for React Router nested routes.
 */
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { useOrg } from "./OrgProvider.jsx";
import OrgPicker from "./OrgPicker.jsx";

export default function ShellLayout({ onSignOut }) {
  const { currentOrg, orgsLoading } = useOrg();

  // Show org picker if no org is selected and we're done loading
  if (!orgsLoading && !currentOrg) {
    return <OrgPicker />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onSignOut={onSignOut} />

      <main className="flex-1 overflow-y-auto bg-shell-bg">
        {orgsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
