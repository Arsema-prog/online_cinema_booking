import React, { useState } from 'react';
import { BookingHistoryModel, historyService } from '../services/historyService';
import { Calendar, Clock, MapPin, MonitorPlay, Ticket, Download } from 'lucide-react';
import { ticketGeneratorService } from '../services/ticketGeneratorService';

interface Props {
  booking: BookingHistoryModel;
}

export const BookingHistoryItem: React.FC<Props> = ({ booking }) => {
  const [downloading, setDownloading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
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

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl flex flex-col md:flex-row gap-6">
      
      {/* Poster Thumbnail */}
      <div className="w-full md:w-32 h-48 md:h-auto rounded-xl overflow-hidden shrink-0 shadow-lg border border-slate-700">
        <img src={booking.posterUrl} alt={booking.movieTitle} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        
        {/* Header Details */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-white">{booking.movieTitle}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm flex items-center mb-4">
            <MapPin className="w-4 h-4 mr-1" /> {booking.cinemaName}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> Date</p>
              <p className="text-sm font-semibold text-white">{new Date(booking.showTime).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Time</p>
              <p className="text-sm font-semibold text-white">{new Date(booking.showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><MonitorPlay className="w-3 h-3 mr-1"/> Screen</p>
              <p className="text-sm font-semibold text-white">{booking.screenNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><Ticket className="w-3 h-3 mr-1"/> Seats ({booking.seatCount ?? booking.seats.length})</p>
              <p className="text-sm font-semibold text-amber-400">{booking.seats.length ? booking.seats.join(', ') : 'Seat details unavailable'}</p>
            </div>
          </div>
          {booking.snacks && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Snacks</p>
              <p className="text-sm font-semibold text-pink-300">{booking.snacks}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-700/50">
          <div>
            <p className="text-xs text-slate-500">Booked on {new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p className="text-lg font-bold text-white mt-1">${booking.totalAmount.toFixed(2)}</p>
          </div>
          
          <div className="flex gap-3">
            {booking.status === 'CONFIRMED' && (
              <button
                onClick={handleDownloadTicket}
                disabled={downloading}
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
                className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-semibold transition-colors border border-indigo-600/30 flex items-center gap-2"
              >
                {downloading ? (
                  <span className="opacity-50 flex items-center gap-2">Downloading...</span>
                ) : (
                  <><Download className="w-4 h-4" /> Download e-Ticket</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
