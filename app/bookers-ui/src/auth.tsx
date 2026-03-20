import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef
} from "react";
import Keycloak from "keycloak-js";
import { env } from "././env";
import { setAccessTokenGetter } from "./httpClient";

type Role = "USER" | "ADMIN" | "MANAGER" | string;

interface AuthContextValue {
  keycloak: Keycloak | null;
  isAuthenticated: boolean;
  loading: boolean;
  token?: string;
  roles: Role[];
  login: () => void;
  logout: () => void;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Development bypass flag - set to true for development without Keycloak
const DEV_BYPASS_AUTH = true;

console.log("DEV_BYPASS_AUTH =", DEV_BYPASS_AUTH);

// Create keycloak instance only if not in bypass mode
const keycloakInstance = !DEV_BYPASS_AUTH ? new Keycloak({
  url: env.keycloakUrl,
  realm: env.keycloakRealm,
  clientId: env.keycloakClientId
}) : null;

if (keycloakInstance) {
  console.log("🔧 Keycloak instance created with:", {
    url: env.keycloakUrl,
    realm: env.keycloakRealm,
    clientId: env.keycloakClientId
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const refreshIntervalRef = useRef<number>();

  // Development bypass mode - runs once on mount
  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      console.log("⚠️ DEVELOPMENT MODE: Bypassing Keycloak authentication");
      
      // Simulate a brief loading state for realism
      const timer = setTimeout(() => {
        setIsAuthenticated(true);
        setRoles(["USER", "ADMIN"]);
        setToken("dev-mock-token");
        setAccessTokenGetter(() => "dev-mock-token");
        setLoading(false);
        console.log("✅ Development mode: User authenticated with roles:", ["USER", "ADMIN"]);
      }, 500); // 500ms delay to simulate loading
      
      return () => clearTimeout(timer);
    }
  }, []); // Empty dependency array - run once

  // Real Keycloak initialization (only if not in bypass mode)
  useEffect(() => {
    if (DEV_BYPASS_AUTH || !keycloakInstance) {
      return;
    }

    let isMounted = true;

    const initKeycloak = async () => {
      try {
        console.log("🚀 Starting Keycloak initialization...");
        
        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          pkceMethod: "S256",
          checkLoginIframe: false,
          enableLogging: true,
        });
        
        if (!isMounted) return;
        
        console.log("✅ Keycloak init result:", authenticated);
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          setToken(keycloakInstance.token);
          
          const tokenParsed = keycloakInstance.tokenParsed as any;
          const realmRoles = tokenParsed?.realm_access?.roles ?? [];
          console.log("👑 User roles:", realmRoles);
          setRoles(realmRoles);
          
          setAccessTokenGetter(() => keycloakInstance.token || undefined);
          
          // Set up token refresh
          refreshIntervalRef.current = window.setInterval(() => {
            if (!keycloakInstance.authenticated) return;
            
            keycloakInstance.updateToken(30)
              .then(refreshed => {
                if (refreshed) {
                  console.log("🔄 Token refreshed");
                  setToken(keycloakInstance.token);
                  const realmRoles =
                    (keycloakInstance.tokenParsed as any)?.realm_access?.roles ?? [];
                  setRoles(realmRoles);
                  setAccessTokenGetter(() => keycloakInstance.token || undefined);
                }
              })
              .catch(() => {
                console.error("❌ Failed to refresh token");
                logout();
              });
          }, 60000);
        }
      } catch (err) {
        console.error("❌ Keycloak init error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initKeycloak();

    return () => {
      isMounted = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const login = useCallback(() => {
    if (DEV_BYPASS_AUTH) {
      console.log("🔐 DEVELOPMENT MODE: Login clicked - already authenticated");
      return;
    }
    
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem("redirectAfterLogin", currentPath);
    
    keycloakInstance?.login({
      redirectUri: window.location.origin + "/login-redirect"
    });
  }, []);

  const logout = useCallback(() => {
    if (DEV_BYPASS_AUTH) {
      console.log("🚪 DEVELOPMENT MODE: Logout clicked");
      setIsAuthenticated(false);
      setRoles([]);
      setToken(undefined);
      setAccessTokenGetter(() => undefined);
      return;
    }
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    keycloakInstance?.logout({ 
      redirectUri: window.location.origin 
    });
  }, []);

  const value = {
    keycloak: keycloakInstance,
    isAuthenticated,
    loading,
    token,
    roles,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export const useRoles = () => {
  const { roles } = useAuth();
  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (check: string[]) => check.some(r => roles.includes(r));
  return { roles, hasRole, hasAnyRole };
};