import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth1";
import { env } from "./env";
import { BookersRoutes } from "./bookers/routes";

// Loading component with better UX
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

// Error component
const ErrorScreen: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
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
    <div style={{ marginBottom: '1rem', color: '#ef4444' }}>Error: {error}</div>
    <button
      onClick={onRetry}
      style={{
        padding: '10px 16px',
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        background: '#4f46e5',
        color: 'white'
      }}
    >
      Retry
    </button>
  </div>
);

const ProtectedRoute = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Protected route - FIXED VERSION
// const ProtectedRoute: React.FC = () => {
//   const auth = useAuth();
//   const navigate = useNavigate();
//   const [redirectAttempted, setRedirectAttempted] = useState(false);
//
//   useEffect(() => {
//     // Don't do anything if auth is not available yet
//     if (!auth) return;
//
//     const { loading, isAuthenticated, error } = auth;
//
//     // Only attempt redirect when loading is complete
//     if (!loading && !redirectAttempted) {
//       if (!isAuthenticated) {
//         console.log("🔒 Not authenticated, redirecting to login");
//         setRedirectAttempted(true);
//         navigate('/login', { replace: true });
//       } else if (error) {
//         console.log("❌ Auth error:", error);
//         setRedirectAttempted(true);
//         navigate('/login', { replace: true, state: { error } });
//       } else {
//         console.log("🔓 Authenticated, allowing access");
//       }
//     }
//   }, [auth, navigate, redirectAttempted]);
//
//   // Handle different auth states
//   if (!auth) {
//     return <LoadingScreen />;
//   }
//
//   const { loading, isAuthenticated, error, retry } = auth;
//
//   // Show error screen if there's an error and not loading
//   if (error && !loading) {
//     return <ErrorScreen error={error} onRetry={retry} />;
//   }
//
//   // Show loading while authenticating
//   if (loading) {
//     return <LoadingScreen />;
//   }
//
//
//   if (!isAuthenticated) {
//     return null;
//   }
//
//   // Authenticated - render protected routes
//   return <Outlet />;
// };

// Login page - FIXED VERSION
const LoginPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loginAttempted, setLoginAttempted] = useState(false);

  useEffect(() => {
    // Check URL for OAuth2 response
//     const hasAuthCode = window.location.href.includes('code=') ||
//                        window.location.href.includes('state=');

    if (hasAuthCode) {
      console.log("🔑 OAuth2 response detected in URL, waiting for Keycloak...");
      // Don't do anything, let Keycloak handle it
      return;
    }

    // If already authenticated, redirect to bookers
    if (auth && !auth.loading && auth.isAuthenticated) {
      console.log("✅ Already authenticated, redirecting to bookers");
      navigate(env.bookerHomePath, { replace: true });
    }
  }, [auth, navigate]);

  if (!auth) {
    return <LoadingScreen />;
  }

  const { loading, isAuthenticated, error, login, retry } = auth;

  // Check URL for OAuth2 response
  const hasAuthCode = window.location.href.includes('code=') ||
                     window.location.href.includes('state=');

  // If there's an auth code in URL, show processing message
  if (hasAuthCode) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "white" }}>
        <div style={{ width: 400, padding: 24, borderRadius: 8, background: "#0f172a", textAlign: "center" }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Completing login...</h2>
          <div style={{ color: "#94a3b8" }}>Please wait while we complete the authentication process.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={env.bookerHomePath} replace />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "white" }}>
      <div style={{ width: 400, padding: 24, borderRadius: 8, background: "#0f172a", boxShadow: "0 10px 25px rgba(15,23,42,0.8)" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Online Cinema Booking</h1>
        <p style={{ marginBottom: 16, color: "#cbd5f5" }}>Sign in with your cinema account to continue.</p>

        {error && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#ef4444',
            fontSize: 14
          }}>
            Error: {error}
          </div>
        )}

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            background: "#4f46e5",
            color: "white",
            marginBottom: 8
          }}
        >
          Sign in with Keycloak
        </button>

        {error && (
          <button
            onClick={retry}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 4,
              border: "1px solid #4f46e5",
              cursor: "pointer",
              fontWeight: 600,
              background: "transparent",
              color: "#4f46e5"
            }}
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};

// Main routes component - FIXED VERSION
export const AppRoutes: React.FC = () => {
  const auth = useAuth();

  // If auth is not available yet, show loading
  if (!auth) {
    return <LoadingScreen />;
  }

  const { loading, initialized, error } = auth;

  // Show loading while initializing
  if (loading && !initialized) {
    return <LoadingScreen />;
  }

  // Check for OAuth2 response in URL
  const hasAuthCode = window.location.href.includes('code=') ||
                     window.location.href.includes('state=');

  // If we're in the middle of OAuth2 flow, show processing screen
  if (hasAuthCode) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Processing authentication...</h2>
          <p style={{ color: "#94a3b8" }}>Please wait while we complete the login process.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/bookers/*" element={<BookersRoutes />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to={env.bookerHomePath} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};