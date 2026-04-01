import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { env } from '../env';
import { getAccessTokenGetter } from '../httpClient';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, seats, seatTotal, snacks, snacksTotal, totalAmount, autoPay } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedSnacks = Array.isArray(snacks) ? snacks : [];
  const computedSnacksTotal = typeof snacksTotal === 'number'
    ? snacksTotal
    : normalizedSnacks.reduce(
        (total: number, item: any) =>
          total + ((item?.snack?.price ?? item?.price ?? 0) * (item?.quantity ?? 0)),
        0
      );
  const computedTotalAmount = (totalAmount ?? 0) > 0
    ? totalAmount
    : (seatTotal || 0) + computedSnacksTotal;

  useEffect(() => {
    if (!bookingId) {
      navigate('/bookers/movies');
    }
  }, [bookingId, navigate]);

  useEffect(() => {
    if (autoPay && bookingId && !processing) {
      handlePayment();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPay, bookingId]);

  const resolveUserEmail = async (token: string | null): Promise<string | null> => {
    let email: string | null = null;

    if (token) {
      try {
        const payload = token.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
          email = decoded?.email
            || (typeof decoded?.preferred_username === 'string' && decoded.preferred_username.includes('@')
              ? decoded.preferred_username
              : null);
        }
      } catch {}
    }

    if (!email) {
      try {
        const cached = localStorage.getItem('bookers_user_email');
        if (cached && cached.includes('@')) {
          email = cached;
        }
      } catch {}
    }

    if (!email && token) {
      try {
        const userInfoRes = await fetch(
          `${env.keycloakUrl}/realms/${env.keycloakRealm}/protocol/openid-connect/userinfo`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          if (info?.email && typeof info.email === 'string') {
            email = info.email;
          }
        }
      } catch {}
    }

    return email;
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      if (!bookingId) {
        throw new Error('Missing booking reference. Please restart booking.');
      }

      const snacksTotalToSend = computedSnacksTotal;
      const totalForPayment = computedTotalAmount;

      // First, update booking with snacks if any
      if (normalizedSnacks.length > 0) {
        await fetch(`${env.bookingServiceUrl}/bookings/${bookingId}/snacks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snackDetails: normalizedSnacks.map((s: any) => `${s.quantity}x ${s.snack?.name ?? s.name ?? 'Snack'}`).join(', '),
            snacksTotal: snacksTotalToSend
          })
        });
      }

      if (!totalForPayment || totalForPayment <= 0) {
        throw new Error('Total amount is missing or invalid for this booking.');
      }

      const token = getAccessTokenGetter()();
      const userEmail = await resolveUserEmail(token);
      if (userEmail) {
        try {
          sessionStorage.setItem('bookers_last_checkout_email', userEmail);
        } catch {}
      }
      
      // Ensure booking is marked as payment initiated (best effort)
      try {
        await fetch(`${env.bookingServiceUrl}/bookings/${bookingId}/initiate-payment`, { method: 'POST' });
      } catch (e) {
        console.warn('Failed to notify booking service about payment initiation', e);
      }
      
      // Create Stripe checkout session
      const session = await paymentService.createCheckoutSession(
        bookingId,
        totalForPayment,
        {
          successUrl: `${window.location.origin}/bookers/booking/success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/bookers/booking/cancel?bookingId=${bookingId}`
        }
      );

      // Hosted checkout URL redirect (redirectToCheckout removed in latest Stripe.js)
      window.location.href = session.url;
      return;
      
    } catch (error) {
      console.error('Payment error:', error);
      setError((error as Error)?.message ?? 'Failed to process payment. Please try again.');
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
              <span>${(seatTotal ?? 0).toFixed(2)}</span>
            </div>
            
            {normalizedSnacks.length > 0 && (
              <div className="flex justify-between pb-2 border-b border-slate-700">
                <span>Snacks</span>
                <span>${computedSnacksTotal.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>Total</span>
              <span className="text-indigo-400">${computedTotalAmount.toFixed(2)}</span>
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

          {error && (
            <div className="mt-4 text-red-300 text-sm bg-red-900/40 border border-red-400/40 rounded-xl p-3">
              {error}
            </div>
          )}
          
          <p className="text-center text-slate-500 text-sm mt-4">
            You will be redirected to Stripe secure checkout page
          </p>
        </div>
      </div>
    </div>
  );
};
