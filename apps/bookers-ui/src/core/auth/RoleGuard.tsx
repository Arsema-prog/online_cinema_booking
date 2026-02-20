import { useKeycloak } from "@react-keycloak/web";
import { Navigate } from "react-router-dom";
import React from "react";

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return null; // or a spinner

  if (!keycloak.authenticated) {
    keycloak.login();
    return null;
  }

  const hasRole = roles.some((role) =>
    keycloak.hasRealmRole(role)
  );

  if (!hasRole) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

export default RoleGuard;
