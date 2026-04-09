import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBooking } from "../hooks/useBooking";
import { ChevronLeft, Ticket, Users, CreditCard, RefreshCw, Star } from 'lucide-react';
import { TicketDisplay } from '../components/TicketDisplay';
import { ticketGeneratorService, TicketDetails } from '../services/ticketGeneratorService';
import { apiClient } from "../httpClient";
import { env } from "../env";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
  const [remainingMs, setRemainingMs] = useState<number>(0);

  // Fetch screening and movie details
  useEffect(() => {
    const fetchScreeningDetails = async () => {
      try {
        const response = await apiClient.get(`/api/v1/core/screenings/${screeningId}`);
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

  const activeExternalHolds = seats.filter(
    (seat) =>
      seat.status === "HELD" &&
      !selectedSeats.some((selected) => selected.id === seat.id)
  ).length;

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

  // Fallback refresh (websocket is primary)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSeats();
    }, 45000);
    return () => clearInterval(interval);
  }, [refreshSeats]);

  useEffect(() => {
    if (!holdResponse?.expiresAtEpochMs) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(Math.max(0, holdResponse.expiresAtEpochMs! - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [holdResponse?.expiresAtEpochMs]);

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seat.rowLabel;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<string, typeof seats>);

  const rows = Object.keys(seatsByRow).sort();

  const getSeatColorClass = (seat: typeof seats[0]) => {
    if (selectedSeats.some(s => s.id === seat.id)) {
      return 'bg-primary text-primary-foreground border-primary hover:bg-primary/90';
    }
    
    switch (seat.status?.toUpperCase()) {
      case 'RESERVED':
        return 'bg-destructive/20 text-destructive border-transparent cursor-not-allowed opacity-50';
      case 'HELD':
        return 'bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-70';
      case 'CANCELLED':
        return 'bg-muted/50 text-muted-foreground border-transparent cursor-not-allowed opacity-50';
      case 'AVAILABLE':
        return 'bg-card text-card-foreground hover:border-primary hover:text-primary border-border';
      default:
        return 'bg-muted text-muted-foreground border-transparent opacity-50';
    }
  };

  if (loading && seats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
           <p className="text-muted-foreground font-medium">Loading interactive seat map</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-2xl text-center max-w-sm">
          <h2 className="text-destructive font-headline text-2xl font-bold mb-4">Session Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
              <ChevronLeft size={20} />
            </Button>
            <h1 className="font-headline text-xl md:text-3xl font-bold text-foreground tracking-tight">Select Seats</h1>
          </div>
          
          <Button variant="secondary" size="sm" onClick={handleManualRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Map'}</span>
          </Button>
        </div>

        {/* Movie Info Banner */}
        {movie && (
          <div className="bg-card border border-border rounded-3xl p-6 mb-12 flex flex-col md:flex-row gap-6 items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
            <div className="h-40 w-28 md:h-48 md:w-32 rounded-xl overflow-hidden shrink-0 bg-muted relative z-10 border border-border">
              {movie.id ? (
                <img src={`${env.apiGatewayUrl}/api/v1/core/movies/${movie.id}/poster`} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center h-full text-4xl">🎬</span>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left z-10 w-full">
              <h2 className="font-headline text-2xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">{movie.title}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <span className="px-3 py-1 bg-primary/10 rounded-max text-[10px] font-bold tracking-widest uppercase text-primary border border-primary/20">{movie.genre}</span>
                <span className="px-3 py-1 bg-muted rounded-max text-[10px] font-bold tracking-widest uppercase text-muted-foreground border border-border">{movie.duration} min</span>
                {movie.rating && (
                  <span className="px-3 py-1 bg-accent/10 rounded-max text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 text-accent border border-accent/20">
                    <Star size={12} className="fill-accent" /> {movie.rating}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2 md:line-clamp-3 mb-3">{movie.description}</p>
              {screening && (
                <div className="text-foreground text-sm font-semibold inline-flex items-center gap-2">
                  <span className="bg-primary px-2 py-1 rounded text-primary-foreground text-xs uppercase shadow-sm">Showtime</span>
                  {new Date(screening.startTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Screen visualization */}
        <div className="relative mb-20 text-center select-none pt-12">
          {/* Subtle Screen Curve */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] md:w-[60%] h-24 rounded-[100%] border-t-[8px] border-primary/30 blur-[2px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] md:w-[60%] h-24 rounded-[100%] border-t-[4px] border-primary/80" />
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[80%] md:w-[60%] h-32 bg-gradient-to-b from-primary/10 to-transparent blur-2xl pointer-events-none" />
          
          <p className="text-muted-foreground mt-8 text-xs uppercase tracking-[0.4em] font-bold">SCREEN</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 items-center justify-center mb-8">
          <LegendItem className="bg-card border border-border" label="Available" />
          <LegendItem className="bg-primary text-primary-foreground border-primary" label="Selected" />
          <LegendItem className="bg-muted border-transparent opacity-70" label="Held" />
          <LegendItem className="bg-destructive/20 border-transparent opacity-50" label="Reserved" />
        </div>

        {activeExternalHolds > 0 && (
          <div className="mb-8 p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm text-center font-medium">
            {activeExternalHolds} seat(s) are actively being looked at by others.
          </div>
        )}

        {/* Interactive Seat Map */}
        <div className="bg-card border border-border p-6 md:p-12 rounded-3xl overflow-x-auto shadow-sm relative">
          <div className="min-w-fit mx-auto">
            {rows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No seats configuration available.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {rows.map(row => (
                  <div key={row} className="flex items-center gap-4 md:gap-6 group">
                    <div className="w-6 md:w-8 font-headline font-bold text-muted-foreground/50 transition-colors group-hover:text-foreground">{row}</div>
                    
                    <div className="flex gap-2">
                       {seatsByRow[row]?.map((seat, index) => {
                         const isAisle = index === 7;
                         return (
                           <React.Fragment key={seat.id}>
                             {isAisle && <div className="w-6 md:w-8" />}
                             <button
                               onClick={() => toggleSeat(seat)}
                               disabled={seat.status !== 'AVAILABLE'}
                               className={cn(
                                 "w-9 h-9 md:w-11 md:h-11 rounded-t-lg rounded-b-sm border font-bold text-xs md:text-sm transition-all duration-200 flex items-center justify-center shadow-sm",
                                 getSeatColorClass(seat)
                               )}
                               title={`Row ${seat.seat.rowLabel}, Seat ${seat.seat.seatNumber} - $${seat.price}`}
                             >
                               {seat.seat.seatNumber.replace(seat.seat.rowLabel, '')}
                             </button>
                           </React.Fragment>
                         );
                       })}
                    </div>
                    
                    <div className="w-6 md:w-8 font-headline font-bold text-muted-foreground/50 text-right transition-colors group-hover:text-foreground">{row}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {holdError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-6 py-4 rounded-xl flex items-center gap-4 z-[100] shadow-xl animate-slideIn">
          <span className="font-medium text-sm">{holdError}</span>
          <Button variant="outline" size="sm" onClick={handleRetryHold} disabled={processing} className="text-destructive border-destructive hover:bg-destructive-foreground hover:text-destructive text-xs font-bold">
            {processing ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Cart Summary Bar - Sticky Bottom */}
      {hasSelectedSeats && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 md:p-6 z-50 animate-slideIn shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
            
            <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto overflow-hidden">
               <div className="flex-1 md:flex-none">
                 <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">
                   <Ticket size={12} /> Selected Seats
                 </div>
                 <div className="font-headline font-bold text-lg text-foreground truncate max-w-[250px]">
                   {selectedSeats.map(s => s.seat.seatNumber).join(', ')}
                 </div>
               </div>
               
               <div>
                 <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">
                   <Users size={12} /> Total Tickets
                 </div>
                 <div className="font-headline font-bold text-lg text-foreground">{selectedSeats.length}</div>
               </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
               {remainingMs > 0 && (
                 <div className="text-right">
                   <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Hold Expiration</div>
                   <div className={cn(
                     "font-headline font-bold text-xl tabular-nums",
                     remainingMs < 15000 ? "text-destructive animate-pulse" : "text-foreground"
                   )}>
                     {Math.floor(remainingMs / 60000).toString().padStart(2, "0")}:
                     {Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, "0")}
                   </div>
                 </div>
               )}
               
               <div className="text-right border-l border-border pl-4 md:pl-6">
                 <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Subtotal</div>
                 <div className="font-headline font-bold text-2xl text-primary">
                   ${totalAmount.toFixed(2)}
                 </div>
               </div>

               <Button 
                onClick={handleProceedToPayment} 
                className="gap-2 h-12 px-8 font-bold text-base w-full md:w-auto shrink-0 shadow-md"
                isLoading={processing || holdingSeats}
               >
                 <CreditCard size={18} />
                 Checkout
               </Button>
            </div>
            
          </div>
        </div>
      )}

      {/* Ticket Overlay */}
      {ticketDetails && (
        <TicketDisplay ticket={ticketDetails} onDownload={handleTicketDownload} onClose={handleTicketClose} />
      )}
    </div>
  );
};

const LegendItem: React.FC<{ className: string; label: string }> = ({ className, label }) => (
  <div className="flex items-center gap-2">
    <div className={cn("w-5 h-5 rounded border", className)} />
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
  </div>
);
