// pages/MoviesPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { coreClient } from "../httpClient";
import { Film, Building, MapPin, ChevronRight, Star, Search, X } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [allMovies, setAllMovies] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        const [moviesRes, cinemasRes, allMoviesRes] = await Promise.all([
          coreClient.get('/movies/trending'),
          coreClient.get('/branches'),
          coreClient.get('/movies')
        ]);
        setTrendingMovies(moviesRes.data);
        setCinemas(cinemasRes.data);
        setAllMovies(allMoviesRes.data || []);
      } catch (err) {
        console.error("Failed to fetch movies or cinemas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const results = allMovies.filter(m =>
        (m.title || '').toLowerCase().includes(q)
      );
      setSearchResults(results);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allMovies]);

  const isSearching = searchQuery.trim().length > 0;
  const displayMovies = isSearching ? searchResults : trendingMovies;

  if (loading) {
    return (
      <div className="bg-cinema-gradient" style={{ minHeight: '100vh', padding: 20 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ color: 'white', fontSize: 32, marginBottom: 24 }}><div className="skeleton" style={{ width: '200px', height: '40px', borderRadius: 8 }}></div></h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card skeleton" style={{ height: 450, borderRadius: 16 }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cinema-gradient" style={{ 
      maxWidth: '100vw', 
      padding: 20,
      minHeight: '100vh',
      width: '100%'
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "60px" }}>

        {/* Search Bar */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            position: 'relative',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8b5cf6',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search movies by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 48px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '14px',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                backdropFilter: 'blur(8px)',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results or Trending Section */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Film style={{ color: '#8b5cf6' }} size={28} />
            <h2 style={{ fontSize: '28px', margin: 0, color: 'white' }}>
              {isSearching
                ? `Search results for "${searchQuery}"${searching ? '' : ` (${searchResults.length})`}`
                : 'Trending This Week'
              }
            </h2>
          </div>
          
          {searching ? (
            <div style={{ display: 'flex', gap: '24px', paddingBottom: '20px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ minWidth: '220px', height: '380px', borderRadius: '16px', flexShrink: 0 }} />
              ))}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              overflowX: isSearching ? 'visible' : 'auto',
              flexWrap: isSearching ? 'wrap' : 'nowrap',
              gap: '24px', 
              paddingBottom: '20px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#8b5cf6 rgba(255,255,255,0.05)'
            }}>
              {displayMovies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/bookers/movies/${movie.id}`)}
                  style={{
                    minWidth: '220px',
                    width: isSearching ? '220px' : undefined,
                    background: 'rgba(30, 41, 59, 0.7)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ height: '300px', background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title || 'Movie poster'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '48px' }}>🎬</span>
                    )}
                    {movie.rating != null && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>
                        <Star size={12} fill="#fbbf24" /> {movie.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px', color: 'white' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px' }}>
                      <span>{movie.genre}</span>
                      <span>{movie.duration}m</span>
                    </div>
                  </div>
                </div>
              ))}
              {displayMovies.length === 0 && (
                <div style={{ color: '#94a3b8', textAlign: 'center', width: '100%', padding: '40px 0' }}>
                  {isSearching ? `No movies found matching "${searchQuery}"` : 'No trending movies available.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cinematic Locations Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Building style={{ color: '#8b5cf6' }} size={28} />
            <h2 style={{ fontSize: '28px', margin: 0, color: 'white' }}>Available Cinemas</h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {cinemas.map((cinema) => (
              <div 
                key={cinema.id}
                onClick={() => navigate(`/bookers/cinemas/${cinema.id}/movies`)}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ color: 'white' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>{cinema.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                    <MapPin size={14} />
                    {cinema.address}
                  </div>
                </div>
                <ChevronRight style={{ color: '#8b5cf6' }} />
              </div>
            ))}
            {cinemas.length === 0 && (
              <p style={{ color: '#94a3b8' }}>Loading cinemas...</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
