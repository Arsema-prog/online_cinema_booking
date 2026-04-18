import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, SkipForward, Popcorn, Coffee, Beer, Wine, Milk, Cookie, Sparkles, ArrowRight, Trash2, CreditCard, Loader2 } from 'lucide-react';
import { BookingDetails, cancelBooking, getBookingDetails, getBookingSeats, updateBookingSnacks, initiateBookingPayment } from '../api/bookingApi';
import { paymentService } from '../services/paymentService';
import { env } from '../env';
import { getAccessTokenGetter } from '../httpClient';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Snack {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'drinks' | 'snacks' | 'combo';
}

const snacks: Snack[] = [
  { id: 'soda', name: 'Soda', description: 'Coca-Cola, Sprite, Fanta', price: 3.99, category: 'drinks' },
  { id: 'water', name: 'Bottled Water', description: 'Spring water 500ml', price: 2.50, category: 'drinks' },
  { id: 'juice', name: 'Fresh Juice', description: 'Orange, Apple, Mango', price: 4.99, category: 'drinks' },
  { id: 'beer', name: 'Beer', description: 'Local/Imported', price: 5.99, category: 'drinks' },
  { id: 'popcorn', name: 'Popcorn', description: 'Butter/Caramel/Cheese', price: 5.99, category: 'snacks' },
  { id: 'nachos', name: 'Nachos', description: 'With cheese sauce', price: 6.99, category: 'snacks' },
  { id: 'candy', name: 'Candy', description: 'Assorted chocolates', price: 3.99, category: 'snacks' },
  { id: 'combo1', name: 'Classic Combo', description: 'Popcorn + 2 Sodas', price: 12.99, category: 'combo' },
  { id: 'combo2', name: 'Premium Combo', description: 'Popcorn + 2 Sodas + Candy', price: 16.99, category: 'combo' },
];

const getIcon = (snackName: string) => {
  switch (snackName) {
    case 'Popcorn': return <Popcorn size={40} className="text-amber-500" />;
    case 'Soda': return <Coffee size={40} className="text-sky-500" />;
    case 'Bottled Water': return <Milk size={40} className="text-cyan-500" />;
    case 'Fresh Juice': return <Wine size={40} className="text-orange-500" />;
    case 'Beer': return <Beer size={40} className="text-yellow-500" />;
    case 'Nachos': return <Cookie size={40} className="text-amber-600" />;
    case 'Candy': return <Cookie size={40} className="text-pink-500" />;
    default: return <Sparkles size={40} className="text-primary" />;
  }
};

interface CartItem {
  snack: Snack;
  quantity: number;
}

export const SnackSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, seats, seatTotal, holdExpiresAt, holdExpiresAtEpochMs } = location.state || {};
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<'continue' | 'skip'>('continue');
  const [processing, setProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [mockSessionId, setMockSessionId] = useState<string | null>(null);
  const [completingDemoPayment, setCompletingDemoPayment] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [holdExpired, setHoldExpired] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<BookingDetails | null>(null);
  const [seatLabels, setSeatLabels] = useState<string[]>(Array.isArray(seats) ? seats : []);
  
  const clampExpiryToTwoMinutesFromNow = (candidate: number | null): number | null => {
    if (!candidate) return null;
    const maxAllowed = Date.now() + 120000;
    return Math.min(candidate, maxAllowed);
  };
  
  const [resolvedHoldExpiresAtMs, setResolvedHoldExpiresAtMs] = useState<number | null>(
    clampExpiryToTwoMinutesFromNow(holdExpiresAtEpochMs || null)
  );
  
  const releaseTriggeredRef = useRef(false);

  useEffect(() => {
    if (!bookingId) {
      navigate('/bookers/movies');
    }
  }, [bookingId, navigate]);

  useEffect(() => {
    let cancelled = false;

    if (!bookingId) {
      return () => {
        cancelled = true;
      };
    }

    const loadBookingContext = async () => {
      try {
        const [booking, bookingSeats] = await Promise.all([
          getBookingDetails(bookingId),
          getBookingSeats(bookingId).catch(() => [])
        ]);

        if (cancelled) {
          return;
        }

        setBookingSummary(booking);

        if (bookingSeats.length > 0) {
          setSeatLabels(bookingSeats.map((seat) => seat.seatNumber));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load booking summary for checkout', error);
        }
      }
    };

    loadBookingContext();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    if (resolvedHoldExpiresAtMs) return;

    const parseBackendDateToEpoch = (value: string): number | null => {
      if (!value) return null;
      const hasTimezone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(value);
      const normalized = hasTimezone ? value : `${value}Z`;
      const parsed = Date.parse(normalized);
      return Number.isNaN(parsed) ? null : parsed;
    };

    if (holdExpiresAt) {
      const parsed = parseBackendDateToEpoch(holdExpiresAt);
      if (parsed) {
        setResolvedHoldExpiresAtMs(clampExpiryToTwoMinutesFromNow(parsed));
        return;
      }
    }

    if (bookingSummary?.createdAt) {
      const createdAtMs = parseBackendDateToEpoch(bookingSummary.createdAt);
      if (createdAtMs) {
        setResolvedHoldExpiresAtMs(clampExpiryToTwoMinutesFromNow(createdAtMs + 120000));
      }
    }
  }, [bookingSummary?.createdAt, resolvedHoldExpiresAtMs, holdExpiresAt]);

  useEffect(() => {
    if (!resolvedHoldExpiresAtMs) return;

    const updateTimer = () => {
      const expiry = resolvedHoldExpiresAtMs;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setHoldExpired(true);
        setShowPaymentModal(false);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [resolvedHoldExpiresAtMs]);

  useEffect(() => {
    if (!holdExpired || !bookingId || releaseTriggeredRef.current) return;

    const releaseExpiredHold = async () => {
      releaseTriggeredRef.current = true;
      try {
        await cancelBooking(bookingId);
      } catch (error) {
        console.error('Failed to release expired hold immediately', error);
      }
    };

    releaseExpiredHold();
  }, [holdExpired, bookingId]);

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const addToCart = (snack: Snack) => {
    setCart(prev => {
      const existing = prev.find(item => item.snack.id === snack.id);
      if (existing) {
        return prev.map(item => 
          item.snack.id === snack.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { snack, quantity: 1 }];
    });
  };

  const removeFromCart = (snackId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.snack.id === snackId);
      if (existing && existing.quantity === 1) {
        return prev.filter(item => item.snack.id !== snackId);
      }
      return prev.map(item => 
        item.snack.id === snackId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const removeAllFromCart = (snackId: string) => {
    setCart(prev => prev.filter(item => item.snack.id !== snackId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.snack.price * item.quantity), 0);
  };

  const resolvedSeatTotal = bookingSummary
    ? Math.max(bookingSummary.totalAmount - bookingSummary.snacksTotal, 0)
    : typeof seatTotal === 'number'
      ? seatTotal
      : 0;

  const snacksTotalValue = getCartTotal();
  const checkoutTotal = resolvedSeatTotal + snacksTotalValue;
  const modalSnacksTotal = paymentIntent === 'skip' ? 0 : snacksTotalValue;
  const modalGrandTotal = paymentIntent === 'skip' ? resolvedSeatTotal : checkoutTotal;
  const checkoutStatusLabel =
    bookingSummary?.status === 'SNACKS_SELECTED'
      ? 'Concessions saved'
      : bookingSummary?.status === 'PAYMENT_PENDING' || bookingSummary?.status === 'PAYMENT_INITIATED'
        ? 'Redirecting to payment'
        : 'Seats held for checkout';

  const handleSkipSnacks = async () => {
    if (holdExpired) {
      alert('Your seat hold has expired. Please start booking again.');
      navigate('/bookers/movies');
      return;
    }

    setProcessing(true);
    setStripeError(null);
    try {
      if (!bookingId) {
        throw new Error('Missing booking reference. Please restart booking.');
      }

      setCart([]);
      const cleared = await updateBookingSnacks(bookingId, '', 0);
      setBookingSummary(cleared);

      const seatOnlyTotal = Math.max(cleared.totalAmount - cleared.snacksTotal, 0);
      if (seatOnlyTotal <= 0) {
        throw new Error('Total amount must be greater than zero');
      }

      setPaymentIntent('skip');
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Skip snacks error:', error);
      setStripeError(error?.message ?? 'Could not clear snacks. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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

  const handleStripePayment = async () => {
    if (holdExpired) {
      alert('Your seat hold has expired. Please start booking again.');
      navigate('/bookers/movies');
      return;
    }

    setProcessing(true);
    setStripeError(null);
    setMockSessionId(null);
    try {
      if (!bookingId) {
        throw new Error('Missing booking reference. Please restart booking.');
      }

      const isSkipIntent = paymentIntent === 'skip';
      const snacksTotalToSend = isSkipIntent ? 0 : snacksTotalValue;
      let latestBooking = bookingSummary ?? await getBookingDetails(bookingId);

      if (!isSkipIntent && cart.length > 0) {
        latestBooking = await updateBookingSnacks(
          bookingId,
          cart.map(item => `${item.quantity}x ${item.snack.name}`).join(', '),
          snacksTotalToSend
        );
      } else if (
        latestBooking.snacksTotal > 0 ||
        (latestBooking.snackDetails && latestBooking.snackDetails.trim().length > 0)
      ) {
        latestBooking = await updateBookingSnacks(bookingId, '', 0);
      }

      setBookingSummary(latestBooking);

      const paymentBooking = await initiateBookingPayment(bookingId);
      setBookingSummary(paymentBooking);

      const totalForPayment = paymentBooking.totalAmount > 0
        ? paymentBooking.totalAmount
        : latestBooking?.totalAmount ?? checkoutTotal;

      if (!totalForPayment || totalForPayment <= 0) {
        throw new Error('Total amount is missing or invalid for this booking.');
      }

      const token = getAccessTokenGetter()();
      const userEmail = await resolveUserEmail(token);
      const checkoutEmail = userEmail ?? '';
      if (checkoutEmail) {
        try {
          sessionStorage.setItem('bookers_last_checkout_email', checkoutEmail);
        } catch {}
      }

      const session = await paymentService.createCheckoutSession(
        bookingId,
        totalForPayment,
        {
          successUrl: `${window.location.origin}/bookers/booking/success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/bookers/booking/cancel?bookingId=${bookingId}`
        }
      );

      if (session.sessionId?.startsWith('mock_session_')) {
        setMockSessionId(session.sessionId);
        setProcessing(false);
        return;
      }

      window.location.href = session.url;
    } catch (error: any) {
      console.error('Payment error:', error);
      setStripeError(error?.message ?? 'Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  const handleCompleteDemoPayment = async () => {
    if (!bookingId || !mockSessionId) {
      setStripeError('Missing demo payment session. Please retry checkout.');
      return;
    }

    setCompletingDemoPayment(true);
    setStripeError(null);

    try {
      await paymentService.completeMockCheckout(mockSessionId);
      navigate(`/bookers/booking/success?bookingId=${bookingId}&session_id=${mockSessionId}`, {
        replace: true
      });
    } catch (completionError: any) {
      console.error('Demo payment completion failed:', completionError);
      setStripeError(completionError?.message ?? 'Failed to complete demo payment. Please try again.');
    } finally {
      setCompletingDemoPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (holdExpired) {
      alert('Your seat hold has expired. Please start booking again.');
      navigate('/bookers/movies');
      return;
    }

    setProcessing(true);
    setStripeError(null);
    try {
      if (!bookingId) {
        throw new Error('Missing booking reference. Please restart booking.');
      }

      let latestBooking = bookingSummary;

      if (cart.length > 0) {
        latestBooking = await updateBookingSnacks(
          bookingId,
          cart.map(item => `${item.quantity}x ${item.snack.name}`).join(', '),
          snacksTotalValue
        );
      } else if (
        bookingSummary &&
        (bookingSummary.snacksTotal > 0 ||
          (bookingSummary.snackDetails && bookingSummary.snackDetails.trim().length > 0))
      ) {
        latestBooking = await updateBookingSnacks(bookingId, '', 0);
      }
      setBookingSummary(latestBooking);

      const totalAmount = latestBooking?.totalAmount && latestBooking.totalAmount > 0
        ? latestBooking.totalAmount
        : latestBooking?.totalAmount ?? checkoutTotal;

      if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero');
      }

      setProcessing(false);
      setPaymentIntent('continue');
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Payment error:', error);
      setStripeError(error?.message ?? 'Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  const handleProceedFromModal = async () => {
    if (holdExpired) {
      alert('Your seat hold has expired. Please start booking again.');
      navigate('/bookers/movies');
      return;
    }

    const isSkipIntent = paymentIntent === 'skip';
    const seatOnlyTotal = resolvedSeatTotal;
    const grandTotal = isSkipIntent ? seatOnlyTotal : checkoutTotal;

    if (grandTotal <= 0) {
      setStripeError('Total amount must be greater than zero');
      return;
    }

    try {
      await handleStripePayment();
    } catch (error: any) {
      console.error('Proceed to payment error:', error);
      setStripeError(error?.message ?? 'Failed to process payment. Please try again.');
    }
  };

  const categories = ['all', 'drinks', 'snacks', 'combo'];
  const filteredSnacks = selectedCategory === 'all' 
    ? snacks 
    : snacks.filter(s => s.category === selectedCategory);

  if (!bookingId) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
       <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
       Loading checkout session...
    </div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-32 animate-fadeIn relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {resolvedHoldExpiresAtMs && (
          <div className={cn(
            "mb-8 p-4 border rounded-2xl flex justify-between items-center transition-colors duration-500 shadow-sm",
            holdExpired ? "bg-destructive/10 border-destructive" : "bg-muted border-border"
          )}>
            <span className={cn("font-bold text-sm", holdExpired ? "text-destructive" : "text-muted-foreground")}>
              {holdExpired ? 'Seat hold expired. Your seats are being released.' : 'Seat hold expires in'}
            </span>
            <span className={cn("text-2xl font-headline font-black tabular-nums", holdExpired ? "text-destructive" : "text-foreground")}>
              {formatSeconds(secondsLeft)}
            </span>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-amber-700">Seats are held, not sold</div>
              <div className="text-xs text-amber-700/80">
                Your seats stay amber during checkout and are released automatically if payment is not completed.
              </div>
            </div>
            <div className="rounded-full border border-amber-500/30 bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
              {checkoutStatusLabel}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-6 mb-12 bg-card border border-border p-4 md:p-6 rounded-3xl shadow-sm">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-1 tracking-tight">
              Snacks & Beverages
            </h1>
            <p className="text-muted-foreground font-medium text-sm">
              Elevate your cinematic experience
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content - Snacks Catalog */}
          <div className="lg:col-span-8 order-2 lg:order-1 space-y-6">
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-2.5 rounded-full font-bold text-sm capitalize whitespace-nowrap transition-all duration-200 border",
                    selectedCategory === cat 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Snack Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {filteredSnacks.map(snack => (
                <div key={snack.id} className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
                  <div className="relative h-32 bg-muted/50 flex items-center justify-center p-4">
                     <div className="relative z-10 w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform">
                        {getIcon(snack.name)}
                     </div>
                     <div className="absolute top-3 right-3 bg-background px-3 py-1 rounded-full text-xs font-bold text-foreground shadow-sm border border-border">
                        ${snack.price.toFixed(2)}
                     </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col border-t border-border">
                    <div className="flex items-start justify-between mb-2">
                       <h3 className="font-headline text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">{snack.name}</h3>
                    </div>
                    <p className="text-muted-foreground text-xs line-clamp-2 mb-6 flex-1">
                      {snack.description}
                    </p>
                    
                    <Button 
                      onClick={() => addToCart(snack)} 
                      variant="outline"
                      className="w-full gap-2 rounded-xl font-bold bg-muted hover:bg-primary hover:text-primary-foreground border-border hover:border-primary transition-all text-xs"
                    >
                      <Plus size={16} /> Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
          </div>

          {/* Sidebar - Cart Summary */}
          <div className="lg:col-span-4 order-1 lg:order-2 sticky top-24">
            <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-md">
              
              <div className="p-6 border-b border-border bg-muted/30">
                <h2 className="font-headline text-xl font-bold text-foreground flex items-center gap-3">
                  <CreditCard className="text-primary h-5 w-5" /> Order Summary
                </h2>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Seats Summary */}
                <div className="space-y-3 pb-6 border-b border-border">
                  <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    🎬 Selected Seats
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground text-sm">{seatLabels.length || 0} Ticket(s)</span>
                    <span className="text-lg font-bold text-primary">${resolvedSeatTotal.toFixed(2)}</span>
                  </div>
                  {seatLabels.length > 0 && (
                    <div className="text-xs text-muted-foreground leading-relaxed">
                       {seatLabels.join(', ')}
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                <div className="space-y-4 pb-6 border-b border-border">
                   <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                    🍿 Snacks & Drinks
                  </div>
                  
                  {cart.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map(item => (
                        <div key={item.snack.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-xl border border-border">
                          <div className="flex-1 flex items-center">
                            <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs mr-3">{item.quantity}x</span>
                            <span className="text-foreground text-sm font-medium">{item.snack.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground text-sm mr-2">
                              ${(item.snack.price * item.quantity).toFixed(2)}
                            </span>
                            <button onClick={() => removeFromCart(item.snack.id)} className="w-6 h-6 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                              <Minus size={12} />
                            </button>
                            <button onClick={() => removeAllFromCart(item.snack.id)} className="w-6 h-6 rounded-full border border-destructive/20 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-muted/30 rounded-xl border border-border border-dashed">
                      <p className="text-muted-foreground text-xs">No snacks selected</p>
                    </div>
                  )}
                </div>

                {/* Totals & Submit */}
                <div className="pt-2">
                  <div className="flex justify-between items-baseline mb-6">
                    <span className="text-sm font-bold text-muted-foreground">Total Due</span>
                    <span className="text-3xl font-headline font-black text-primary tracking-tight">
                      ${checkoutTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSkipSnacks}
                      disabled={holdExpired || processing}
                      className="rounded-xl h-12 font-bold gap-2 text-xs"
                    >
                      <SkipForward size={14} /> Skip Snacks
                    </Button>
                    <Button
                      onClick={handleConfirmPayment}
                      disabled={holdExpired || processing}
                      className="rounded-xl h-12 font-bold gap-2 text-xs shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Continue to Payment <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal Overlay */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn" onClick={() => !processing && setShowPaymentModal(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl p-6 md:p-8 animate-slideIn" onClick={e => e.stopPropagation()}>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <CreditCard size={28} className="text-primary" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-foreground mb-1">Secure Checkout</h2>
              <p className="text-muted-foreground text-xs">Review your final order amount</p>
            </div>

            <div className="bg-muted/50 rounded-2xl p-5 mb-8 border border-border">
              <div className="flex justify-between mb-4 pb-4 border-b border-border">
                <span className="text-muted-foreground text-sm font-medium">Tickets ({seatLabels.length || 0})</span>
                <span className="font-bold text-foreground">${resolvedSeatTotal.toFixed(2)}</span>
              </div>
              
              {paymentIntent !== 'skip' && cart.length > 0 && (
                <div className="flex justify-between mb-4 pb-4 border-b border-border">
                  <span className="text-muted-foreground text-sm font-medium">Snacks & Drinks</span>
                  <span className="font-bold text-foreground">${modalSnacksTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <span className="text-base font-bold text-foreground">Grand Total</span>
                <span className="text-2xl font-black text-primary">
                  ${modalGrandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
                className="flex-1 rounded-xl h-12 text-sm"
              >
                Go Back
              </Button>
              <Button
                onClick={handleProceedFromModal}
                disabled={processing || holdExpired}
                className="flex-1 rounded-xl h-12 gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {holdExpired
                  ? 'Hold Expired'
                  : processing
                    ? <><Loader2 className="animate-spin" size={16}/> Processing</>
                    : <><CreditCard size={16} /> {paymentIntent === 'skip' ? 'Continue without snacks' : 'Continue'}</>}
              </Button>
            </div>

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

            {stripeError && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium text-center">
                {stripeError}
              </div>
            )}
            <p className="text-center text-muted-foreground text-[10px] mt-6 uppercase tracking-wider">
              You will be redirected securely to complete payment.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
