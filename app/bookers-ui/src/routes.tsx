import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { env } from "././env";
import { BookersRoutes } from "./bookers/routes";
import { LoginRedirect } from "./LoginRedirect";
import { MoviesPage } from "./pages/MoviesPage"; // Add this import
import { BookingPage } from "./pages/BookingPage"; // Add this import

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

// Protected route
const ProtectedRoute: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [auth.loading, auth.isAuthenticated, navigate]);

  if (auth.loading) return <LoadingScreen />;
  if (!auth.isAuthenticated) return null;

  return <Outlet />;
};

// Add this right after your imports in routes.tsx
console.log("🔍 Routes file loaded");
console.log("🔍 Current URL:", window.location.href);
console.log("🔍 Current pathname:", window.location.pathname);

const LoginPage: React.FC = () => {
  const auth = useAuth();
  
  console.log("LoginPage - loading:", auth.loading, "isAuthenticated:", auth.isAuthenticated);
  console.log("LoginPage - login function available:", !!auth.login);

  if (auth.loading) return <LoadingScreen />;
  if (auth.isAuthenticated) return <Navigate to={env.bookerHomePath} replace />;

  const handleLogin = () => {
    console.log("Login button clicked");
    auth.login();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "white" }}>
      <div style={{ width: 400, padding: 24, borderRadius: 8, background: "#0f172a", boxShadow: "0 10px 25px rgba(15,23,42,0.8)" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Online Cinema Booking</h1>
        <p style={{ marginBottom: 16, color: "#cbd5f5" }}>Sign in with your cinema account to continue.</p>
        <button
          onClick={handleLogin}
          style={{ width: "100%", padding: "10px 16px", borderRadius: 4, border: "none", cursor: "pointer", fontWeight: 600, background: "#4f46e5", color: "white" }}
        >
          Sign in with Keycloak
        </button>
      </div>
    </div>
  );
};

// Remove this duplicate declaration
// export const BookersRoutes = () => {
//   return (
//     <Routes>
//       <Route index element={<MoviesPage />} />
//       <Route path="booking/:movieId" element={<BookingPage />} />
//     </Routes>
//   );
// };

const DebugInfo: React.FC = () => {
  const auth = useAuth();
  return (
    <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: 'lime', padding: 10, fontSize: 12, zIndex: 9999 }}>
      <div>Loading: {auth.loading ? 'true' : 'false'}</div>
      <div>Authenticated: {auth.isAuthenticated ? 'true' : 'false'}</div>
      <div>Path: {window.location.pathname}</div>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  const auth = useAuth();
  
  console.log("🔍 AppRoutes - rendering");
  console.log("🔍 Auth state - loading:", auth.loading, "isAuthenticated:", auth.isAuthenticated);
  console.log("🔍 Current pathname:", window.location.pathname);
  console.log("🔍 Auth error:", auth.error);

  // Add this at the very top of routes.tsx, right after imports
  console.log("🚀 Routes module loaded at:", new Date().toISOString());
  console.log("🚀 Current URL:", window.location.href);
  console.log("🚀 Current pathname:", window.location.pathname);

  // Force a re-render when loading changes
  React.useEffect(() => {
    console.log("🔍 Loading state changed to:", auth.loading);
  }, [auth.loading]);

  React.useEffect(() => {
    console.log("🔍 isAuthenticated state changed to:", auth.isAuthenticated);
  }, [auth.isAuthenticated]);

  if (auth.loading) {
    console.log("🔍 Showing loading screen");
    return (
      <>
        <LoadingScreen />
        <DebugInfo />
      </>
    );
  }

  console.log("🔍 Rendering routes, isAuthenticated:", auth.isAuthenticated);
  
  // If not authenticated, show login page
  if (!auth.isAuthenticated) {
    console.log("🔍 Not authenticated, should show login page");
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-redirect" element={<LoginRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <DebugInfo />
      </>
    );
  }

  // If authenticated, show protected routes
  console.log("🔍 Authenticated, showing protected routes");
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={env.bookerHomePath} replace />} />
        <Route path="/login" element={<Navigate to={env.bookerHomePath} replace />} />
        <Route path="/login-redirect" element={<LoginRedirect />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/bookers/*" element={<BookersRoutes />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DebugInfo />
    </>
  );
};