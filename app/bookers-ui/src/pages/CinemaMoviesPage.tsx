import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useScreenings } from "../hooks/useScreenings";
import { MovieCard } from "../components/MovieCard";
import { Film, ArrowLeft, Building, MapPin } from 'lucide-react';
import { apiClient } from "../httpClient";

export const CinemaMoviesPage: React.FC = () => {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();
  const { screenings, loading, error } = useScreenings();
  const [cinema, setCinema] = useState<any>(null);

  useEffect(() => {
    if (cinemaId) {
      apiClient.get(`/api/v1/core/branches/${cinemaId}`)
        .then(res => setCinema(res.data))
        .catch(err => console.error("Failed to fetch cinema details", err));
    }
  }, [cinemaId]);

  if (loading || !cinema) {
    return (
      <div className="min-h-screen bg-background p-8 pt-24 space-y-6">
        <div className="max-w-6xl mx-auto">
          <div className="skeleton w-32 h-6 mb-8 rounded" />
          <div className="skeleton w-full h-32 rounded-2xl mb-12" />
          <div className="skeleton w-48 h-8 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[280px] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl max-w-md text-center border border-destructive/20 font-medium">
          {error}
        </div>
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
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-6xl mx-auto pb-20 animate-fadeIn">
        
        <button 
          onClick={() => navigate('/bookers/movies')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={20} /> Back to Cinemas
        </button>

        <div className="bg-card p-8 md:p-10 rounded-3xl mb-12 border border-border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Building className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-foreground font-headline text-4xl md:text-5xl font-black tracking-tight">{cinema.name}</h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground font-medium ml-[4.5rem]">
              <MapPin size={18} />
              <span>{cinema.address} • {cinema.city}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
          <Film className="h-8 w-8 text-primary" />
          <h2 className="text-foreground font-headline text-3xl font-bold">Available Movies</h2>
        </div>

        {moviesWithScreenings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-border border-dashed">
            <Film className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-foreground font-headline text-xl font-bold mb-2">No movies available</h3>
            <p className="text-muted-foreground">This cinema currently has no scheduled screenings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {moviesWithScreenings.map((item) => (
              <MovieCard
                key={item.movie.id}
                movie={item.movie}
                screenings={item.screenings}
                onBookSeats={(screeningId, seatType) => {
                  console.log(`Booking ${seatType} seats for screening ${screeningId}`);
                  navigate(`/bookers/booking/${screeningId}?seatType=${seatType}`);
                }}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
