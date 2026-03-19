import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth, useRoles } from "./auth";
import { env } from "./env";
import { BookersRoutes } from "./bookers/routes";
import { BackofficeRoutes } from "./backoffice/routes";

// Loading component
const LoadingScreen = () => (
  <div style={{
    padding: 16,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#020617',
    flexDirection: 'column'
  }}>
    <div style={{ marginBottom: '1rem' }}>Initializing application...</div>
    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Please wait</div>
  </div>
);

// Error component for when auth fails
const AuthErrorScreen = () => (
  <div style={{
    padding: 16,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#020617',
    flexDirection: 'column'
  }}>
    <div style={{ marginBottom: '1rem', color: '#ef4444' }}>Authentication Error</div>
    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Please refresh the page</div>
  </div>
);

// Protected route
const ProtectedRoute: React.FC = () => {
  const auth = useAuth();

  // If auth is undefined, show error
  if (!auth) {
    console.log("🔒 Auth context not available");
    return <AuthErrorScreen />;
  }

  const { isAuthenticated, loading } = auth;
  const navigate = useNavigate();

  console.log("🔒 ProtectedRoute - loading:", loading, "isAuthenticated:", isAuthenticated);

  useEffect(() => {
    console.log("🔒 ProtectedRoute useEffect - loading:", loading, "isAuthenticated:", isAuthenticated);

    if (!loading && !isAuthenticated) {
      console.log("🔒 Not authenticated, redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    console.log("🔒 Still loading...");
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log("🔒 Not authenticated, rendering nothing (will redirect via useEffect)");
    return null;
  }

  console.log("🔒 Authenticated, rendering outlet");
  return <Outlet />;
};

// Role-based route
const RoleRoute: React.FC<{ allowedRoles: string[]; redirectTo?: string }> = ({
  allowedRoles,
  redirectTo
}) => {
  const { hasAnyRole } = useRoles();
  console.log("🎭 RoleRoute - checking roles:", allowedRoles);

  if (!hasAnyRole(allowedRoles)) {
    console.log("🎭 Role check failed, redirecting to:", redirectTo || env.bookerHomePath);
    return <Navigate to={redirectTo || env.bookerHomePath} replace />;
  }

  console.log("🎭 Role check passed");
  return <Outlet />;
};

// Login page
const LoginPage: React.FC = () => {
  const auth = useAuth();

  // If auth is undefined, show error
  if (!auth) {
    console.log("🔑 Auth context not available");
    return <AuthErrorScreen />;
  }

  const { loading, isAuthenticated, login } = auth;

  console.log("🔑 LoginPage - loading:", loading, "isAuthenticated:", isAuthenticated);

  if (loading) {
    console.log("🔑 LoginPage loading...");
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    console.log("🔑 Already authenticated, redirecting to bookers");
    return <Navigate to={env.bookerHomePath} replace />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "white" }}>
      <div style={{ width: 400, padding: 24, borderRadius: 8, background: "#0f172a", boxShadow: "0 10px 25px rgba(15,23,42,0.8)" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Online Cinema Booking</h1>
        <p style={{ marginBottom: 16, color: "#cbd5f5" }}>Sign in with your cinema account to continue.</p>
        <button
          onClick={login}
          style={{ width: "100%", padding: "10px 16px", borderRadius: 4, border: "none", cursor: "pointer", fontWeight: 600, background: "#4f46e5", color: "white" }}
        >
          Sign in with Keycloak
        </button>
      </div>
    </div>
  );
};

// Main routes component
export const AppRoutes: React.FC = () => {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.log("🏠 Auth context not ready yet, showing loading screen");
    return <LoadingScreen />;
  }

  // If auth is undefined, show loading
  if (!auth) {
    console.log("🏠 Auth not available, showing loading screen");
    return <LoadingScreen />;
  }

  const { loading, isAuthenticated } = auth;

  console.log("🏠 AppRoutes - loading:", loading, "isAuthenticated:", isAuthenticated);
  console.log("🏠 AppRoutes - token:", auth.token ? "present" : "missing");
  console.log("🏠 AppRoutes - roles:", auth.roles);

  // Show loading screen while initializing
  if (loading) {
    console.log("🏠 AppRoutes showing loading screen");
    return <LoadingScreen />;
  }

  console.log("🏠 AppRoutes rendering routes");

  return (
    <Routes>
      <Route path="/" element={<Navigate to={env.bookerHomePath} replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/bookers/*" element={<BookersRoutes />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["ADMIN","MANAGER"]} redirectTo={env.bookerHomePath} />}>
          <Route path="/backoffice/*" element={<BackofficeRoutes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};