import React from "react";
import { useNavigate } from "react-router-dom";
import { useMoviesAdmin } from "../hooks/useMoviesAdmin";

export const MovieListPage: React.FC = () => {
  const { movies, loading, error, remove } = useMoviesAdmin();
  const navigate = useNavigate();

  if (loading) return <div>Loading movies...</div>;
  if (error) return <div style={{ color: "#f97373" }}>{error}</div>;

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h1 style={{ fontSize: 22 }}>Manage Movies</h1>
        <button
          onClick={() => navigate("/backoffice/movies/new")}
          style={{
            padding: "8px 12px",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
            background: "#4f46e5",
            color: "white",
            fontSize: 14
          }}
        >
          Add movie
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #1e293b" }}>
            <th style={{ padding: "8px 4px" }}>Title</th>
            <th style={{ padding: "8px 4px" }}>Genre</th>
            <th style={{ padding: "8px 4px" }}>Duration</th>
            <th style={{ padding: "8px 4px" }} />
          </tr>
        </thead>
        <tbody>
          {movies.map(movie => (
            <tr
              key={movie.id}
              style={{ borderBottom: "1px solid #111827", color: "#e5e7eb" }}
            >
              <td style={{ padding: "8px 4px" }}>{movie.title}</td>
              <td style={{ padding: "8px 4px" }}>{movie.genre}</td>
              <td style={{ padding: "8px 4px" }}>{movie.duration} min</td>
              <td style={{ padding: "8px 4px", textAlign: "right" }}>
                <button
                  onClick={() =>
                    navigate(`/backoffice/movies/${movie.id}/edit`)
                  }
                  style={{
                    marginRight: 8,
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #4b5563",
                    background: "transparent",
                    color: "#bfdbfe",
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Delete this movie?")) remove(movie.id);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #b91c1c",
                    background: "transparent",
                    color: "#fecaca",
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {movies.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{ padding: "12px 4px", textAlign: "center", color: "#9ca3af" }}
              >
                No movies configured yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

