import React, { useState, useEffect } from "react";
import { Clock, Calendar, MapPin, ChevronDown, ChevronRight, Crown, Star } from 'lucide-react';
import { env } from '../env';
import { Button } from "@/components/ui/Button";

interface MovieCardProps {
  movie: any;
  screenings: any[];
  onBookSeats: (screeningId: string, seatType: 'regular' | 'vip') => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, screenings, onBookSeats }) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showAllDays, setShowAllDays] = useState(false);

  // Group screenings by cinema/branch first, then by day, then by hour
  const groupByCinemaAndDay = (screenings: any[]) => {
    const grouped: {
      [cinemaId: string]: {
        cinemaName: string;
        cinemaAddress?: string;
        screeningsByDay: {
          [day: string]: {
            [hour: string]: any[];
          }
        }
      }
    } = {};

    screenings.forEach(screening => {
      const branch = screening.screen?.branch;
      const cinemaId = branch?.id || 'unknown';
      const cinemaName = branch?.name || 'Unknown Cinema';
      const cinemaAddress = branch?.address || 'Address not available';
      
      if (!grouped[cinemaId]) {
        grouped[cinemaId] = {
          cinemaName,
          cinemaAddress,
          screeningsByDay: {}
        };
      }

      const date = new Date(screening.startTime);
      const day = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const hour = date.getHours();
      const hourKey = `${hour}:00 - ${hour + 1}:00`;
      
      if (!grouped[cinemaId].screeningsByDay[day]) {
        grouped[cinemaId].screeningsByDay[day] = {};
      }
      if (!grouped[cinemaId].screeningsByDay[day][hourKey]) {
        grouped[cinemaId].screeningsByDay[day][hourKey] = [];
      }
      
      grouped[cinemaId].screeningsByDay[day][hourKey].push(screening);
    });

    return grouped;
  };

  const groupedByCinema = groupByCinemaAndDay(screenings);
  const cinemas = Object.values(groupedByCinema);

  const toggleDay = (cinemaId: string, day: string) => {
    const key = `${cinemaId}-${day}`;
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedDays(newExpanded);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getUpcomingDays = () => {
    const today = new Date();
    const upcomingDays: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      upcomingDays.push(date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
    }
    
    return upcomingDays;
  };

  const upcomingDays = getUpcomingDays();

  const getFilteredDaysForCinema = (screeningsByDay: any) => {
    const days = Object.keys(screeningsByDay);
    const filteredDays = showAllDays 
      ? days 
      : days.filter(day => upcomingDays.includes(day));
    
    return filteredDays.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const hasMoreDays = (screeningsByDay: any) => {
    const days = Object.keys(screeningsByDay);
    return days.some(day => !upcomingDays.includes(day));
  };

  const handleBookSeats = (screeningId: string, seatType: 'regular' | 'vip') => {
    onBookSeats(screeningId, seatType);
  };

  return (
    <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      
      {/* Movie Poster */}
      <div className="relative h-48 w-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {movie ? (
          <img 
            src={`${env.apiGatewayUrl}/api/v1/core/movies/${movie.id}/poster`} 
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.className = 'text-5xl';
                fallback.textContent = '🎬';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <span className="text-5xl">🎬</span>
        )}
        
        {/* Gradient fade overlay to ensure rating pop */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />

        {movie.rating && (
          <div className="absolute top-3 right-3 bg-background/90 px-2 py-1 rounded-md flex items-center gap-1 border border-border shadow-sm">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-xs font-bold text-foreground">
              {movie.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      
      {/* Movie Info */}
      <div className="p-5 flex-1 flex flex-col overflow-y-auto">
        <h3 className="font-headline font-bold text-xl text-card-foreground mb-3 leading-tight">
          {movie.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {movie.genre && (
            <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">
              {movie.genre}
            </span>
          )}
          {movie.duration && (
            <span className="bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">
              {movie.duration} MIN
            </span>
          )}
          {(movie.releaseDate || movie.release_date) && (
            <span className="bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">
               {new Date(movie.releaseDate || movie.release_date).getFullYear()}
            </span>
          )}
        </div>

        {movie.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
            {movie.description}
          </p>
        )}

        {/* Showtimes Section */}
        <div className="mt-auto pt-4 border-t border-border">
          {cinemas.map((cinema, idx) => {
            const filteredDays = getFilteredDaysForCinema(cinema.screeningsByDay);
            const hasMore = hasMoreDays(cinema.screeningsByDay);
            
            return (
              <div key={idx} className="mb-4 last:mb-0">
                {/* Days for this cinema */}
                {filteredDays.map(day => {
                  const hourGroups = cinema.screeningsByDay[day];
                  const totalShows = Object.values(hourGroups).flat().length;
                  const isExpanded = expandedDays.has(`${idx}-${day}`);
                  
                  return (
                    <div key={day} className="mb-3">
                      {/* Day Header */}
                      <button
                        onClick={() => toggleDay(`${idx}`, day)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors focus:outline-none"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-primary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-primary" />
                        )}
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {day}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md">
                          {totalShows} show{totalShows !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {/* Hour Groups */}
                      {isExpanded && (
                        <div className="ml-6 mt-2 mb-4 space-y-4 border-l-2 border-border/50 pl-4 py-1">
                          {Object.entries(hourGroups).map(([hour, hourScreenings]) => (
                            <div key={hour} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                  {hour}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {hourScreenings.map((screening: any) => (
                                  <div key={screening.id} className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookSeats(screening.id, 'regular');
                                      }}
                                      className="h-8 gap-1.5 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary rounded-full px-3 text-xs"
                                    >
                                      <Clock className="h-3 w-3" />
                                      <span className="font-bold">{formatTime(screening.startTime)}</span>
                                      {screening.screen && (
                                        <span className="opacity-60 hidden sm:inline ml-1">• {screening.screen.name}</span>
                                      )}
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookSeats(screening.id, 'vip');
                                      }}
                                      className="h-8 gap-1.5 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-500 hover:text-yellow-600 rounded-full px-3 text-xs"
                                    >
                                      <Crown className="h-3 w-3" />
                                      <span className="font-bold">VIP</span>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Show More/Less button for this cinema */}
                {hasMore && !showAllDays && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllDays(true)}
                    className="ml-2 mt-2 h-8 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                  >
                    Show all days &rarr;
                  </Button>
                )}
              </div>
            );
          })}

          {/* Global Show Less button */}
          {showAllDays && (
            <div className="text-center mt-4 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllDays(false)}
                className="rounded-full text-xs"
              >
                Hide future days
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
