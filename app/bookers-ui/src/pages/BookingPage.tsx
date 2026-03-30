// pages/BookingPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBooking } from "../hooks/useBooking";
import { ChevronLeft, Ticket, Users, CreditCard, RefreshCw, Star } from 'lucide-react';
import { TicketDisplay } from '../components/TicketDisplay';
import { ticketGeneratorService, TicketDetails } from '../services/ticketGeneratorService';
import { coreClient } from "../httpClient";

export const BookingPage: React.FC = () => {
  const { screeningId } = useParams(); 
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUuid, setShowUuid] = useState<string>('');
  const [movie, setMovie] = useState<any>(null);
  const [screening, setScreening] = useState<any>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch screening and movie details
  useEffect(() => {
    const fetchScreeningDetails = async () => {
      try {
        const response = await coreClient.get(`/screenings/${screeningId}`);
        const screeningData = response.data;
        setScreening(screeningData);
        setMovie(screeningData.movie);
      } catch (err) {
        console.error("Failed to fetch screening details", err);
      }
    };
    
    if (screeningId) {
      fetchScreeningDetails();
    }
  }, [screeningId]);

  // Generate UUID from screeningId
  useEffect(() => {
    if (screeningId) {
      const paddedId = screeningId.padStart(12, '0');
      setShowUuid(`00000000-0000-0000-0000-${paddedId}`);
    }
  }, [screeningId]);

  const {
    seats,
    loading,
    error,
    selectedSeats,
    toggleSeat,
    holdSelectedSeats,
    refreshSeats,
    totalAmount,
    hasSelectedSeats,
    holdingSeats,
    holdResponse
  } = useBooking(Number(screeningId));

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshSeats();
    setRefreshing(false);
  };

  // Handle successful payment redirect from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      const bId = urlParams.get('bookingId');
      if (bId) {
        setShowUuid(bId);
        handlePaymentSuccess(bId);
      }
    } else if (urlParams.get('payment') === 'cancelled') {
      alert("Payment was cancelled or failed. Please try booking again.");
    }
  }, []);

  const handleProceedToPayment = async () => {
    setProcessing(true);
    setHoldError(null);
    console.log("booking id sent : ",)
    
    try {
      const response = await holdSelectedSeats();
      await refreshSeats();
      
      if (!response || !response.bookingId) {
        throw new Error("No booking ID returned from holding seats");
      }
      
      // Navigate to snack selection
      navigate('/bookers/snacks', {
        state: {
          bookingId: response.bookingId,
          showId: showUuid,
          seats: selectedSeats.map(s => s.seat.seatNumber),
          seatTotal: totalAmount,
          holdExpiresAt: response.expiresAt,
          holdExpiresAtEpochMs: response.expiresAtEpochMs
        }
      });
      
    } catch (error: any) {
      console.error("Error holding seats:", error);
      setHoldError(error.message || "Failed to hold seats. Please try again.");
      
      // Refresh seats to get latest status
      await refreshSeats();
      
      setProcessing(false);
    }
  };

  const handleRetryHold = async () => {
    setProcessing(true);
    setHoldError(null);
    setRetryCount(prev => prev + 1);
    
    try {
      const response = await holdSelectedSeats();
      await refreshSeats();
      
      if (!response || !response.bookingId) {
        throw new Error("No booking ID returned from holding seats");
      }
      
      // Navigate to snack selection
      navigate('/bookers/snacks', {
        state: {
          bookingId: response.bookingId,
          showId: showUuid,
          seats: selectedSeats.map(s => s.seat.seatNumber),
          seatTotal: totalAmount,
          holdExpiresAt: response.expiresAt,
          holdExpiresAtEpochMs: response.expiresAtEpochMs
        }
      });
      
    } catch (error: any) {
      console.error("Retry failed:", error);
      setHoldError(error.message || "Failed again. Please refresh the page.");
      setProcessing(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  const handlePaymentSuccess = async (bId: string) => {
    setProcessing(true);
    try {
      const generatedTicket = await ticketGeneratorService.getTicketDetails(bId);
      setTicketDetails(generatedTicket);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      alert("Payment succeeded but failed to fetch ticket. Please check your history.");
    } finally {
      setProcessing(false);
    }
  };

  const handleTicketDownload = () => {
    alert("Ticket PDF is downloading...");
  };

  const handleTicketClose = () => {
    setTicketDetails(null);
    navigate('/bookers');
  };

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSeats();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshSeats]);

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seat.rowLabel;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<string, typeof seats>);

  const rows = Object.keys(seatsByRow).sort();

  const getSeatColor = (seat: typeof seats[0]) => {
    if (selectedSeats.some(s => s.id === seat.id)) {
      return '#10b981'; // Selected - bright green
    }
    
    switch (seat.status?.toUpperCase()) {
      case 'RESERVED':
        return '#ef4444'; // Reserved - red
      case 'HELD':
        return '#f59e0b'; // Held - orange/amber
      case 'CANCELLED':
        return '#6b7280'; // Cancelled - gray
      case 'AVAILABLE':
        return '#1e293b'; // Available - dark slate
      default:
        return '#1e293b';
    }
  };

  if (loading && seats.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p>Loading seats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#0f172a', padding: 32, borderRadius: 16, textAlign: 'center', maxWidth: 400 }}>
          <h2 style={{ color: '#ef4444', marginBottom: 16 }}>Error</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
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

  return (
    <div className="bg-booking-gradient" style={{ minHeight: '100vh', color: 'white', paddingBottom: hasSelectedSeats ? 120 : 40, width: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate(-1)} style={{ background: '#1e293b', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#8b5cf6'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#1e293b'}>
              <ChevronLeft size={20} />
            </button>
            <h1 style={{ fontSize: 28, margin: 0 }}>Select Your Seats</h1>
          </div>
          
          <button onClick={handleManualRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#1e293b', border: 'none', borderRadius: 30, color: 'white', fontSize: 14, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.5 : 1 }}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Movie Poster and Info */}
        {movie && (
          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ width: '120px', height: '180px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '48px' }}>🎬</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'white' }}>{movie.title}</h2>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '20px', fontSize: '12px', color: '#a78bfa' }}>{movie.genre}</span>
                <span style={{ padding: '4px 12px', background: 'rgba(51, 65, 85, 0.8)', borderRadius: '20px', fontSize: '12px', color: '#94a3b8' }}>{movie.duration} min</span>
                {movie.rating && (
                  <span style={{ padding: '4px 12px', background: 'rgba(234, 179, 8, 0.2)', borderRadius: '20px', fontSize: '12px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={12} fill="#fbbf24" /> {movie.rating}
                  </span>
                )}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0', lineHeight: 1.5 }}>{movie.description || "No description available"}</p>
              {screening && (
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>Showtime: {new Date(screening.startTime).toLocaleString()}</div>
              )}
            </div>
          </div>
        )}

        {/* Screen visualization */}
        <div style={{ position: 'relative', marginBottom: 48, textAlign: 'center' }}>
          <div style={{ height: 8, background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)', width: '70%', margin: '0 auto', borderRadius: '4px 4px 0 0' }} />
          <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>SCREEN</p>
          <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontSize: 32 }}>🎬</div>
        </div>

        {/* Seat legend */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32, padding: '16px 24px', background: '#0f172a', borderRadius: 50, flexWrap: 'wrap' }}>
          <LegendItem color="#1e293b" label="Available" />
          <LegendItem color="#10b981" label="Selected" />
          <LegendItem color="#f59e0b" label="Held" />
          <LegendItem color="#ef4444" label="Reserved" />
          <LegendItem color="#6b7280" label="Cancelled" />
        </div>

        {/* Seat Map */}
        <div className="glass-panel" style={{ borderRadius: 24, padding: 32, marginBottom: 32, overflowX: 'auto' }}>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No seats available for this screening</div>
          ) : (
            <>
              <div style={{ minWidth: rows.length * 70 }}>
                {rows.map(row => (
                  <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <div style={{ width: 40, fontWeight: 'bold', color: '#94a3b8', fontSize: 18 }}>{row}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {seatsByRow[row]?.map((seat, index) => {
                        const isAisle = index === 7;
                        return (
                          <React.Fragment key={seat.id}>
                            {isAisle && <div style={{ width: 24 }} />}
                            <button
                              onClick={() => toggleSeat(seat)}
                              disabled={seat.status !== 'AVAILABLE'}
                              style={{
                                width: 45, height: 45, background: getSeatColor(seat),
                                border: selectedSeats.some(s => s.id === seat.id) ? '3px solid #8b5cf6' : 'none',
                                borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 'bold',
                                cursor: seat.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                                opacity: seat.status !== 'AVAILABLE' ? 0.5 : 1, transition: 'all 0.2s ease',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                              title={`Row ${seat.seat.rowLabel}, Seat ${seat.seat.seatNumber} - $${seat.price} (${seat.status})`}
                            >
                              {seat.seat.seatNumber.replace(seat.seat.rowLabel, '')}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 80, marginTop: 24, color: '#94a3b8', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 2, height: 24, background: '#334155' }} /><span>Left Aisle</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 2, height: 24, background: '#334155' }} /><span>Right Aisle</span></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Toast Notification */}
      {holdError && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          color: 'white',
          padding: '16px 24px',
          borderRadius: 12,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.3s ease'
        }}>
          <span>{holdError}</span>
          <button
            onClick={handleRetryHold}
            disabled={processing}
            style={{
              background: 'white',
              color: '#ef4444',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: processing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: processing ? 0.5 : 1
            }}
          >
            {processing ? 'Retrying...' : 'Retry'}
          </button>
          <button
            onClick={handleRefreshPage}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      )}

      {/* Fixed bottom booking summary */}
      {hasSelectedSeats && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0f172a', borderTop: '2px solid #1e293b', padding: '20px', boxShadow: '0 -8px 20px rgba(0,0,0,0.5)', zIndex: 50 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14, marginBottom: 4 }}><Ticket size={16} /><span>Selected Seats</span></div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{selectedSeats.map(s => s.seat.seatNumber).join(', ')}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14, marginBottom: 4 }}><Users size={16} /><span>Total Seats</span></div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{selectedSeats.length}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 14 }}>Total Amount</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${totalAmount.toFixed(2)}</div>
              </div>
              <button onClick={handleProceedToPayment} disabled={processing || holdingSeats} style={{ padding: '16px 40px', background: processing || holdingSeats ? '#334155' : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', color: 'white', border: 'none', borderRadius: 40, fontSize: 18, fontWeight: 'bold', cursor: processing || holdingSeats ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', gap: 8, opacity: processing || holdingSeats ? 0.5 : 1 }}>
                <CreditCard size={20} />
                {processing || holdingSeats ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Display */}
      {ticketDetails && (
        <TicketDisplay ticket={ticketDetails} onDownload={handleTicketDownload} onClose={handleTicketClose} />
      )}

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        } 
        .spin { 
          animation: spin 1s linear infinite; 
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 24, height: 24, background: color, borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', border: color === '#1e293b' ? '1px solid #334155' : 'none' }} />
    <span style={{ fontSize: 14 }}>{label}</span>
  </div>
);
