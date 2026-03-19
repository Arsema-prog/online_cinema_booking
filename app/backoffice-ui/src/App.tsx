import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth";
import { AppRoutes } from "./routes"; // Rename your current router to AppRoutes

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};