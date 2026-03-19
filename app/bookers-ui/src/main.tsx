import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App"; // Import the new App component
import "./App.css";

console.log("🟢 main.tsx running at", new Date().toISOString());

ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);