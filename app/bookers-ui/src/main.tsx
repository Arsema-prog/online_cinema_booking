import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App"; // Import the new App component
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "./App.css";

console.log("🟢 main.tsx running at", new Date().toISOString());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);