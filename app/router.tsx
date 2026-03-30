import React from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes
} from "react-router-dom";
import { useAuth } from "./auth";
import { env } from "./env";
import { AppRoutes as BookersUiRoutes } from "./bookers-ui/src/AppRoutes";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const LoginPage: React.FC = () => {
  const { login, loading, isAuthenticated } = useAuth();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (isAuthenticated) {
    window.location.replace(env.bookerHomePath);
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "white"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 24,
          borderRadius: 8,
          background: "#0f172a",
          boxShadow: "0 10px 25px rgba(15,23,42,0.8)"
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Online Cinema Booking</h1>
        <p style={{ marginBottom: 16, color: "#cbd5f5" }}>
          Sign in with your cinema account to continue.
        </p>
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
            color: "white"
          }}
        >
          Sign in with Keycloak
        </button>
      </div>
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={env.bookerHomePath} replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
<<<<<<< HEAD
          <Route path="/bookers/*" element={<BookersUiRoutes />} />
=======
          <Route path="/bookers/*" element={<BookersRoutes />} />
>>>>>>> origin/main
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

