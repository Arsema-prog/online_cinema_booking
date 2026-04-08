// app/bookers-ui/src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { apiClient } from '../httpClient';
import { Film, MapPin, Building, Star, ChevronRight, LogIn, UserPlus } from 'lucide-react';

const HomePage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/bookers/movies');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [moviesRes, cinemasRes] = await Promise.allSettled([
        apiClient.get('/api/v1/core/movies/trending'),
        apiClient.get('/api/v1/core/branches')
      ]);

      if (moviesRes.status === "fulfilled") {
        setTrendingMovies(Array.isArray(moviesRes.value.data) ? moviesRes.value.data : []);
      } else {
        console.error("Failed to fetch trending movies", moviesRes.reason);
        setTrendingMovies([]);
      }

      if (cinemasRes.status === "fulfilled") {
        setCinemas(Array.isArray(cinemasRes.value.data) ? cinemasRes.value.data : []);
      } else {
        console.error("Failed to fetch branches", cinemasRes.reason);
        setCinemas([]);
      }
    };
    fetchData();
  }, []);

  const handleRegister = () => {
    navigate('/register');
  };

  if (loading) return null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      fontFamily: 'Inter, sans-serif',
      color: 'white',
      overflowX: 'hidden'
    }}>
      {/* Header / Hero Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(10px)',
      }}>
        <h1 style={{ marginBottom: '16px', fontSize: '48px', fontWeight: 'bold', background: 'linear-gradient(to right, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Welcome to Bookers
        </h1>
        <p style={{ marginBottom: '32px', color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
          Experience cinema like never before. Sign in to discover trending movies, pick your favorite seats, and book instantly.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={login}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)'; }}
          >
            <LogIn size={18} /> Login to Book
          </button>
          
          <button
            onClick={handleRegister}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <UserPlus size={18} /> Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
