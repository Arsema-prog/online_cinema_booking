import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export const BookersLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "white" }}>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid #1e293b", background: "#0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700 }}>Cinema</span>
          <nav style={{ display: "flex", gap: 12, fontSize: 14 }}>
            <Link to="/bookers/movies" style={{ color: isActive("/bookers/movies") ? "#60a5fa" : "#e5e7eb", textDecoration: "none" }}>Movies</Link>
          </nav>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/backoffice" style={{ color: "#a5b4fc", fontSize: 13, textDecoration: "none" }}>Backoffice</Link>
          <button onClick={logout} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #4b5563", background: "transparent", color: "#e5e7eb", fontSize: 13, cursor: "pointer" }}>Logout</button>
        </div>
      </header>
      <main style={{ padding: 24 }}><Outlet /></main>
    </div>
  );
};