// pages/BookingPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBooking } from "../hooks/useBooking";
import { ChevronLeft, Ticket, Users, CreditCard, Info } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { screeningId } = useParams<{ screeningId: string }>();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const {
    seats,
    loading,
    error,
    selectedSeats,
    toggleSeat,
    holdSelectedSeats,
    confirmBooking,
    totalAmount,
    hasSelectedSeats
  } = useBooking(Number(screeningId));

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seat.rowLabel;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<string, typeof seats>);

  const rows = Object.keys(seatsByRow).sort();

  // Get seat color based on status
  const getSeatColor = (seat: typeof seats[0]) => {
    if (selectedSeats.some(s => s.id === seat.id)) {
      return '#10b981'; // Selected - green
    }
    switch (seat.status) {
      case 'RESERVED':
        return '#ef4444'; // Reserved - red
      case 'HELD':
        return '#f59e0b'; // Held - orange/amber
      case 'CANCELLED':
        return '#6b7280'; // Cancelled - gray
      default:
        return '#1e293b'; // Available - dark blue
    }
  };

  const handleProceedToPayment = async () => {
    setProcessing(true);
    try {
      // First hold the seats
      await holdSelectedSeats();
      // Then show confirmation modal
      setShowConfirmModal(true);
    } catch (error) {
      alert("Failed to hold seats. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmBooking = async () => {
    setProcessing(true);
    try {
      await confirmBooking();
      // Navigate to confirmation page or show success message
      alert("Booking confirmed! Check your email for tickets.");
      navigate('/bookers');
    } catch (error) {
      alert("Failed to confirm booking. Please try again.");
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#020617', 
        color: 'white',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            border: '4px solid #8b5cf6', 
            borderTopColor: 'transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Loading seats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#020617', 
        color: 'white',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          background: '#0f172a', 
          padding: 32, 
          borderRadius: 16, 
          textAlign: 'center',
          maxWidth: 400 
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: 16 }}>Error</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      color: 'white',
      paddingBottom: hasSelectedSeats ? 120 : 40
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        {/* Header with back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: '#1e293b',
              border: 'none',
              color: 'white',
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#8b5cf6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e293b';
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: 28, margin: 0 }}>Select Your Seats</h1>
        </div>

        {/* Screen visualization */}
        <div style={{ 
          position: 'relative',
          marginBottom: 48,
          textAlign: 'center'
        }}>
          <div style={{
            height: 8,
            background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
            width: '70%',
            margin: '0 auto',
            borderRadius: '4px 4px 0 0'
          }} />
          <p style={{ 
            color: '#94a3b8', 
            marginTop: 8, 
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            SCREEN
          </p>
          <div style={{
            position: 'absolute',
            top: -30,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 32
          }}>
            🎬
          </div>
        </div>

        {/* Seat legend */}
        <div style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          marginBottom: 32,
          padding: '16px 24px',
          background: '#0f172a',
          borderRadius: 50,
          flexWrap: 'wrap'
        }}>
          <LegendItem color="#1e293b" label="Available" />
          <LegendItem color="#10b981" label="Selected" />
          <LegendItem color="#f59e0b" label="Held" />
          <LegendItem color="#ef4444" label="Reserved" />
          <LegendItem color="#6b7280" label="Cancelled" />
        </div>

        {/* Bird's Eye View Seat Map */}
        <div style={{
          background: '#0f172a',
          borderRadius: 24,
          padding: 32,
          marginBottom: 32,
          overflowX: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
        }}>
          <div style={{ minWidth: rows.length * 70 }}>
            {rows.map(row => (
              <div key={row} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16,
                marginBottom: 12
              }}>
                <div style={{ 
                  width: 40, 
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  fontSize: 18
                }}>
                  {row}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  {seatsByRow[row].map((seat, index) => {
                    // Create aisle gap after every 7 seats
                    const isAisle = index === 7;
                    
                    return (
                      <React.Fragment key={seat.id}>
                        {isAisle && <div style={{ width: 24 }} />}
                        <button
                          onClick={() => toggleSeat(seat)}
                          disabled={seat.status !== 'AVAILABLE'}
                          style={{
                            width: 45,
                            height: 45,
                            background: getSeatColor(seat),
                            border: selectedSeats.some(s => s.id === seat.id)
                              ? '3px solid #8b5cf6'
                              : 'none',
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 'bold',
                            cursor: seat.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                            opacity: seat.status === 'RESERVED' || seat.status === 'CANCELLED' ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`Row ${seat.seat.rowLabel}, Seat ${seat.seat.seatNumber} - $${seat.price}`}
                        >
                          {seat.seat.seatNumber.replace(seat.seat.rowLabel, '')}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Aisle indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 80,
            marginTop: 24,
            color: '#94a3b8',
            fontSize: 13
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 2, height: 24, background: '#334155' }} />
              <span>Left Aisle</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 2, height: 24, background: '#334155' }} />
              <span>Right Aisle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom booking summary */}
      {hasSelectedSeats && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#0f172a',
          borderTop: '2px solid #1e293b',
          padding: '20px',
          boxShadow: '0 -8px 20px rgba(0,0,0,0.5)',
          zIndex: 50
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  color: '#94a3b8',
                  fontSize: 14,
                  marginBottom: 4
                }}>
                  <Ticket size={16} />
                  <span>Selected Seats</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {selectedSeats.map(s => s.seat.seatNumber).join(', ')}
                </div>
              </div>
              
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  color: '#94a3b8',
                  fontSize: 14,
                  marginBottom: 4
                }}>
                  <Users size={16} />
                  <span>Total Seats</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {selectedSeats.length}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 14 }}>Total Amount</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ${totalAmount.toFixed(2)}
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={processing}
                style={{
                  padding: '16px 40px',
                  background: processing ? '#334155' : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: processing ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!processing) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }}
              >
                <CreditCard size={20} />
                {processing ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: '#0f172a',
            borderRadius: 24,
            padding: 32,
            maxWidth: 450,
            width: '90%',
            border: '2px solid #1e293b',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: 28, marginBottom: 16, textAlign: 'center' }}>
              Confirm Booking
            </h2>
            
            <div style={{
              background: '#1e293b',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                color: '#94a3b8',
                fontSize: 14,
                marginBottom: 12
              }}>
                <Info size={16} />
                <span>Booking Details</span>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
                  Selected Seats
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {selectedSeats.map(s => s.seat.seatNumber).join(', ')}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
                  Number of Seats
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {selectedSeats.length}
                </div>
              </div>

              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
                  Total Amount
                </div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ${totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#1e293b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: processing ? '#334155' : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.5 : 1
                }}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Helper component for legend items
const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 24,
      height: 24,
      background: color,
      borderRadius: 6,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      border: color === '#1e293b' ? '1px solid #334155' : 'none'
    }} />
    <span style={{ fontSize: 14 }}>{label}</span>
  </div>
);