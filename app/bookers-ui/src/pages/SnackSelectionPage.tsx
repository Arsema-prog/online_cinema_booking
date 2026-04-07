import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, ShoppingCart, SkipForward, Popcorn, Coffee, Beer, Wine, Milk, Cookie, Sparkles, ArrowRight, Trash2, CreditCard, Loader2 } from 'lucide-react';
import { env } from '../env';
import { paymentService } from '../services/paymentService';
import { getAccessTokenGetter } from '../httpClient';

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
    case 'Popcorn': return <Popcorn size={40} className="text-amber-400" />;
    case 'Soda': return <Coffee size={40} className="text-blue-400" />;
    case 'Bottled Water': return <Milk size={40} className="text-cyan-400" />;
    case 'Fresh Juice': return <Wine size={40} className="text-orange-400" />;
    case 'Beer': return <Beer size={40} className="text-yellow-400" />;
    case 'Nachos': return <Cookie size={40} className="text-amber-500" />;
    case 'Candy': return <Cookie size={40} className="text-pink-400" />;
    default: return <Sparkles size={40} className="text-purple-400" />;
  }
};

interface CartItem {
  snack: Snack;
  quantity: number;
}

export const SnackSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, showId, seats, seatTotal, holdExpiresAt, holdExpiresAtEpochMs } = location.state || {};
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [holdExpired, setHoldExpired] = useState(false);
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
    if (resolvedHoldExpiresAtMs) return;
    if (!bookingId) return;

    const parseBackendDateToEpoch = (value: string): number | null => {
      if (!value) return null;
      const hasTimezone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(value);
      const normalized = hasTimezone ? value : `${value}Z`;
      const parsed = Date.parse(normalized);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const recoverExpiryFromBooking = async () => {
      try {
        const response = await fetch(`${env.bookingServiceUrl}/bookings/${bookingId}`);
        if (!response.ok) return;
        const booking = await response.json();
        if (!booking?.createdAt) return;

        const createdAtMs = parseBackendDateToEpoch(booking.createdAt);
        if (!createdAtMs) return;
        setResolvedHoldExpiresAtMs(createdAtMs + 120000);
      } catch (error) {
        console.error('Failed to recover hold expiry from booking', error);
      }
    };

    if (holdExpiresAt) {
      const parsed = parseBackendDateToEpoch(holdExpiresAt);
      if (parsed) {
        setResolvedHoldExpiresAtMs(clampExpiryToTwoMinutesFromNow(parsed));
        return;
      }
    }

    recoverExpiryFromBooking();
  }, [bookingId, resolvedHoldExpiresAtMs, holdExpiresAt]);

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
        await fetch(`${env.bookingServiceUrl}/bookings/${bookingId}/cancel`, { method: 'POST' });
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

  const handleSkip = () => {
    if (holdExpired) return;
    setShowPaymentModal(true);
  };

  const handleProceed = () => {
    if (holdExpired) return;
    setShowPaymentModal(true);
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

      const snacksTotalValue = getCartTotal();
      const totalAmount = (seatTotal || 0) + snacksTotalValue;
      if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero');
      }

      // Persist snacks to booking
      if (cart.length > 0) {
        const snacksResponse = await fetch(`${env.bookingServiceUrl}/bookings/${bookingId}/snacks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snackDetails: cart.map(item => `${item.quantity}x ${item.snack.name}`).join(', '),
            snacksTotal: snacksTotalValue
          })
        });
        if (!snacksResponse.ok) {
          throw new Error('Failed to save snacks for booking');
        }
      }

      const token = getAccessTokenGetter()();
      const userEmail = await resolveUserEmail(token);
      const checkoutEmail = userEmail ?? "";
      if (checkoutEmail) {
        try {
          sessionStorage.setItem('bookers_last_checkout_email', checkoutEmail);
        } catch {}
      }

      // best-effort notify booking service
      try {
        await fetch(`${env.bookingServiceUrl}/bookings/${bookingId}/initiate-payment`, { method: 'POST' });
      } catch (e) {
        console.warn('Failed to notify booking service about payment initiation', e);
      }

      const session = await paymentService.createCheckoutSession(
        bookingId,
        totalAmount,
        {
          successUrl: `${window.location.origin}/bookers/booking/success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/bookers/booking/cancel?bookingId=${bookingId}`
        }
      );

      window.location.href = session.url;
      return;
    } catch (error: any) {
      console.error('Payment error:', error);
      setStripeError(error?.message ?? 'Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  const categories = ['all', 'drinks', 'snacks', 'combo'];
  const filteredSnacks = selectedCategory === 'all' 
    ? snacks 
    : snacks.filter(s => s.category === selectedCategory);

  if (!bookingId) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {resolvedHoldExpiresAtMs && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderRadius: 12,
              border: holdExpired ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(245,158,11,0.5)',
              background: holdExpired
                ? 'rgba(127, 29, 29, 0.35)'
                : 'rgba(120, 53, 15, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span style={{ color: holdExpired ? '#fecaca' : '#fde68a', fontWeight: 700 }}>
              {holdExpired ? 'Seat hold expired. Your seats are being released.' : 'Seat hold expires in'}
            </span>
            <span style={{ color: holdExpired ? '#fca5a5' : '#fbbf24', fontSize: 24, fontWeight: 800 }}>
              {formatSeconds(secondsLeft)}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-slate-800 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-pink-600 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
              Add Snacks & Drinks
            </h1>
            <p className="text-slate-300 mt-1 text-2xl">
              Make your movie experience even better!
            </p>
          </div>
        </div>

        {/* Grid Layout - Left: Payment Summary, Right: Snacks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT SIDE - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card" style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
              borderRadius: 16,
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              position: 'sticky',
              top: 20
            }}>
              <div style={{
                padding: 20,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))'
              }}>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CreditCard size={24} className="text-indigo-400" />
                  Payment Summary
                </h2>
              </div>

              <div style={{ padding: 20, 
                fontSize: 25
              }}>
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                    <span>🎬</span> Selected Seats
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg">{seats?.length || 0} seats</span>
                    <span className="text-xl font-semibold text-indigo-400">${seatTotal?.toFixed(2) || 0}</span>
                  </div>
                  {seats && seats.length > 0 && (
                    <div className="text-sm text-slate-500 mt-2">
                      {seats.join(', ')}
                    </div>
                  )}
                </div>

                {cart.length > 0 ? (
                  <div className="mb-4 pb-4 border-b border-slate-700">
                    <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                      <span>🍿</span> Snacks Ordered
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.snack.id} className="flex justify-between items-center mb-3 p-2 bg-slate-700/30 rounded-lg">
                          <div>
                            <span className="font-semibold">{item.quantity}x</span>
                            <span className="ml-2 text-sm">{item.snack.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-indigo-400">
                              ${(item.snack.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.snack.id)}
                              className="w-7 h-7 rounded-full bg-red-600/20 hover:bg-red-600 flex items-center justify-center transition-all duration-200"
                            >
                              <Minus size={12} className="text-red-400" />
                            </button>
                            <button
                              onClick={() => removeAllFromCart(item.snack.id)}
                              className="w-7 h-7 rounded-full bg-red-600/20 hover:bg-red-600 flex items-center justify-center transition-all duration-200"
                            >
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 mb-4">
                    🍿 No snacks selected yet
                  </div>
                )}

                <div className="mb-6 pt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-bold">Total Amount</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                      ${(seatTotal + getCartTotal()).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    disabled={holdExpired}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 40,
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: holdExpired ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: holdExpired ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    }}
                  >
                    <SkipForward size={18} />
                    Skip
                  </button>
                  <button
                    onClick={handleProceed}
                    disabled={holdExpired}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 40,
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: holdExpired ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: holdExpired ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    }}
                  >
                    Proceed
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Snack Menu with 3 columns */}
          <div className="lg:col-span-1"
          style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      height: '100%',
       
    }}>
            {/* Category Tabs */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '10px 24px',
                    background: selectedCategory === cat 
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                      : 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    height: '100%',
                    borderRadius: 16,
                    fontSize: 14,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedCategory === cat ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                    textTransform: 'capitalize',
                  

                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat) {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                    }
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Snack Grid - 3 COLUMNS PER ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSnacks.map(snack => (
                <div
                  key={snack.id}
                  className="glass-card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    cursor: 'pointer', display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                  gap: 24,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Snack Icon/Image Area */}
                  <div style={{
                    height: 100,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))'
                  }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600/20 to-pink-600/20 rounded-xl flex items-center justify-center shadow-lg">
                      {getIcon(snack.name)}
                    </div>
                    
                    {/* Price Badge */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: 'white',
                      zIndex: 1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      ${snack.price.toFixed(2)}
                    </div>
                  </div>
                  
                  {/* Snack Info */}
                  <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ 
                      color: 'white', 
                      fontSize: 20, 
                      marginBottom: 6,
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {snack.name}
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <div style={{ 
                        background: `rgba(139, 92, 246, 0.2)`,
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 9,
                        color: '#c084fc',
                        textTransform: 'capitalize'
                      }}>
                        {snack.category}
                      </div>
                    </div>

                    <p style={{ 
                      color: '#94a3b8', 
                      fontSize: 20, 
                      lineHeight: 1.4,
                      marginBottom: 12,
                      textAlign: 'center'
                    }}>
                      {snack.description.length > 40 
                        ? `${snack.description.substring(0, 40)}...` 
                        : snack.description}
                    </p>

                   
                  </div>
                  <div  style={{
                    height: 100,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))'
                  }}> 
                     {/* Add Button */}
                    <button
                      onClick={() => addToCart(snack)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 40,
                        fontSize: 20,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        marginTop: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal Popup */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }} onClick={() => !processing && setShowPaymentModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: 24,
            padding: 32,
            maxWidth: 500,
            width: '90%',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.3s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CreditCard size={32} className="text-white" />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>Confirm Payment</h2>
              <p style={{ color: '#94a3b8' }}>Review your order before proceeding</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{
                background: '#0f172a',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#94a3b8' }}>🎬 Seats ({seats?.length || 0})</span>
                  <span className="font-semibold">${seatTotal?.toFixed(2) || 0}</span>
                </div>
                
                {cart.length > 0 && (
                  <div style={{ borderTop: '1px solid #334155', paddingTop: 12, marginTop: 4 }}>
                    <div style={{ color: '#94a3b8', marginBottom: 8 }}>🍿 Snacks</div>
                    {cart.map(item => (
                      <div key={item.snack.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                        <span>{item.quantity}x {item.snack.name}</span>
                        <span>${(item.snack.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.15) 100%)',
                borderRadius: 16,
                padding: 16,
                border: '1px solid rgba(139,92,246,0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 'bold' }}>Total Amount</span>
                  <span style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    ${(seatTotal + getCartTotal()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#334155',
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: processing ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!processing) {
                    e.currentTarget.style.background = '#475569';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#334155';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={processing || holdExpired}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: processing ? '#334155' : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: processing || holdExpired ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: processing ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: processing || holdExpired ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!processing) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!processing) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                  }
                }}
              >
                {holdExpired ? (
                  <>
                    <CreditCard size={20} />
                    Hold Expired
                  </>
                ) : processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay Now
                  </>
                )}
              </button>
            </div>
            
            {stripeError && (
              <div style={{
                marginTop: 12,
                padding: '10px 12px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(248,113,113,0.35)',
                borderRadius: 12,
                color: '#fecdd3',
                fontWeight: 600
              }}>
                {stripeError}
              </div>
            )}

            <p className="text-center text-slate-500 text-xs mt-4">
              You will be redirected to secure payment gateway
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
