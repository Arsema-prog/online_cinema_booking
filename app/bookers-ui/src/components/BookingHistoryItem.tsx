import React, { useState } from 'react';
import { BookingHistoryModel } from '../services/historyService';
import { Calendar, Clock, MapPin, MonitorPlay, Ticket, Download, Loader2 } from 'lucide-react';
import { ticketGeneratorService } from '../services/ticketGeneratorService';
import { env } from '../env';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Props {
  booking: BookingHistoryModel;
}

export const BookingHistoryItem: React.FC<Props> = ({ booking }) => {
  const [downloading, setDownloading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-primary bg-primary/10 border-primary/20';
      case 'CANCELLED': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted border-border';
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
    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row gap-6">
      
      {/* Poster Thumbnail */}
      <div className="w-full md:w-32 h-48 md:h-auto rounded-2xl overflow-hidden shrink-0 shadow-sm border border-border bg-muted">
        <img 
          src={`${env.apiGatewayUrl}/api/v1/core/movies/${booking.movieId}/poster`} 
          alt={booking.movieTitle} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector('.fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full flex justify-center items-center fallback text-2xl filter grayscale opacity-50';
              fallback.textContent = '🎬';
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        
        {/* Header Details */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
            <h3 className="text-xl font-headline font-bold text-card-foreground">{booking.movieTitle}</h3>
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider", getStatusColor(booking.status))}>
              {booking.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm flex items-center mb-4 font-medium">
            <MapPin className="w-4 h-4 mr-1.5 opacity-70" /> {booking.cinemaName}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> Date</p>
              <p className="text-sm font-semibold text-foreground">{new Date(booking.showTime).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Time</p>
              <p className="text-sm font-semibold text-foreground">{new Date(booking.showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center"><MonitorPlay className="w-3 h-3 mr-1"/> Screen</p>
              <p className="text-sm font-semibold text-foreground">{booking.screenNumber}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center"><Ticket className="w-3 h-3 mr-1"/> Seats ({booking.seatCount ?? booking.seats.length})</p>
              <p className="text-sm font-semibold text-primary">{booking.seats.length ? booking.seats.join(', ') : 'Seat details unavailable'}</p>
            </div>
          </div>
          {booking.snacks && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Snacks Pre-ordered</p>
              <p className="text-sm font-semibold text-foreground">{booking.snacks}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-6 pt-4 border-t border-border gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Booked on {new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p className="text-xl font-headline font-black text-foreground mt-0.5">${booking.totalAmount.toFixed(2)}</p>
          </div>
          
          <div className="w-full sm:w-auto">
            {booking.status === 'CONFIRMED' && (
              <Button
                onClick={handleDownloadTicket}
                disabled={downloading}
                className="w-full sm:w-auto h-11 px-6 rounded-full font-bold gap-2 text-primary-foreground shadow-sm"
              >
                {downloading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>
                ) : (
                  <><Download className="w-4 h-4" /> Download e-Ticket</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
