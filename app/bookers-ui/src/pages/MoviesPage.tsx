// pages/MoviesPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useScreenings } from "../hooks/useScreenings";
import { MovieCard } from "../components/movies/MovieCard";
import { MovieWithScreenings } from "../types";

export const MoviesPage: React.FC = () => {
  const { screenings, loading, error } = useScreenings();
  const navigate = useNavigate();

  if (loading) return (
    <div style={{ color: 'white', textAlign: 'center', padding: 40 }}>
      Loading movies...
    </div>
  );

  if (error) return (
    <div style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>
      Error: {error}
    </div>
  );

  if (!screenings || screenings.length === 0) {
    return (
      <div style={{ color: 'white', textAlign: 'center', padding: 40 }}>
        No movies available
      </div>
    );
  }

  // Group screenings by movie
  const moviesMap = new Map<number, MovieWithScreenings>();
  
  screenings.forEach((screening) => {
    const movieId = screening.movie.id;
    if (!moviesMap.has(movieId)) {
      moviesMap.set(movieId, {
        movie: screening.movie,
        screenings: [],
      });
    }
    moviesMap.get(movieId)!.screenings.push(screening);
  });

  const movies = Array.from(moviesMap.values());

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
      <h1 style={{ color: "white", marginBottom: 24 }}>Now Showing 🍿</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}
      >
        {movies.map((item) => (
          <MovieCard
            key={item.movie.id}
            movie={item.movie}
            screenings={item.screenings}
            onBookSeats={(screeningId) =>
              navigate(`/bookers/booking/${screeningId}`)
            }
          />
        ))}
      </div>
    </div>
  );
};