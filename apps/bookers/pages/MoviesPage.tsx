import React from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "../hooks/useMovies";

export const MoviesPage: React.FC = () => {
  const { data: movies, loading, error } = useMovies();
  const navigate = useNavigate();

  if (loading) return <div>Loading movies...</div>;
  if (error) return <div style={{ color: "#f97373" }}>{error}</div>;
  if (!movies || movies.length === 0) return <div>No movies available.</div>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Now Showing</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 16
        }}
      >
        {!movies && movies.map(movie => (
          <div
            key={movie.id}
            style={{
              background: "#0f172a",
              borderRadius: 8,
              padding: 16,
              boxShadow: "0 8px 20px rgba(15,23,42,0.8)"
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>{movie.title}</h2>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>{movie.genre}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Duration: {movie.duration} min
            </p>
            <button
              onClick={() => navigate(`/bookers/booking/${movie.id}`)}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: "#4f46e5",
                color: "white",
                fontSize: 14
              }}
            >
              View showtimes
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

