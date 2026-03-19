import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Keycloak from "keycloak-js";
import { setAccessTokenGetter } from "./httpClient";
import { env } from "./env";

type Role = "USER" | "ADMIN" | "MANAGER" | string;

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  token?: string;
  roles: Role[];
}

interface AuthContextValue extends AuthState {
  keycloak: Keycloak;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Single Keycloak instance
const keycloak = new Keycloak({
  url: env.keycloakUrl,
  realm: env.keycloakRealm,
  clientId: env.keycloakClientId
});

// Expose for debugging
(window as any).kc = keycloak;

// Store initialization state outside component to survive StrictMode
let globalInitPromise: Promise<boolean> | null = null;
let globalInitCompleted = false;
let globalAuthState: AuthState | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Force re-render when needed
  const [, setUpdate] = useState({});

  const [state, setState] = useState<AuthState>(() => {
    // If we already have a global state from previous initialization, use it
    if (globalAuthState) {
      console.log("📦 Using cached global state on init:", globalAuthState);
      return globalAuthState;
    }
    return {
      isAuthenticated: false,
      loading: true,
      token: undefined,
      roles: []
    };
  });

  // Monitor state changes
  useEffect(() => {
    console.log("📊 Auth state changed:", {
      loading: state.loading,
      isAuthenticated: state.isAuthenticated,
      token: state.token ? "present" : "missing",
      roles: state.roles
    });
  }, [state]);

  useEffect(() => {
    // If already initialized globally, just update state and return
    if (globalInitCompleted && globalAuthState) {
      console.log("✅ Using globally cached auth state");
      setState(globalAuthState);
      if (globalAuthState.token) {
        setAccessTokenGetter(() => globalAuthState.token);
      }
      return;
    }

    let isMounted = true;
    console.log("🚀 Starting AuthProvider initialization...");

    const initializeKeycloak = async () => {
      // If there's already a global init promise, wait for it
      if (globalInitPromise) {
        console.log("⏳ Waiting for existing initialization...");
        try {
          await globalInitPromise;
          // After waiting, check if we have cached state
          if (globalAuthState && isMounted) {
            console.log("✅ Got cached state after waiting");
            setState(globalAuthState);
            if (globalAuthState.token) {
              setAccessTokenGetter(() => globalAuthState.token);
            }
          }
        } catch (error) {
          console.error("❌ Existing initialization failed:", error);
        }
        return;
      }

      // Create new init promise
      globalInitPromise = keycloak.init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
      });

      try {
        console.log("🔑 Running Keycloak.init()...");
        const authenticated = await globalInitPromise;

        if (!isMounted) {
          console.log("📝 Component unmounted but saving global state");
        }

        console.log("🔑 Keycloak.init() completed:", authenticated);
        console.log("🔑 Keycloak.authenticated:", keycloak.authenticated);
        console.log("🔑 Current URL:", window.location.href);

        let newState: AuthState;

        if (authenticated) {
          const realmRoles = (keycloak.tokenParsed as any)?.realm_access?.roles ?? [];
          console.log("👥 User roles:", realmRoles);

          newState = {
            isAuthenticated: true,
            loading: false,
            token: keycloak.token,
            roles: realmRoles
          };

          setAccessTokenGetter(() => keycloak.token || undefined);

          // Clean up URL if needed
          if (window.location.href.includes('#') && !window.location.href.includes('silent-check-sso')) {
            window.history.replaceState({}, document.title, '/bookers');
          }
        } else {
          console.log("👤 User is not authenticated");
          newState = {
            isAuthenticated: false,
            loading: false,
            token: undefined,
            roles: []
          };
        }

        // Save to global
        globalAuthState = newState;
        globalInitCompleted = true;

        // Update state if component is still mounted
        if (isMounted) {
          console.log("✅ Updating mounted component with new state");
          setState(newState);
        } else {
          console.log("💾 Auth state cached globally for next mount");
          // Force a re-render of any mounted instances by triggering a state update
          setUpdate({});
        }

      } catch (error) {
        console.error("💥 Keycloak initialization failed:", error);

        const errorState = {
          isAuthenticated: false,
          loading: false,
          token: undefined,
          roles: []
        };

        globalAuthState = errorState;
        globalInitCompleted = true;

        if (isMounted) {
          setState(errorState);
        } else {
          setUpdate({});
        }
      }
    };

    initializeKeycloak();

    // Token refresh interval
    const interval = setInterval(() => {
      if (!keycloak.authenticated) return;

      keycloak.updateToken(30)
        .then(refreshed => {
          if (refreshed) {
            console.log("🔄 Token refreshed");
            const realmRoles = (keycloak.tokenParsed as any)?.realm_access?.roles ?? [];

            const updatedState = {
              ...state,
              token: keycloak.token,
              roles: realmRoles
            };

            globalAuthState = updatedState;
            setState(updatedState);
            setAccessTokenGetter(() => keycloak.token || undefined);
          }
        })
        .catch(() => {
          keycloak.logout({ redirectUri: window.location.origin + '/login' });
        });
    }, 30000);

    return () => {
      console.log("🧹 Cleaning up AuthProvider (component unmounting)");
      isMounted = false;
      clearInterval(interval);
      // Don't reset global state - keep it for the next mount
    };
  }, []); // Empty deps - run once

  const login = useCallback(() => {
    keycloak.login({ redirectUri: window.location.origin + '/bookers' });
  }, []);

  const logout = useCallback(() => {
    // Clear global state on logout
    globalInitCompleted = false;
    globalAuthState = null;
    globalInitPromise = null;
    keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }, []);

  const value: AuthContextValue = {
    ...state,
    keycloak,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// At the bottom of your auth.tsx, update the useAuth hook to be more defensive:

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  // Don't throw error immediately - this allows us to handle it gracefully in components
  if (!ctx) {
    console.warn("useAuth called outside AuthProvider - this should only happen during initialization");
    // Return a dummy object that will be replaced once the provider is ready
    return {
      keycloak,
      isAuthenticated: false,
      loading: true,
      token: undefined,
      roles: [],
      login: () => {},
      logout: () => {}
    };
  }
  return ctx;
};

export const useRoles = () => {
  const { roles } = useAuth();
  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (check: string[]) => check.some(r => roles.includes(r));
  return { roles, hasRole, hasAnyRole };
};