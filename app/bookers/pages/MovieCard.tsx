// MovieCard.tsx
import React, { useState } from "react";

interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: number;
  description?: string;
  director?: string;
  cast?: string[];
  rating?: number;
  releaseDate?: string;
  posterUrl?: string;
}

interface MovieCardProps {
  movie: Movie;
  onBookSeats: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onBookSeats }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Mock data for demonstration - replace with actual data from your API
  const mockDetails = {
    description: movie.description || "A captivating cinematic experience that will keep you on the edge of your seat. Filled with stunning visuals and compelling performances, this film is a must-watch for movie enthusiasts.",
    director: movie.director || "Christopher Nolan",
    cast: movie.cast || ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    rating: movie.rating || 8.5,
    releaseDate: movie.releaseDate || "2024",
    posterUrl: movie.posterUrl || `https://picsum.photos/seed/${movie.id}/300/400`
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "#0f172a",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: isHovered 
          ? "0 20px 30px -10px rgba(79, 70, 229, 0.4)" 
          : "0 8px 20px rgba(15,23,42,0.8)",
        transform: isHovered ? "translateY(-8px)" : "translateY(0)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        height: isHovered ? "auto" : "auto",
        minHeight: "320px",
      }}
    >
      {/* Poster Image */}
      <div style={{
        height: "180px",
        background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
        backgroundImage: `url(${mockDetails.posterUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}>
        {/* Rating Badge */}
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(0,0,0,0.8)",
          padding: "4px 8px",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <span style={{ color: "#fbbf24", fontSize: 14 }}>★</span>
          <span style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
            {mockDetails.rating}
          </span>
        </div>
      </div>

      {/* Basic Info - Always visible */}
      <div style={{ padding: 16 }}>
        <h2 style={{ 
          fontSize: 20, 
          fontWeight: "bold", 
          marginBottom: 4,
          color: "white",
          lineHeight: 1.2
        }}>
          {movie.title}
        </h2>
        <p style={{ 
          fontSize: 14, 
          color: "#94a3b8",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>{movie.genre}</span>
          <span>•</span>
          <span>{movie.duration} min</span>
          <span>•</span>
          <span>{mockDetails.releaseDate}</span>
        </p>

        {/* Hover Details - Only visible on hover */}
        {isHovered && (
          <div
            style={{
              marginTop: 12,
              animation: "fadeIn 0.3s ease",
            }}
          >
            <p style={{ 
              fontSize: 14, 
              color: "#cbd5e1",
              marginBottom: 12,
              lineHeight: 1.5
            }}>
              {mockDetails.description}
            </p>

            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                Director: <span style={{ color: "#cbd5e1" }}>{mockDetails.director}</span>
              </span>
              <span style={{ fontSize: 13, color: "#94a3b8", display: "block" }}>
                Cast: <span style={{ color: "#cbd5e1" }}>{mockDetails.cast.join(", ")}</span>
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookSeats();
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "white",
                fontSize: 16,
                fontWeight: "600",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.background = "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)";
              }}
            >
              🎟️ Book Seats
            </button>
          </div>
        )}

        {!isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookSeats();
            }}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: "#334155",
              color: "white",
              fontSize: 14,
              fontWeight: "500",
              marginTop: 12,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4f46e5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#334155";
            }}
          >
            View Details
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};