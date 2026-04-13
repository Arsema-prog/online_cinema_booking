import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, History } from 'lucide-react';
import { BookingHistoryModel, historyService } from '../services/historyService';
import { BookingHistoryItem } from '../components/BookingHistoryItem';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<BookingHistoryModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await historyService.getUserHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => filter === 'ALL' || item.status === filter);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 pt-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 p-6 md:p-8 bg-card border border-border rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/bookers/movies')}
              className="rounded-full shrink-0"
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
                <History className="w-8 h-8 text-primary" /> My Booking History
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">View your past tickets and reservations</p>
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="flex bg-muted p-1 rounded-xl border border-border">
            {['ALL', 'CONFIRMED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  filter === f 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex justify-center flex-col items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground font-medium text-sm">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border border-dashed p-12 text-center shadow-sm">
            <History className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-headline font-bold text-foreground mb-2">No bookings found</h3>
            <p className="text-muted-foreground text-sm">You haven't made any bookings that match this filter yet.</p>
            <Button
              onClick={() => navigate('/bookers/movies')}
              className="mt-6 font-bold"
            >
              Browse Movies
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHistory.map((booking) => (
              <BookingHistoryItem key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
