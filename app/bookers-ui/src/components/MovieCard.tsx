
import React, { useState, useEffect } from "react";
import { Clock, Calendar, MapPin, ChevronDown, ChevronRight, Building, Ticket, Crown, Star } from 'lucide-react';

interface MovieCardProps {
  movie: any;
  screenings: any[];
  onBookSeats: (screeningId: string, seatType: 'regular' | 'vip') => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, screenings, onBookSeats }) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showAllDays, setShowAllDays] = useState(false);
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch additional movie details if needed
  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (movie.id && !movieDetails) {
        setLoadingDetails(true);
        try {
          // Assuming you have an endpoint to fetch movie details
          // const response = await coreClient.get(`/movies/${movie.id}`);
          // setMovieDetails(response.data);
          
          // For now, use the existing movie data
          setMovieDetails(movie);
        } catch (error) {
          console.error("Failed to fetch movie details:", error);
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    
    fetchMovieDetails();
  }, [movie.id, movie, movieDetails]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Get upcoming days (today + next 2 days) for filtering
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

  // Filter screenings for a specific cinema to only show upcoming days
  const getFilteredDaysForCinema = (screeningsByDay: any) => {
    const days = Object.keys(screeningsByDay);
    const filteredDays = showAllDays 
      ? days 
      : days.filter(day => upcomingDays.includes(day));
    
    // Sort days chronologically
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

  // Get regular and VIP prices
  const getRegularPrice = () => {
    if (screenings.length > 0 && screenings[0].price) {
      return screenings[0].price;
    }
    return movieDetails?.basePrice || movieDetails?.base_price || 12.99;
  };

  const getVipPrice = () => {
    const regularPrice = getRegularPrice();
    // VIP is typically 1.5x to 2x the regular price
    return (regularPrice * 1.8).toFixed(2);
  };

  // Handle booking with seat type
  const handleBookSeats = (screeningId: string, seatType: 'regular' | 'vip') => {
    onBookSeats(screeningId, seatType);
  };

  return (
    <div className="glass-card" style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Movie Poster */}
      <div style={{
        height: 200,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: '#1e1b4b'
      }}>
        {movie.posterUrl ? (
          <img 
            src={movie.posterUrl} 
            alt={movie.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.style.fontSize = '48px';
                fallback.textContent = '🎬';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <span style={{ fontSize: 48 }}>🎬</span>
        )}
        {movie.rating && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0,0,0,0.8)',
            padding: '4px 8px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fbbf24',
            zIndex: 1
          }}>
            ★ {movie.rating.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Movie Info */}
      <div style={{ 
        padding: 20,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          color: 'white', 
          fontSize: 20, 
          marginBottom: 8,
          fontWeight: 'bold'
        }}>
          {movie.title}
        </h3>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {movie.genre && (
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.2)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              color: '#c084fc'
            }}>
              {movie.genre}
            </div>
          )}
          {movie.duration && (
            <div style={{ 
              background: 'rgba(100, 116, 139, 0.2)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              color: '#94a3b8'
            }}>
              {movie.duration} min
            </div>
          )}
          {(movie.releaseDate || movie.release_date) && (
            <div style={{ 
              background: 'rgba(100, 116, 139, 0.2)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              color: '#94a3b8'
            }}>
              📅 {new Date(movie.releaseDate || movie.release_date).getFullYear()}
            </div>
          )}
          {movie.director && (
            <div style={{ 
              background: 'rgba(100, 116, 139, 0.2)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              color: '#94a3b8'
            }}>
              🎬 {movie.director}
            </div>
          )}
        </div>

        {movie.description && (
          <p style={{ 
            color: '#94a3b8', 
            fontSize: 14, 
            lineHeight: 1.5,
            marginBottom: 16
          }}>
            {movie.description.length > 120 
              ? `${movie.description.substring(0, 120)}...` 
              : movie.description}
          </p>
        )}

        {/* Showtimes Section */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 8,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
           
          </div>

          {cinemas.map((cinema, idx) => {
            const filteredDays = getFilteredDaysForCinema(cinema.screeningsByDay);
            const hasMore = hasMoreDays(cinema.screeningsByDay);
            
            return (
              <div key={idx} style={{ marginBottom: 24 }}>
               

                {/* Days for this cinema */}
                {filteredDays.map(day => {
                  const hourGroups = cinema.screeningsByDay[day];
                  const totalShows = Object.values(hourGroups).flat().length;
                  const isExpanded = expandedDays.has(`${idx}-${day}`);
                  
                  return (
                    <div key={day} style={{ marginBottom: 12 }}>
                      {/* Day Header */}
                      <div
                        onClick={() => toggleDay(`${idx}`, day)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 0 8px 12px',
                          cursor: 'pointer',
                          borderRadius: 8,
                          transition: 'background 0.2s',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} style={{ color: '#8b5cf6' }} />
                        ) : (
                          <ChevronRight size={14} style={{ color: '#8b5cf6' }} />
                        )}
                        <Calendar size={12} style={{ color: '#94a3b8' }} />
                        <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>
                          {day}
                        </span>
                        <span style={{ 
                          color: '#64748b', 
                          fontSize: 10,
                          marginLeft: 'auto'
                        }}>
                          {totalShows} show{totalShows !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Hour Groups */}
                      {isExpanded && (
                        <div style={{ 
                          marginLeft: 32,
                          marginTop: 8,
                          marginBottom: 8
                        }}>
                          {Object.entries(hourGroups).map(([hour, hourScreenings]) => (
                            <div key={hour} style={{ marginBottom: 12 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 8,
                                paddingLeft: 8
                              }}>
                                <Clock size={10} style={{ color: '#64748b' }} />
                                <span style={{ 
                                  color: '#94a3b8', 
                                  fontSize: 10,
                                  fontWeight: 500
                                }}>
                                  {hour}
                                </span>
                              </div>
                              
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: 8,
                                paddingLeft: 8
                              }}>
                                {hourScreenings.map((screening: any) => (
                                  <div key={screening.id} style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookSeats(screening.id, 'regular');
                                      }}
                                      style={{
                                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(139, 92, 246, 0.2))',
                                        border: '1px solid rgba(79, 70, 229, 0.4)',
                                        borderRadius: 20,
                                        padding: '6px 14px',
                                        fontSize: 12,
                                        color: '#c084fc',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontWeight: 500
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79, 70, 229, 0.4), rgba(139, 92, 246, 0.4))';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(139, 92, 246, 0.2))';
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                    >
                                      <Clock size={10} />
                                      {formatTime(screening.startTime)}
                                      {screening.screen && (
                                        <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                          REGULAR 
                                          • {screening.screen.name} 
                                        </span>
                                      )}
                                      {screening.availableRegularSeats !== undefined && (
      <span style={{ 
        fontSize: 10, 
        color: screening.availableRegularSeats > 10 ? '#4ade80' : screening.availableRegularSeats > 0 ? '#fbbf24' : '#ef4444',
        fontWeight: 'bold',
        marginLeft: 4
      }}>
        ({screening.availableRegularSeats} seats)
      </span>
    )}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookSeats(screening.id, 'vip');
                                      }}
                                      style={{
                                        background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(245, 158, 11, 0.2))',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                        borderRadius: 20,
                                        padding: '6px 10px',
                                        fontSize: 11,
                                        color: '#fbbf24',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontWeight: 500
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(217, 119, 6, 0.4), rgba(245, 158, 11, 0.4))';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(245, 158, 11, 0.2))';
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                    >
                                      <Crown size={20} />
                                      VIP
                                       {screening.availableVipSeats !== undefined && (
      <span style={{ 
        fontSize: 10, 
        color: screening.availableVipSeats > 5 ? '#4ade80' : screening.availableVipSeats > 0 ? '#fbbf24' : '#ef4444',
        fontWeight: 'bold'
      }}>
        ({screening.availableVipSeats} seats)
      </span>
    )}
                                    </button>
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
                  <button
                    onClick={() => setShowAllDays(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: 20,
                      padding: '6px 12px',
                      fontSize: 11,
                      color: '#8b5cf6',
                      cursor: 'pointer',
                      marginTop: 8,
                      marginLeft: 12,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Show all days →
                  </button>
                )}
              </div>
            );
          })}

          {/* Global Show All/Less button */}
          {!showAllDays && Object.values(groupedByCinema).some(cinema => hasMoreDays(cinema.screeningsByDay)) && (
            <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setShowAllDays(true)}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 16px',
                  fontSize: 12,
                  color: '#c084fc',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Show all upcoming showtimes
              </button>
            </div>
          )}

          {showAllDays && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={() => setShowAllDays(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 20,
                  padding: '6px 12px',
                  fontSize: 11,
                  color: '#8b5cf6',
                  cursor: 'pointer'
                }}
              >
                Show fewer days
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
