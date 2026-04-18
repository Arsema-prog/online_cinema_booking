import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import Keycloak from "keycloak-js";
import { env } from "./env";
import { setAccessTokenGetter } from "./httpClient";
import { registrationService, RegistrationData } from "./services/registrationService";

type Role = "USER" | "ADMIN" | "MANAGER" | "STAFF" | string;

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  user: any | null;
  roles: Role[];
  login: () => void;
  logout: () => void;
  register: (userData: RegistrationData) => Promise<void>;
  getToken: () => Promise<string | undefined>;
  initError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEV_BYPASS_AUTH = false;

// Global singleton to survive StrictMode mounting/unmounting completely
let globalKeycloakInstance: Keycloak | null = null;
let isKeycloakInitStarted = false;
let globalInitPromise: Promise<boolean> | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const keycloakRef = useRef<Keycloak | null>(null);
  const tokenRefreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const extractRoles = (keycloak: Keycloak): Role[] => {
    try {
      const token = keycloak.tokenParsed;
      if (token && token.realm_access && token.realm_access.roles) {
        return token.realm_access.roles;
      }
      return [];
    } catch (error) {
      console.error("Error extracting roles:", error);
      return [];
    }
  };

  const setupTokenRefresh = useCallback((keycloak: Keycloak) => {
    if (tokenRefreshInterval.current) {
      clearInterval(tokenRefreshInterval.current);
    }

    tokenRefreshInterval.current = setInterval(() => {
      keycloak.updateToken(30).catch((error) => {
        console.error("Failed to refresh token:", error);
        if (error?.status === 401) {
          logout();
        }
      });
    }, 240000);
  }, []);

  const logout = useCallback(() => {
    if (DEV_BYPASS_AUTH) {
      setIsAuthenticated(false);
      setUser(null);
      setRoles([]);
      setAccessTokenGetter(() => undefined);
      try {
        localStorage.removeItem("bookers_user_email");
      } catch {}
      return;
    }

    if (!keycloakRef.current) {
      console.error("Keycloak not initialized");
      return;
    }

    if (tokenRefreshInterval.current) {
      clearInterval(tokenRefreshInterval.current);
      tokenRefreshInterval.current = null;
    }

    keycloakRef.current.logout({
      redirectUri: window.location.origin
    });
  }, []);

  // FIX 1: Improved authentication state setup
  const setupAuthState = useCallback(async (keycloak: Keycloak, authenticated: boolean) => {
    console.log("Setting up auth state, authenticated:", authenticated);

    setIsAuthenticated(authenticated);

    if (authenticated && keycloak.token) {
      // Load user info
      try {
        const userInfo = await keycloak.loadUserInfo();
        setUser(userInfo);
        console.log("User info loaded:", userInfo);
        try {
          const email = (userInfo as any)?.email || keycloak.tokenParsed?.email;
          if (email && typeof email === "string") {
            localStorage.setItem("bookers_user_email", email);
          }
        } catch {}
      } catch (error) {
        console.warn("Failed to load user info:", error);
        setUser({
          preferred_username: keycloak.tokenParsed?.preferred_username || "Unknown User"
        });
        try {
          const fallbackEmail = keycloak.tokenParsed?.email ||
            (typeof keycloak.tokenParsed?.preferred_username === "string" &&
            keycloak.tokenParsed?.preferred_username.includes("@")
              ? keycloak.tokenParsed?.preferred_username
              : null);
          if (fallbackEmail) {
            localStorage.setItem("bookers_user_email", fallbackEmail);
          }
        } catch {}
      }

      const userRoles = extractRoles(keycloak);
      setRoles(userRoles);
      console.log("User roles:", userRoles);

      setAccessTokenGetter(() => keycloak.token);
      setupTokenRefresh(keycloak);
    } else {
      setUser(null);
      setRoles([]);
      try {
        localStorage.removeItem("bookers_user_email");
      } catch {}
    }

    setLoading(false);
  }, [setupTokenRefresh]);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setIsAuthenticated(true);
      setUser({ name: "Development User", email: "dev@example.com" });
      setRoles(["USER", "ADMIN"]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const initKeycloak = async () => {
      // If initialization already started, await the global promise
      if (isKeycloakInitStarted) {
        if (globalInitPromise) {
          try {
            const authenticated = await globalInitPromise;
            if (!mounted) return;
            keycloakRef.current = globalKeycloakInstance;
            if (globalKeycloakInstance) {
              await setupAuthState(globalKeycloakInstance, authenticated);
            }
          } catch (error: any) {
            if (mounted) {
              console.error("Failed to get existing Keycloak instance:", error);
              setInitError(error?.message || String(error));
              setLoading(false);
              setIsAuthenticated(false);
            }
          }
        }
        return;
      }

      isKeycloakInitStarted = true;

      try {
        if (!globalKeycloakInstance) {
          globalKeycloakInstance = new Keycloak({
            url: 'http://localhost:8180',
            realm: 'cinema-realm',
            clientId: 'bookers-ui'
          });
        }

        const keycloak = globalKeycloakInstance;
        keycloakRef.current = keycloak;

        // Catch hidden auth errors like "Invalid nonce"
        keycloak.onAuthError = (errorData) => {
          console.error("Keycloak Auth Error (e.g. Invalid nonce):", errorData);
          if (mounted) {
            setInitError("Auth Error: " + JSON.stringify(errorData));
            setLoading(false);
            setIsAuthenticated(false);
            keycloak.clearToken();
          }
        };

        // FIX 3: Handle auth success
        keycloak.onAuthSuccess = () => {
          console.log("Keycloak auth success!");
          if (mounted && keycloak.token) {
            setupAuthState(keycloak, true);
          }
        };

        // FIX 4: Handle auth refresh success
        keycloak.onAuthRefreshSuccess = () => {
          console.log("Keycloak token refresh success!");
          if (mounted && keycloak.token) {
            const userRoles = extractRoles(keycloak);
            setRoles(userRoles);
            setAccessTokenGetter(() => keycloak.token);
          }
        };

        // Wrapper to prevent Keycloak init from hanging indefinitely
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error("Keycloak init timeout - Invalid nonce internal hang")), 5000);
        });

        // Use check-sso without iframe to prevent session storage nonce overwrite races
        const initPromise = keycloak.init({
          onLoad: 'check-sso',
          pkceMethod: "S256",
          checkLoginIframe: false,
          enableLogging: true
        });

        globalInitPromise = initPromise;

        const authenticated = await Promise.race([initPromise, timeoutPromise]);

        if (!mounted) return;

        console.log("Keycloak initialized, authenticated:", authenticated);

        // FIX 6: Don't call setupAuthState here if onAuthSuccess will handle it
        if (authenticated) {
          await setupAuthState(keycloak, authenticated);
        } else {
          setLoading(false);
          setIsAuthenticated(false);
        }

      } catch (error: any) {
        if (!mounted) return;
        console.error("Keycloak init error:", error);
        
        // If it was a hanging invalid nonce, we should forcefully clean the URL and clear tokens
        if (keycloakRef.current) {
          keycloakRef.current.clearToken();
        }
        
        // Clean URL to prevent infinite reload loops with broken auth fragments
        if (window.location.hash.includes('state=')) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
        
        setInitError("Init Catch Error: " + (error?.message || String(error)));
        setLoading(false);
        setIsAuthenticated(false);
      }
    };

    initKeycloak();

    return () => {
      mounted = false;
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
        tokenRefreshInterval.current = null;
      }
    };
  }, [setupAuthState]);

  // FIX 7: Improved login function
  const login = useCallback(() => {
    if (!keycloakRef.current) {
      console.warn("Keycloak not initialized yet");
      return;
    }

    // Clear any existing tokens before login
    keycloakRef.current.clearToken();

    // Store the intended destination
    const redirectUri = window.location.origin + '/bookers/movies';
    console.log("Logging in with redirect URI:", redirectUri);

    keycloakRef.current.login({
      redirectUri: redirectUri
    });
  }, []);

  const register = useCallback(async (userData: RegistrationData) => {
    if (DEV_BYPASS_AUTH) {
      console.log("Development mode - registration simulated");
      return;
    }

    await registrationService.register(userData);
    window.location.href = '/';
  }, []);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (DEV_BYPASS_AUTH) {
      return "dev-token";
    }

    if (!keycloakRef.current) {
      return undefined;
    }

    try {
      await keycloakRef.current.updateToken(30);
      return keycloakRef.current.token;
    } catch (error) {
      console.error("Failed to get token:", error);
      return undefined;
    }
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    loading,
    user,
    roles,
    login,
    logout,
    register,
    getToken,
    initError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useHasRole = (role: Role): boolean => {
  const { roles } = useAuth();
  return roles.includes(role);
};

export const useHasAnyRole = (allowedRoles: Role[]): boolean => {
  const { roles } = useAuth();
  return roles.some(role => allowedRoles.includes(role));
};

export const ProtectedComponent: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Role[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, roles, initError } = useAuth();
  
  if (initError) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: 'red' }}>
        <h2>Keycloak Initialization Error</h2>
        <p>{initError}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <h2>Authentication Required</h2>
        <p>Please log in to access this content.</p>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = roles.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this content.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};
