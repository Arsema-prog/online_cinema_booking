// SeatMap.tsx
import React, { useState, useEffect } from "react";

interface Seat {
  id: string;
  row: string;
  number: number;
  price: number;
  status: "available" | "selected" | "booked" | "blocked";
}

interface SeatMapProps {
  movieId: string;
  showtime: string;
  selectedSeats: Seat[];
  onSeatSelect: (seat: Seat) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  movieId,
  showtime,
  selectedSeats,
  onSeatSelect
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);

  // Generate mock seats
  useEffect(() => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const seatsPerRow = 12;
    const mockSeats: Seat[] = [];

    rows.forEach(row => {
      for (let i = 1; i <= seatsPerRow; i++) {
        // Randomly mark some seats as booked
        const isBooked = Math.random() < 0.2;
        const isBlocked = !isBooked && Math.random() < 0.05;
        
        // Different prices for different rows
        let price = 12.99;
        if (row === 'A' || row === 'B') price = 14.99; // Premium rows
        if (row === 'G') price = 10.99; // Back row discount

        mockSeats.push({
          id: `${row}${i}`,
          row,
          number: i,
          price,
          status: isBooked ? 'booked' : isBlocked ? 'blocked' : 'available'
        });
      }
    });

    setSeats(mockSeats);
  }, [movieId, showtime]);

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isSelected) return "#4f46e5";
    switch (seat.status) {
      case 'booked':
        return "#ef4444";
      case 'blocked':
        return "#64748b";
      case 'available':
        return "#1e293b";
      default:
        return "#1e293b";
    }
  };

  const getSeatHoverColor = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'blocked') return;
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    return isSelected ? "#6366f1" : "#334155";
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: 16,
      padding: "24px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
    }}>
      {/* Screen */}
      <div style={{
        textAlign: "center",
        marginBottom: "40px",
        position: "relative"
      }}>
        <div style={{
          height: "8px",
          background: "linear-gradient(180deg, #4f46e5 0%, #818cf8 100%)",
          width: "80%",
          margin: "0 auto",
          borderRadius: "4px 4px 0 0"
        }} />
        <p style={{
          color: "#94a3b8",
          fontSize: 14,
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: 2
        }}>
          Screen
        </p>
      </div>

      {/* Seat Legend */}
      <div style={{
        display: "flex",
        gap: 24,
        justifyContent: "center",
        marginBottom: 32,
        padding: "12px",
        background: "#1e293b",
        borderRadius: 30
      }}>
        <LegendItem color="#1e293b" label="Available" />
        <LegendItem color="#4f46e5" label="Selected" />
        <LegendItem color="#ef4444" label="Booked" />
        <LegendItem color="#64748b" label="Blocked" />
      </div>

      {/* Seats Grid */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center"
      }}>
        {rows.map(row => (
          <div key={row} style={{
            display: "flex",
            gap: 8,
            alignItems: "center"
          }}>
            <span style={{
              width: 30,
              color: "#94a3b8",
              fontWeight: "bold"
            }}>
              {row}
            </span>
            <div style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center"
            }}>
              {seats
                .filter(seat => seat.row === row)
                .map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => {
                      if (seat.status === 'available' || seat.status === 'selected') {
                        onSeatSelect(seat);
                      }
                    }}
                    disabled={seat.status === 'booked' || seat.status === 'blocked'}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "8px 8px 4px 4px",
                      border: "none",
                      background: getSeatColor(seat),
                      color: "white",
                      fontSize: 12,
                      fontWeight: "bold",
                      cursor: seat.status === 'available' || seat.status === 'selected' 
                        ? 'pointer' 
                        : 'not-allowed',
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      opacity: seat.status === 'blocked' ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getSeatHoverColor(seat);
                      if (hoverColor) {
                        e.currentTarget.style.background = hoverColor;
                        e.currentTarget.style.transform = "scale(1.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = getSeatColor(seat);
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title={`Row ${seat.row}, Seat ${seat.number} - $${seat.price}`}
                  >
                    {seat.number}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Aisle indicators */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 40,
        marginTop: 24,
        color: "#94a3b8",
        fontSize: 12
      }}>
        <span>⬅️ Aisle</span>
        <span>➡️ Aisle</span>
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 24,
      height: 24,
      borderRadius: 6,
      background: color,
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }} />
    <span style={{ color: "white", fontSize: 14 }}>{label}</span>
  </div>
);