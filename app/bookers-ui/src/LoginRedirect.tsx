import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

export const LoginRedirect: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Processing login...
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/bookers/movies" : "/"} replace />;
};
