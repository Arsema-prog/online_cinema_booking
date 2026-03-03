import React from "react";
import { useKeycloak } from "@react-keycloak/web";

const LogoutButton: React.FC = () => {
  const { keycloak } = useKeycloak();

  return (
    <button
      onClick={() => keycloak.logout()}
      style={{
        padding: "8px 16px",
        backgroundColor: "red",
        color: "white",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
