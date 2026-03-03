import React, { useEffect, useState } from "react";
import Keycloak from "keycloak-js";
import { Navigate } from "react-router-dom";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

interface RoleGuardProps {
  roles: string[];
  children: JSX.Element;
}

const RoleGuard = ({ roles, children }: RoleGuardProps) => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    keycloak.init({ onLoad: "login-required" }).then((auth) => {
      if (!auth) {
        keycloak.login();
      } else {
        const hasRole = roles.some((role) => keycloak.hasRealmRole(role));
        setAuthenticated(hasRole);
      }
    });
  }, []);

  if (authenticated === null) return <p>Loading...</p>;
  return authenticated ? children : <Navigate to="/unauthorized" />;
};

export default RoleGuard;
