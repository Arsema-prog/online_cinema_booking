import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useScreenings } from "../hooks/useScreenings";
import { MovieCard } from "../components/MovieCard";
import { Film, ArrowLeft, Building, MapPin } from 'lucide-react';
import { coreClient } from "../httpClient";

export const CinemaMoviesPage: React.FC = () => {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();
  const { screenings, loading, error } = useScreenings();
  const [cinema, setCinema] = useState<any>(null);

  useEffect(() => {
    if (cinemaId) {
      coreClient.get(`/branches/${cinemaId}`)
        .then(res => setCinema(res.data))
        .catch(err => console.error("Failed to fetch cinema details", err));
    }
  }, [cinemaId]);

  if (loading || !cinema) {
    return (
      <div className="bg-cinema-gradient" style={{ minHeight: '100vh', padding: 20 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="skeleton" style={{ width: '200px', height: '40px', borderRadius: 8 }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ef4444' }}>{error}</div>
      </div>
    );
  }

  // Filter screenings for this cinema
  const cinemaScreenings = screenings.filter(
    (s: any) => s.screen?.branch?.id === Number(cinemaId)
  );

  // Group screenings by movie
  const moviesMap = new Map();
  cinemaScreenings.forEach((screening) => {
    const movieId = screening.movie.id;
    if (!moviesMap.has(movieId)) {
      moviesMap.set(movieId, { movie: screening.movie, screenings: [] });
    }
    moviesMap.get(movieId).screenings.push(screening);
  });

  const moviesWithScreenings = Array.from(moviesMap.values());

  return (
    <div className="bg-cinema-gradient" style={{ minHeight: '100vh', padding: 20 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "60px" }}>
        
        <button 
          onClick={() => navigate('/bookers/movies')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', 
            border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: 24 
          }}
        >
          <ArrowLeft size={20} /> Back to Cinemas
        </button>

        <div style={{ 
          background: 'rgba(30, 41, 59, 0.7)', padding: 32, borderRadius: 16, 
          marginBottom: 40, border: '1px solid rgba(139, 92, 246, 0.3)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Building size={32} color="#8b5cf6" />
            <h1 style={{ color: 'white', fontSize: 32, margin: 0 }}>{cinema.name}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
            <MapPin size={16} />
            <span>{cinema.address} • {cinema.city}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Film size={24} color="#8b5cf6" />
          <h2 style={{ color: 'white', fontSize: 24, margin: 0 }}>Available Movies</h2>
        </div>

        {moviesWithScreenings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'rgba(30,30,40,0.4)', borderRadius: 16 }}>
            <Film size={48} color="#475569" style={{ marginBottom: 16 }} />
            <h3 style={{ color: 'white' }}>No movies available</h3>
            <p style={{ color: '#94a3b8' }}>This cinema currently has no scheduled screenings.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}>
            
{moviesWithScreenings.map((item) => {
  return (
    <MovieCard
  key={item.movie.id}
  movie={item.movie}
  screenings={item.screenings}
  onBookSeats={(screeningId, seatType) => {
    console.log(`Booking ${seatType} seats for screening ${screeningId}`);
    navigate(`/bookers/booking/${screeningId}?seatType=${seatType}`);
  }}
/>
  );
})}
            
          </div>
        )}

      </div>
    </div>
  );
};
