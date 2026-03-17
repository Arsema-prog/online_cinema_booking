// components/movies/MovieCard.tsx
import React, { useState } from "react";
import { Movie, Screening } from "../../types";

interface MovieCardProps {
  movie: Movie;
  screenings: Screening[];
  onBookSeats: (screeningId: number) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, screenings, onBookSeats }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<number | null>(
    screenings.length > 0 ? screenings[0].id : null
  );

  // Format date and time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedScreening) {
      onBookSeats(selectedScreening);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        borderRadius: 16,
        padding: 20,
        color: "white",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: isHovered 
          ? "0 20px 30px -10px rgba(139, 92, 246, 0.4)" 
          : "0 10px 20px -5px rgba(0, 0, 0, 0.5)",
        transform: isHovered ? "translateY(-8px)" : "translateY(0)",
        border: "2px solid",
        borderColor: isHovered ? '#8b5cf6' : 'transparent',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title and basic info */}
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
        {movie.title}
      </h2>
      
      <div style={{ color: "#94a3b8", marginBottom: 12 }}>
        {movie.genre} • {movie.duration} min
      </div>

      {/* Rating if available */}
      {movie.rating && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4, 
          marginBottom: 12,
          color: '#fbbf24'
        }}>
          <span>★</span>
          <span>{movie.rating.toFixed(1)}</span>
        </div>
      )}

      {/* Screening times - shown on hover */}
      {isHovered && screenings.length > 0 && (
        <div style={{
          marginBottom: 16,
          padding: 12,
          background: '#1e293b',
          borderRadius: 8,
          border: '1px solid #334155',
        }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Showtimes</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {screenings.map((screening) => (
              <button
                key={screening.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedScreening(screening.id);
                }}
                style={{
                  padding: '6px 12px',
                  background: selectedScreening === screening.id ? '#8b5cf6' : '#334155',
                  border: 'none',
                  borderRadius: 20,
                  color: 'white',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {formatTime(screening.startTime)}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
            {formatDate(screenings[0].startTime)}
          </p>
        </div>
      )}

      {/* Price and availability */}
      <div style={{ marginTop: 'auto', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#8b5cf6' }}>
            ${selectedScreening 
              ? screenings.find(s => s.id === selectedScreening)?.price.toFixed(2) 
              : screenings[0]?.price.toFixed(2)}
          </span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {selectedScreening 
              ? screenings.find(s => s.id === selectedScreening)?.availableSeats 
              : screenings[0]?.availableSeats} seats left
          </span>
        </div>
      </div>

      {/* Book button */}
      <button
        onClick={handleBookClick}
        disabled={!selectedScreening}
        style={{
          width: '100%',
          padding: '12px',
          background: !selectedScreening 
            ? '#334155' 
            : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: !selectedScreening ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: !selectedScreening ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (selectedScreening) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #9b6ef6 0%, #f472b6 100%)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          if (selectedScreening) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)';
          }
        }}
      >
        {selectedScreening ? 'Book Seats' : 'Select Showtime'}
      </button>
    </div>
  );
};