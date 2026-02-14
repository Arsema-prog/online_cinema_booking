import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleGuard from "./core/auth/RoleGuard";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            //<RoleGuard roles={["ADMIN", "MANAGER", "STAFF"]}>
              <Dashboard />
            //</RoleGuard>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
