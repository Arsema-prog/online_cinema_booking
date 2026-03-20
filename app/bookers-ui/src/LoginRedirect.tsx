// LoginRedirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { env } from "././env";

export const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    console.log("LoginRedirect - loading:", loading, "isAuthenticated:", isAuthenticated);
    
    if (!loading) {
      if (isAuthenticated) {
        // Get the saved path from sessionStorage
        const savedPath = sessionStorage.getItem("redirectAfterLogin");
        sessionStorage.removeItem("redirectAfterLogin");
        
        console.log("LoginRedirect - authenticated, redirecting to:", savedPath || env.bookerHomePath);
        
        if (savedPath && !savedPath.includes("/login")) {
          navigate(savedPath, { replace: true });
        } else {
          navigate(env.bookerHomePath, { replace: true });
        }
      } else {
        console.log("LoginRedirect - not authenticated, going to login");
        navigate("/login", { replace: true });
      }
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#020617',
      color: 'white'
    }}>
      Processing login...
    </div>
  );
};