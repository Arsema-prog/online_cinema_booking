import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./router";
import { AuthProvider } from "./auth";

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);

