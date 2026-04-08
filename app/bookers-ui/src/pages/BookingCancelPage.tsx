import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { env } from '../env';

export const BookingCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    const release = async () => {
      try {
        await fetch(`${env.apiGatewayUrl}/api/v1/booking/bookings/${bookingId}/cancel`, { method: 'POST' });
        setReleased(true);
      } catch (error) {
        console.warn('Failed to cancel booking after Stripe cancellation', error);
      }
    };
    release();
  }, [location.search]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-slate-400 mb-8">
          Your payment was not completed. {released ? 'Your seats have been released.' : 'We are releasing your seats...'}
        </p>
        <button
          onClick={() => navigate(-2)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
          Return to Booking
        </button>
      </div>
    </div>
  );
};
