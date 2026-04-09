import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { cancelBooking } from '../api/bookingApi';
import { Button } from '@/components/ui/Button';

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
        await cancelBooking(bookingId);
        setReleased(true);
      } catch (error) {
        console.warn('Failed to cancel booking after Stripe cancellation', error);
      }
    };
    release();
  }, [location.search]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center animate-fadeIn p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
          <XCircle className="w-12 h-12 text-destructive" />
        </div>
        
        <h1 className="text-3xl font-headline font-bold mb-4 text-foreground">Payment Cancelled</h1>
        
        <p className="text-muted-foreground mb-8 text-sm font-medium">
          Your payment was not completed. {released ? 'Your seats have been released.' : 'We are releasing your seats...'}
        </p>
        
        <Button
          onClick={() => navigate(-2)}
          className="w-full gap-2 h-12 rounded-xl font-bold shadow-sm"
        >
          <ArrowLeft size={18} />
          Return to Booking
        </Button>
      </div>
    </div>
  );
};
