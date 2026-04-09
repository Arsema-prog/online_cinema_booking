import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookingDetails, getBookingDetails, initiateBookingPayment, updateBookingSnacks } from '../api/bookingApi';
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
  const [bookingSummary, setBookingSummary] = useState<BookingDetails | null>(null);
  const [mockSessionId, setMockSessionId] = useState<string | null>(null);
  const [completingDemoPayment, setCompletingDemoPayment] = useState(false);
  const normalizedSnacks = Array.isArray(snacks) ? snacks : [];
  const computedSnacksTotal = typeof snacksTotal === 'number'
    ? snacksTotal
    : normalizedSnacks.reduce(
        (total: number, item: any) =>
          total + ((item?.snack?.price ?? item?.price ?? 0) * (item?.quantity ?? 0)),
        0
      );

  useEffect(() => {
    let cancelled = false;

    if (!bookingId) {
      return () => {
        cancelled = true;
      };
    }

    const loadBookingSummary = async () => {
      try {
        const booking = await getBookingDetails(bookingId);
        if (!cancelled) {
          setBookingSummary(booking);
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error('Failed to load payment summary for booking', fetchError);
        }
      }
    };

    loadBookingSummary();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const computedSeatTotal = bookingSummary
    ? Math.max(bookingSummary.totalAmount - bookingSummary.snacksTotal, 0)
    : (seatTotal || 0);

  const computedTotalAmount = bookingSummary?.totalAmount && bookingSummary.totalAmount > 0
    ? bookingSummary.totalAmount
    : (totalAmount ?? 0) > 0
      ? totalAmount
      : computedSeatTotal + computedSnacksTotal;

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
    setMockSessionId(null);
    try {
      if (!bookingId) {
        throw new Error('Missing booking reference. Please restart booking.');
      }

      const snacksTotalToSend = computedSnacksTotal;
      let latestBooking = bookingSummary;

      // First, update booking with snacks if any
      if (normalizedSnacks.length > 0) {
        latestBooking = await updateBookingSnacks(
          bookingId,
          normalizedSnacks.map((s: any) => `${s.quantity}x ${s.snack?.name ?? s.name ?? 'Snack'}`).join(', '),
          snacksTotalToSend
        );
        setBookingSummary(latestBooking);
      }

      const paymentBooking = await initiateBookingPayment(bookingId);
      setBookingSummary(paymentBooking);

      const totalForPayment = paymentBooking.totalAmount > 0
        ? paymentBooking.totalAmount
        : latestBooking?.totalAmount ?? computedTotalAmount;

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

      // Create Stripe checkout session
      const session = await paymentService.createCheckoutSession(
        bookingId,
        totalForPayment,
        {
          successUrl: `${window.location.origin}/bookers/booking/success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/bookers/booking/cancel?bookingId=${bookingId}`
        }
      );

      if (session.sessionId?.startsWith('mock_session_')) {
        // In local mock mode we keep users on this page and ask for an explicit
        // payment confirmation click, instead of jumping directly to success.
        setMockSessionId(session.sessionId);
        setProcessing(false);
        return;
      }

      window.location.href = session.url;
      return;
      
    } catch (error) {
      console.error('Payment error:', error);
      setError((error as Error)?.message ?? 'Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  const handleCompleteDemoPayment = async () => {
    if (!bookingId || !mockSessionId) {
      setError('Missing demo payment session. Please retry checkout.');
      return;
    }

    setCompletingDemoPayment(true);
    setError(null);
    try {
      await paymentService.completeMockCheckout(mockSessionId);
      navigate(`/bookers/booking/success?bookingId=${bookingId}&session_id=${mockSessionId}`, {
        replace: true
      });
    } catch (completionError) {
      console.error('Demo payment completion failed:', completionError);
      setError((completionError as Error)?.message ?? 'Failed to complete demo payment. Please try again.');
    } finally {
      setCompletingDemoPayment(false);
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
              <span className="font-bold">${computedSeatTotal.toFixed(2)}</span>
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
            disabled={processing || completingDemoPayment}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 shadow-sm font-bold text-base"
          >
            {processing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CreditCard size={18} />
            )}
            {processing ? 'Processing...' : 'Pay with Stripe'}
          </Button>

          {mockSessionId && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="text-sm font-bold text-amber-700 mb-1">Demo payment mode</div>
              <p className="text-xs text-amber-700/90 mb-4">
                Stripe is running in local mock mode. Complete payment explicitly to confirm your seats.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleCompleteDemoPayment}
                  disabled={completingDemoPayment || processing}
                  className="flex-1"
                >
                  {completingDemoPayment ? 'Confirming...' : 'Complete Demo Payment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/bookers/booking/cancel?bookingId=${bookingId}`)}
                  disabled={completingDemoPayment || processing}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

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
