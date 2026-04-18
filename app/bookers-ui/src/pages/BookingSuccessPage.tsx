import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Download, Calendar, MapPin, Clock, Ticket as TicketIcon, Home, Popcorn } from 'lucide-react';
import { getBookingDetails, getBookingSeats } from '../api/bookingApi';
import { ticketGeneratorService } from '../services/ticketGeneratorService';
import { Button } from '@/components/ui/Button';

interface BookingDetails {
  id: string;
  movieTitle: string;
  cinemaName: string;
  screenNumber: string;
  showTime: string;
  seats: string[];
  totalAmount: number;
  snacks?: string;
  snacksTotal?: number;
  status: string;
  bookingDate: string;
}

export const BookingSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState<string | null>((location.state as any)?.bookingId || searchParams.get('bookingId') || null);
  
  const [emailFromSession] = useState<string | undefined>(() => {
    try {
      const cached = sessionStorage.getItem('bookers_last_checkout_email');
      return cached || undefined;
    } catch {
      return undefined;
    }
  });

  const [booking, setBooking] = useState<BookingDetails | null>((location.state as any)?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [downloading, setDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  const [showEmailNotice, setShowEmailNotice] = useState<boolean>(
    Boolean((location.state as any)?.emailConfirmationRequested || emailFromSession)
  );

  const displayEmailTarget = (location.state as any)?.emailTarget ?? emailFromSession;

  useEffect(() => {
    if (!booking && bookingId) {
      fetchBookingDetails();
    }
  }, [booking, bookingId]);

  useEffect(() => {
    if (!showEmailNotice && displayEmailTarget) {
      setShowEmailNotice(true);
    }
  }, [displayEmailTarget, showEmailNotice]);

  useEffect(() => {
    const fetchQrCode = async () => {
      if (booking) {
        try {
          const url = await ticketGeneratorService.getQrCodeUrl(booking.id);
          setQrCodeUrl(url);
        } catch (error) {
          console.error('Failed to fetch QR code:', error);
        }
      }
    };
    fetchQrCode();
  }, [booking]);

  const fetchBookingDetails = async (attempt: number = 0) => {
    if (!bookingId) return;
    try {
      const [bookingData, seatsData] = await Promise.all([
        getBookingDetails(bookingId),
        getBookingSeats(bookingId).catch(() => [])
      ]);

      const seatsList = seatsData.length > 0
        ? seatsData.map((seat) => seat.seatNumber || 'Seat')
        : [`Seat ${bookingData.seatCount || 1}`];
      
      setBooking({
        id: bookingData.id,
        movieTitle: bookingData.movieTitle || 'Movie',
        cinemaName: bookingData.branchName || 'Cinema',
        screenNumber: bookingData.screenName || 'Screen',
        showTime: bookingData.showTime || new Date().toISOString(),
        seats: seatsList,
        totalAmount: bookingData.totalAmount || 0,
        snacks: bookingData.snackDetails || (Array.isArray((location.state as any)?.snacks)
          ? (location.state as any).snacks.map((s: any) => `${s.quantity}x ${s.snack?.name || s.name}`).join(', ')
          : undefined),
        snacksTotal: bookingData.snacksTotal,
        status: bookingData.status,
        bookingDate: bookingData.createdAt || new Date().toISOString()
      });

      if (bookingData.status !== 'CONFIRMED' && attempt < 5) {
        setTimeout(() => fetchBookingDetails(attempt + 1), 1500);
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async () => {
    setDownloading(true);
    try {
      const pdfBlob = await ticketGeneratorService.generateTicket(booking!);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket_${booking!.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download ticket:', error);
      alert('Failed to download ticket. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
         <p className="text-muted-foreground font-headline font-bold">Finalizing your booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-sm w-full shadow-sm">
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4">Booking Not Found</h2>
          <p className="text-muted-foreground mb-6 text-sm">We couldn't retrieve your booking details.</p>
          <Button onClick={() => navigate('/bookers/movies')} className="w-full">
            Back to Movies
          </Button>
        </div>
      </div>
    );
  }

  const showDate = new Date(booking.showTime);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4 relative overflow-hidden">
      
      {/* Celebration Effects (Restructured to use Shadcn borders and clean layout instead of blur) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[60px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10 animate-fadeIn">
        
        {/* Success Header Area */}
        <div className="text-center mb-10 relative">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/bookers/movies')}
            className="absolute right-0 top-0 hidden md:flex items-center gap-2 rounded-full border-border bg-background hover:bg-muted text-foreground"
          >
            <Home size={14} /> Home
          </Button>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6 border border-green-500/20">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="font-headline text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">Booking Confirmed!</h1>
          <p className="text-muted-foreground font-medium mb-4">Your tickets are ready for the show.</p>
          <div className="text-xs font-bold bg-muted text-muted-foreground inline-block px-3 py-1 rounded border border-border font-mono tracking-widest">
             #{booking.id.substring(0, 8).toUpperCase()}
          </div>
        </div>

        {showEmailNotice && (
          <div className="mb-8 p-4 rounded-xl flex justify-between items-center bg-green-500/10 border border-green-500/20 shadow-sm">
            <div>
              <div className="font-bold text-green-600 dark:text-green-400 mb-0.5 text-sm">Confirmation Email Sent</div>
              <div className="text-xs font-medium text-green-600/80 dark:text-green-400/80">
                {displayEmailTarget ? `Sent to ${displayEmailTarget}` : 'Your booking details were emailed.'}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailNotice(false)}
              className="border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 text-xs shadow-none"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Digital Ticket Card */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border mb-8 relative">
          
          {/* Ticket Header */}
          <div className="bg-muted/50 p-6 md:p-8 border-b border-border relative overflow-hidden flex justify-between items-start">
             <div>
                <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3 inline-block">
                  Admit 1+
                </span>
                <h2 className="font-headline text-3xl font-black text-foreground leading-tight mb-2">{booking.movieTitle}</h2>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                  <MapPin size={16} className="text-primary" /> {booking.cinemaName}
                </div>
             </div>
             {qrCodeUrl && (
               <div className="bg-white p-2 rounded-xl shadow-sm border border-border shrink-0 hidden sm:block rotate-3 animate-fadeIn">
                 <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
               </div>
             )}
          </div>

          {/* Ticket Body Grid */}
          <div className="p-6 md:p-8 space-y-6 relative">
            <div className="grid grid-cols-2 gap-6 relative z-10">
              
              <div>
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest block mb-1 flex items-center gap-1.5"><Calendar size={12}/> Date</span>
                <span className="font-headline font-bold text-foreground text-lg">{showDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              
              <div>
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest block mb-1 flex items-center gap-1.5"><Clock size={12}/> Time</span>
                <span className="font-headline font-bold text-foreground text-lg">{showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div>
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest block mb-1 flex items-center gap-1.5"><MapPin size={12}/> Screen</span>
                <span className="font-headline font-bold text-foreground text-lg">{booking.screenNumber}</span>
              </div>

              <div>
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest block mb-1 flex items-center gap-1.5"><TicketIcon size={12}/> Seats</span>
                <span className="font-headline font-bold text-primary text-xl tracking-wide">{booking.seats.join(', ')}</span>
              </div>

            </div>

            {/* Snacks Section */}
            {booking.snacks && (
              <div className="pt-6 border-t border-border relative z-10">
                 <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Popcorn size={12}/> Add-ons</span>
                 <p className="text-foreground font-medium bg-muted/50 p-4 rounded-xl border border-border text-sm">{booking.snacks}</p>
              </div>
            )}

            {/* Total Paid */}
            <div className="pt-6 border-t border-border flex justify-between items-end relative z-10 bg-muted/30 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Total Paid</span>
              <span className="font-headline text-3xl font-black text-primary">
                ${booking.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
          
           {/* Mobile QR Code (Shows up only on small screens at the bottom) */}
           {qrCodeUrl && (
            <div className="bg-muted p-6 border-t border-border flex justify-center sm:hidden">
               <div className="bg-white p-3 rounded-xl shadow-sm">
                 <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
               </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownloadTicket}
            disabled={downloading}
            className="flex-1 rounded-xl h-14 font-bold gap-2 shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download size={18} />
            {downloading ? 'Generating...' : 'Download PDF Ticket'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/bookers/history')}
            className="flex-1 rounded-xl h-14 font-bold gap-2 bg-card hover:bg-muted text-foreground border-border"
          >
            <TicketIcon size={18} /> My Bookings
          </Button>
        </div>

      </div>
    </div>
  );
};
