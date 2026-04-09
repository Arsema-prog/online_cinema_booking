import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { env } from '../env';
import { getAccessTokenGetter } from '../httpClient';
import { Button } from '@/components/ui/Button';

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

  const resolveUserEmail = async (token: string | null | undefined): Promise<string | null> => {
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
        await fetch(`${env.apiGatewayUrl}/api/v1/booking/bookings/${bookingId}/snacks`, {
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
      const checkoutEmail = userEmail ?? "";
      if (checkoutEmail) {
        try {
          sessionStorage.setItem('bookers_last_checkout_email', checkoutEmail);
        } catch {}
      }
      
      // Ensure booking is marked as payment initiated (best effort)
      try {
        await fetch(`${env.apiGatewayUrl}/api/v1/booking/bookings/${bookingId}/initiate-payment`, { method: 'POST' });
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

      window.location.href = session.url;
      return;
      
    } catch (error) {
      console.error('Payment error:', error);
      setError((error as Error)?.message ?? 'Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  if (!bookingId) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md w-full mx-auto px-4 py-12">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6 rounded-lg inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm">
          <h1 className="text-2xl font-headline font-bold mb-6 text-card-foreground">Payment Summary</h1>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between pb-3 border-b border-border text-sm">
              <span className="text-muted-foreground font-medium">Seats ({seats?.length})</span>
              <span className="font-bold">${(seatTotal ?? 0).toFixed(2)}</span>
            </div>
            
            {normalizedSnacks.length > 0 && (
              <div className="flex justify-between pb-3 border-b border-border text-sm">
                <span className="text-muted-foreground font-medium">Snacks</span>
                <span className="font-bold">${computedSnacksTotal.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold pt-2">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${computedTotalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Button
            onClick={handlePayment}
            disabled={processing}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 shadow-sm font-bold text-base"
          >
            {processing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CreditCard size={18} />
            )}
            {processing ? 'Processing...' : 'Pay with Stripe'}
          </Button>

          {error && (
            <div className="mt-6 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl p-3 font-medium text-center">
              {error}
            </div>
          )}
          
          <p className="text-center text-muted-foreground text-xs mt-6 uppercase tracking-wider font-bold">
            You will be redirected to securely complete payment.
          </p>
        </div>
      </div>
    </div>
  );
};
