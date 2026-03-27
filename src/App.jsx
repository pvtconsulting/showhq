/**
 * App — ShowHQ root component.
 *
 * Handles auth gating, wraps everything in OrgProvider,
 * and sets up React Router with module-guarded routes.
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./shared/useAuth.js";
import { OrgProvider } from "./shell/OrgProvider.jsx";
import ShellLayout from "./shell/ShellLayout.jsx";
import AuthPage from "./shell/AuthPage.jsx";
import Dashboard from "./shell/Dashboard.jsx";
import ModuleGuard from "./shell/ModuleGuard.jsx";

// Real modules
import ProductionSchedule from "./modules/production/ProductionSchedule.jsx";

// Module placeholders (will be replaced with real modules in later phases)
import RehearsalPlaceholder from "./modules/rehearsal/RehearsalPlaceholder.jsx";
import StaffingPlaceholder from "./modules/staffing/StaffingPlaceholder.jsx";
import VendorsPlaceholder from "./modules/vendors/VendorsPlaceholder.jsx";
import FloorPlansPlaceholder from "./modules/floorplans/FloorPlansPlaceholder.jsx";
import EventLetterPlaceholder from "./modules/eventletter/EventLetterPlaceholder.jsx";

// Settings
import ModuleSettings from "./settings/ModuleSettings.jsx";

export default function App() {
  const { user, loading, signOut } = useAuth();

  // Show spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-shell-bg">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated — show login
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated — show the shell
  return (
    <BrowserRouter>
      <OrgProvider user={user}>
        <Routes>
          <Route element={<ShellLayout onSignOut={signOut} />}>
            {/* Dashboard — always available */}
            <Route index element={<Dashboard />} />

            {/* Module routes — guarded by module toggle */}
            <Route
              path="/rehearsal/*"
              element={
                <ModuleGuard moduleKey="rehearsal">
                  <RehearsalPlaceholder />
                </ModuleGuard>
              }
            />
            <Route
              path="/production/*"
              element={
                <ModuleGuard moduleKey="production">
                  <ProductionSchedule />
                </ModuleGuard>
              }
            />
            <Route
              path="/staffing/*"
              element={
                <ModuleGuard moduleKey="staffing">
                  <StaffingPlaceholder />
                </ModuleGuard>
              }
            />
            <Route
              path="/vendors/*"
              element={
                <ModuleGuard moduleKey="vendors">
                  <VendorsPlaceholder />
                </ModuleGuard>
              }
            />
            <Route
              path="/floor-plans/*"
              element={
                <ModuleGuard moduleKey="floorplans">
                  <FloorPlansPlaceholder />
                </ModuleGuard>
              }
            />
            <Route
              path="/event-letter/*"
              element={
                <ModuleGuard moduleKey="eventletter">
                  <EventLetterPlaceholder />
                </ModuleGuard>
              }
            />

            {/* Settings — accessible to admins */}
            <Route path="/settings" element={<ModuleSettings />} />

            {/* Catch-all — redirect to dashboard */}
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </OrgProvider>
    </BrowserRouter>
  );
}
