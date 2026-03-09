import React from "react";
import LogoutButton from "../components/LogoutButton";

const Dashboard = () => {
  return (
    <div style={{ padding: "2rem",width: "100%" }}>
       <LogoutButton />
      <h1 className="fade-in">Backoffice Dashboard</h1>
      <p className="fade-in" style={{ color: "#00ff00" }}>
        Manage cinema branches, screens, shows, and users.
      </p>

      <div className="card-grid">
        {/* Branches CRUD */}
        <div className="card fade-in">
          <h3>Branches</h3>
          <p>View, create, edit, delete branches</p>
          <button className="primary">Manage</button>
        </div>

        {/* Screens CRUD */}
        <div className="card fade-in">
          <h3>Screens</h3>
          <p>Create seat layouts and configure screens</p>
          <button className="primary">Manage</button>
        </div>

        {/* Shows CRUD */}
        <div className="card fade-in">
          <h3>Shows</h3>
          <p>Schedule shows and set prices</p>
          <button className="primary">Manage</button>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;
