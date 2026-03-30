import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, History } from 'lucide-react';
import { BookingHistoryModel, historyService } from '../services/historyService';
import { BookingHistoryItem } from '../components/BookingHistoryItem';

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
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/bookers/movies')}
              className="p-3 bg-slate-800 hover:bg-indigo-600 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <History className="w-8 h-8 text-indigo-400" /> My Booking History
              </h1>
              <p className="text-slate-400 mt-1">View your past tickets and reservations</p>
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {['ALL', 'CONFIRMED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  filter === f 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center">
            <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No bookings found</h3>
            <p className="text-slate-400">You haven't made any bookings that match this filter yet.</p>
            <button
              onClick={() => navigate('/bookers/movies')}
              className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
            >
              Browse Movies
            </button>
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
