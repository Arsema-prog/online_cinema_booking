import React, { useState } from "react";

// Example data
const shows = [
  {
    id: 1,
    title: "Avengers: Endgame",
    duration: "3h 2m",
    rating: "PG-13",
    poster: "https://via.placeholder.com/200x300?text=Avengers",
    startTime: "2026-02-20 18:00",
    branch: "Addis Ababa",
  },
  {
    id: 2,
    title: "Inception",
    duration: "2h 28m",
    rating: "PG-13",
    poster: "https://via.placeholder.com/200x300?text=Inception",
    startTime: "2026-02-21 20:00",
    branch: "Bahir Dar",
  },
  {
    id: 3,
    title: "The Batman",
    duration: "2h 55m",
    rating: "PG-13",
    poster: "https://via.placeholder.com/200x300?text=The+Batman",
    startTime: "2026-02-22 19:00",
    branch: "Addis Ababa",
  },
];

const branches = Array.from(new Set(shows.map((s) => s.branch))); // unique branches

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const filteredShows = shows.filter((show) => {
    const matchesTitle = show.title.toLowerCase().includes(search.toLowerCase());
    const matchesDate = filterDate ? show.startTime.startsWith(filterDate) : true;
    const matchesBranch = filterBranch ? show.branch === filterBranch : true;
    return matchesTitle && matchesDate && matchesBranch;
  });

  return (
    <div style={{ padding: "2rem", width: "100%", minHeight: "100vh", boxSizing: "border-box" }}>
      <h1 className="fade-in">Latest Shows</h1>

      {/* Filters */}
      <div className="fade-in" style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid #00cc66",
            backgroundColor: "#111",
            color: "#00cc66",
            flex: "1",
            minWidth: "200px",
          }}
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid #00cc66",
            backgroundColor: "#111",
            color: "#00cc66",
          }}
        />
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid #00cc66",
            backgroundColor: "#111",
            color: "#00cc66",
          }}
        >
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </div>

      {/* Shows grid */}
      <div className="show-grid">
        {filteredShows.length === 0 ? (
          <p className="fade-in" style={{ marginTop: "2rem" }}>No shows found.</p>
        ) : (
          filteredShows.map((show) => (
            <div key={show.id} className="show-card fade-in">
              <img
                src={show.poster}
                alt={show.title}
                style={{ width: "100%", borderRadius: "6px" }}
              />
              <h3>{show.title}</h3>
              <p>{show.duration} | {show.rating}</p>
              <p>Start: {show.startTime}</p>
              <p>Branch: {show.branch}</p>
              <button className="primary" style={{ marginTop: "0.5rem" }}>
                View Seats
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
