import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../httpClient";
import { Film, Building, MapPin, ChevronRight, Star, Search, X } from 'lucide-react';
import { env } from '../env';
import { Input } from "@/components/ui/Input";

const toArray = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.content)) return record.content as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (record.data && typeof record.data === "object") {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.content)) return nested.content as T[];
    }
  }
  return [];
};

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
      setLoading(true);
      const [moviesRes, cinemasRes, allMoviesRes] = await Promise.allSettled([
        apiClient.get('/api/v1/core/movies/trending'),
        apiClient.get('/api/v1/core/branches'),
        apiClient.get('/api/v1/core/movies')
      ]);

      if (moviesRes.status === "fulfilled") {
        setTrendingMovies(toArray<any>(moviesRes.value.data));
      } else {
        console.error("Failed to fetch trending movies", moviesRes.reason);
        setTrendingMovies([]);
      }

      if (cinemasRes.status === "fulfilled") {
        setCinemas(toArray<any>(cinemasRes.value.data));
      } else {
        console.error("Failed to fetch branches", cinemasRes.reason);
        setCinemas([]);
      }

      if (allMoviesRes.status === "fulfilled") {
        setAllMovies(toArray<any>(allMoviesRes.value.data));
      } else {
        console.error("Failed to fetch all movies", allMoviesRes.reason);
        setAllMovies([]);
      }

      setLoading(false);
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
  const displayMovies = toArray<any>(isSearching ? searchResults : trendingMovies);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="skeleton w-64 h-12 rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-[400px] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-6xl mx-auto pb-20 space-y-16 animate-fadeIn">

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none group-focus-within:text-primary transition-colors" />
          <Input
            id="movie-search"
            type="text"
            placeholder="Search movies by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 rounded-full bg-card border-border text-lg shadow-sm focus-visible:ring-primary/50"
            aria-label="Search movies by title"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear movie search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Film className="h-8 w-8 text-primary" />
            <h2 className="font-headline text-3xl font-bold text-foreground">
              {isSearching
                ? `Search results for "${searchQuery}"${searching ? '' : ` (${searchResults.length})`}`
                : 'Trending This Week'
              }
            </h2>
          </div>
          
          {searching ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                 <div key={i} className="skeleton h-[420px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayMovies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => navigate(`/bookers/movies/${movie.id}`, { state: { title: movie.title } })}
                  className="group relative flex flex-col text-left bg-card overflow-hidden rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
                  aria-label={`Open details for ${movie.title || 'movie'}`}
                >
                  <div className="relative aspect-[2/3] w-full bg-muted overflow-hidden">
                    {movie.id ? (
                      <img
                        src={`${env.apiGatewayUrl}/api/v1/core/movies/${movie.id}/poster`}
                        alt={movie.title || 'Movie poster'}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl">🎬</div>
                    )}
                    
                    {/* Dark gradient mapping inside the card top to ensure readability of rating */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/80 to-transparent opacity-80" />
                    
                    {movie.rating != null && (
                      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 border border-border">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="text-xs font-bold text-foreground">{movie.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-headline text-lg font-bold text-card-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">{movie.title}</h3>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm bg-muted text-muted-foreground">{movie.genre || "Action"}</span>
                      <span className="text-xs font-medium text-muted-foreground">{movie.duration}m</span>
                    </div>
                  </div>
                </button>
              ))}
              {displayMovies.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-border border-dashed">
                  {isSearching ? `No movies found matching "${searchQuery}"` : 'No trending movies available.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cinemas Section */}
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Building className="h-8 w-8 text-muted-foreground" />
            <h2 className="font-headline text-3xl font-bold text-foreground">Available Cinemas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cinemas.map((cinema) => (
              <button
                key={cinema.id}
                onClick={() => navigate(`/bookers/cinemas/${cinema.id}/movies`)}
                className="group flex flex-col items-start p-6 bg-card rounded-2xl border border-border hover:border-primary/50 shadow-sm transition-all duration-300"
                aria-label={`Browse movies for ${cinema.name}`}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <h3 className="font-headline text-xl font-bold text-card-foreground group-hover:text-primary transition-colors">{cinema.name}</h3>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{cinema.address}</span>
                </div>
              </button>
            ))}
            {cinemas.length === 0 && (
              <div className="col-span-full py-8 text-muted-foreground">Loading cinemas...</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
