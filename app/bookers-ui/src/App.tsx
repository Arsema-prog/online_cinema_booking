// App.tsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth";
import { AppRoutes } from "./routes";
import "./App.css"; 
export const App = () => {
   console.log("🟢 App rendered at", new Date().toISOString());
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};