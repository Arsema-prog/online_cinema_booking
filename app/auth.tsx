import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import Keycloak from "keycloak-js";
import { env } from "./env";
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const keycloak = new Keycloak({
  url: env.keycloakUrl,
  realm: env.keycloakRealm,
  clientId: env.keycloakClientId
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    let isMounted = true;

    keycloak
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
        pkceMethod: "S256",
        checkLoginIframe: false
      })
      .then(auth => {
        if (!isMounted) return;
        setIsAuthenticated(auth);
        setToken(keycloak.token);
        const realmRoles =
          (keycloak.tokenParsed as any)?.realm_access?.roles ?? [];
        setRoles(realmRoles);
        setAccessTokenGetter(() => keycloak.token || undefined);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const interval = setInterval(() => {
      if (!keycloak.authenticated) return;
      keycloak
        .updateToken(60)
        .then(refreshed => {
          if (!refreshed) return;
          setToken(keycloak.token);
          const realmRoles =
            (keycloak.tokenParsed as any)?.realm_access?.roles ?? [];
          setRoles(realmRoles);
          setAccessTokenGetter(() => keycloak.token || undefined);
        })
        .catch(() => {
          keycloak.logout({ redirectUri: window.location.origin });
        });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const login = useCallback(() => {
    keycloak.login({ redirectUri: window.location.origin });
  }, []);

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        isAuthenticated,
        loading,
        token,
        roles,
        login,
        logout
      }}
    >
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

