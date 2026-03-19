// pages/MoviesPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useScreenings } from "../hooks/useScreenings";
import { MovieCard } from "../components/movies/MovieCard";
import { Film, Sparkles, RefreshCw } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const { screenings, loading, error, refreshScreenings } = useScreenings();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshScreenings();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#020617', 
        color: 'white',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            border: '4px solid #8b5cf6', 
            borderTopColor: 'transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Loading amazing movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#020617', 
        color: 'white',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          background: '#0f172a', 
          padding: 32, 
          borderRadius: 16, 
          textAlign: 'center',
          maxWidth: 400 
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: 16 }}>Error</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>{error}</p>
          <button
            onClick={handleRefresh}
            style={{
              padding: '12px 24px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!screenings || screenings.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#020617', 
        color: 'white',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <Film size={64} style={{ color: '#334155', marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>No Movies Available</h2>
          <p style={{ color: '#94a3b8' }}>Check back later for new releases</p>
        </div>
      </div>
    );
  }

  // Group screenings by movie ID to avoid duplicates
  const moviesMap = new Map();
  
  screenings.forEach((screening) => {
    const movieId = screening.movie.id;
    
    if (!moviesMap.has(movieId)) {
      // First time seeing this movie - create entry with movie and empty screenings array
      moviesMap.set(movieId, {
        movie: screening.movie,
        screenings: []
      });
    }
    
    // Add this screening to the movie's screenings array
    moviesMap.get(movieId).screenings.push(screening);
  });

  // Convert map to array for rendering
  const moviesWithScreenings = Array.from(moviesMap.values());
  
  // Optional: Sort movies by title or by soonest screening
  moviesWithScreenings.sort((a, b) => {
    // Sort by movie title
    return a.movie.title.localeCompare(b.movie.title);
  });

  console.log('Grouped movies:', moviesWithScreenings.map(m => ({
    title: m.movie.title,
    screeningCount: m.screenings.length
  })));

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: "0 auto", 
      padding: 20,
      background: '#020617',
      minHeight: '100vh'
    }}>
      {/* Header with refresh button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles style={{ color: '#8b5cf6' }} size={20} />
            <span style={{ color: '#8b5cf6', fontSize: 14 }}>Cinema Experience</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 32, margin: 0 }}>Now Showing 🍿</h1>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#1e293b',
            border: 'none',
            borderRadius: 30,
            color: 'white',
            fontSize: 14,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.5 : 1
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Movies grid - each movie appears once */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}
      >
        {moviesWithScreenings.map((item) => (
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};