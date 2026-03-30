import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Ticket, Download, Calendar, MapPin, Clock, Users, CreditCard } from 'lucide-react';
import { ticketGeneratorService } from '../services/ticketGeneratorService';

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
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id');
 const stateBookingId = (location.state as any)?.bookingId;
  const [bookingId, setBookingId] = useState<string | null>(stateBookingId || null);

  const [booking, setBooking] = useState<BookingDetails | null>(
    (location.state as any)?.booking || null
  );
  const [loading, setLoading] = useState(!booking);
  const [downloading, setDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showEmailNotice, setShowEmailNotice] = useState<boolean>(
    Boolean((location.state as any)?.emailConfirmationRequested)
  );
  const emailTarget = (location.state as any)?.emailTarget as string | undefined;

useEffect(() => {

  if (!booking && bookingId) {
    fetchBookingDetails();
  }
}, [booking, bookingId]);

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

 const fetchBookingDetails = async () => {
  try {
    // Fetch booking details
    const bookingResponse = await fetch(`http://localhost:8082/bookings/${bookingId}`);
    if (!bookingResponse.ok) throw new Error('Booking fetch failed');
    const bookingData = await bookingResponse.json();
    console.log("movies", bookingData );
    
    // Fetch seats for this booking
    const seatsResponse = await fetch(`http://localhost:8082/bookings/${bookingId}/seats`);
    let seatsList: string[] = [];
    
    if (seatsResponse.ok) {
      const seatsData = await seatsResponse.json();
      seatsList = seatsData.map((seat: any) => seat.seatNumber || seat);
    } else {
      // Fallback: Use booking data or default
      seatsList = bookingData.seats || [`Seat ${bookingData.seatCount || 1}`];
    }
    
    setBooking({
      id: bookingData.id,
      movieTitle: bookingData.movieTitle || 'Movie',
      cinemaName: bookingData.branchName || 'Cinema',
      screenNumber: bookingData.screenName || 'Screen',
      showTime: bookingData.showTime,
      seats: seatsList,
      totalAmount: bookingData.totalAmount || 0,
      snacks: bookingData.snackDetails || (Array.isArray((location.state as any)?.snacks)
        ? (location.state as any).snacks.map((s: any) => `${s.quantity}x ${s.snack?.name || s.name}`).join(', ')
        : undefined),
      snacksTotal: bookingData.snacksTotal,
      status: bookingData.status,
      bookingDate: bookingData.createdAt
    });
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Booking Not Found</h2>
          <button onClick={() => navigate('/bookers/movies')} className="px-6 py-2 bg-indigo-600 rounded-lg">
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12">
  <div className="max-w-2xl mx-auto px-4">

    {/* Success Header */}
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 mb-4">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>
      <h1 className="text-5xl font-bold mb-2">Booking Confirmed! 🎉</h1>
      <p className="text-4xl">Your tickets have been confirmed and are ready</p>
      <p className="text-4xltext-sm mt-2">Booking ID: {booking.id.substring(0, 8)}...</p>
    </div>

    {showEmailNotice && (
      <div
        style={{
          marginBottom: 16,
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid rgba(16,185,129,0.45)',
          background: 'rgba(6,78,59,0.35)',
          color: '#bbf7d0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>Confirmation email sent</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {emailTarget ? `Sent to ${emailTarget}` : 'Your booking confirmation was emailed.'}
          </div>
        </div>
        <button
          onClick={() => setShowEmailNotice(false)}
          style={{
            border: 'none',
            background: 'rgba(15,23,42,0.55)',
            color: '#bbf7d0',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          Dismiss
        </button>
      </div>
    )}

    {/* Ticket Table */}
    <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 mb-6 relative overflow-hidden ticket-shape">

      {/* Cut circles (ticket perforation) */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full z-20"></div>
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full z-20"></div>
      <div className="absolute left-0 right-0 top-1/2 flex justify-center">
        <div className="w-[90%] border-t-2 border-dashed border-slate-700"></div>
      </div>

      <table className="w-full text-left border-collapse text-white">
        <tbody>
          <tr className="bg-slate-900/50 border-b border-slate-700">
            <td className="px-4 py-3 font-semibold">Movie</td>
            <td className="px-4 py-3">{booking.movieTitle}</td>
          </tr>
          <tr className="border-b border-slate-700">
            <td className="px-4 py-3 font-semibold">Cinema</td>
            <td className="px-4 py-3">{booking.cinemaName}</td>
          </tr>
          <tr className="bg-slate-900/50 border-b border-slate-700">
            <td className="px-4 py-3 font-semibold">Screen</td>
            <td className="px-4 py-3">{booking.screenNumber}</td>
          </tr>
          <tr className="border-b border-slate-700">
            <td className="px-4 py-3 font-semibold">Date</td>
            <td className="px-4 py-3">{new Date(booking.showTime).toLocaleDateString()}</td>
          </tr>
          <tr className="bg-slate-900/50 border-b border-slate-700">
            <td className="px-4 py-3 font-semibold">Time</td>
            <td className="px-4 py-3">{new Date(booking.showTime).toLocaleTimeString()}</td>
          </tr>
          <tr className="border-b border-slate-700">
            <td className="px-4 py-3 font-semibold">Seats</td>
            <td className="px-4 py-3 text-amber-400">{booking.seats.join(', ')} ({booking.seats.length})</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-semibold">Total Paid</td>
            <td className="px-4 py-3 text-indigo-400 text-xl font-bold">
              ${booking.totalAmount.toFixed(2)}
            </td>
          </tr>
          {booking.snacks && (
            <tr className="border-t border-slate-700">
              <td className="px-4 py-3 font-semibold">Snacks</td>
              <td className="px-4 py-3 text-pink-300">{booking.snacks}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* QR Code */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg">
        <img
          src={qrCodeUrl || ''}
          alt="Ticket QR"
          className="w-24 h-24"
        />
      </div>
    </div>

    {/* Buttons */}
    <div className="flex gap-4">
      <button
        onClick={handleDownloadTicket}
         style={{
                  flex: 1,
                  padding: '14px',
                  background:'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow:  '0 4px 12px rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity:  1
                }}
        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
        disabled={downloading}
      >
        <Download size={20} />
        {downloading ? 'Generating...' : 'Download Ticket'}
      </button>
      <button
        onClick={() => navigate('/bookers/history')}
         style={{
                  flex: 1,
                  padding: '14px',
                  background:'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow:  '0 4px 12px rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity:  1
                }}
        className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold"
      >
        View My Bookings
      </button>
    </div>

    {/* Ticket Shape CSS */}
    <style>{`
      .ticket-shape {
        clip-path: polygon(
          0% 0%,
          100% 0%,
          100% 20%,
          95% 25%,
          100% 30%,
          100% 70%,
          95% 75%,
          100% 80%,
          100% 100%,
          0% 100%,
          0% 80%,
          5% 75%,
          0% 70%,
          0% 30%,
          5% 25%,
          0% 20%
        );
      }
    `}</style>
  </div>
</div>
  );
};
