import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, seats, seatTotal, snacks, snacksTotal, totalAmount } = location.state || {};
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      navigate('/bookers/movies');
    }
  }, [bookingId, navigate]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // First, update booking with snacks if any
      if (snacks && snacks.length > 0) {
        await fetch(`http://localhost:8082/bookings/${bookingId}/snacks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snackDetails: snacks.map((s: any) => `${s.quantity}x ${s.snack.name}`).join(', '),
            snacksTotal: snacksTotal
          })
        });
      }
      
      // Create Stripe checkout session
      const checkoutUrl = await paymentService.createCheckoutSession(bookingId, totalAmount);
      
      // Redirect to Stripe hosted checkout page
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  if (!bookingId) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-md w-full mx-auto px-4 py-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 p-2 bg-slate-800 rounded-lg hover:bg-indigo-600 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h1 className="text-2xl font-bold mb-6">Payment Summary</h1>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between pb-2 border-b border-slate-700">
              <span>Seats ({seats?.length})</span>
              <span>${seatTotal?.toFixed(2)}</span>
            </div>
            
            {snacks && snacks.length > 0 && (
              <div className="flex justify-between pb-2 border-b border-slate-700">
                <span>Snacks</span>
                <span>${snacksTotal?.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>Total</span>
              <span className="text-indigo-400">${totalAmount?.toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <CreditCard size={20} />
            )}
            {processing ? 'Processing...' : 'Pay with Stripe'}
          </button>
          
          <p className="text-center text-slate-500 text-sm mt-4">
            You will be redirected to Stripe secure checkout page
          </p>
        </div>
      </div>
    </div>
  );
};