// App.tsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth";
import { AppRoutes } from "./AppRoutes";
import { QueryProvider } from "./providers/QueryProvider";
import "./App.css"; 
export const App = () => {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
};