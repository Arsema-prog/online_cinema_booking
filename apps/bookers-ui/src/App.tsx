import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleGuard from "./core/auth/RoleGuard";
import Unauthorized from "./pages/Unauthorized";
import React from "react";
import LogoutButton from "./components/LogoutButton";
import Dashboard from "./pages/Dashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
           // <RoleGuard roles={["USER"]}>
              <Dashboard />
           // </RoleGuard>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
