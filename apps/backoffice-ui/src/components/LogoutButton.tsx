import React from "react";

const LogoutButton = () => {
  const logout = () => {
    console.log("Logout clicked");
  };

  return (
    <button className="danger" onClick={logout} style={{ marginTop: "2rem" }}>
      Logout
    </button>
  );
};

export default LogoutButton;
