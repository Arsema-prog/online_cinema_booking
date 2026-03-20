// BookingSummary.tsx
import React from "react";

interface BookingSummaryProps {
  selectedSeats: Array<{ id: string; row: string; number: number; price: number }>;
  showtime: string;
  totalAmount: number;
  onProceed: () => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedSeats,
  showtime,
  totalAmount,
  onProceed
}) => {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      borderRadius: 16,
      padding: "24px",
      marginTop: "24px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      position: "sticky",
      bottom: 20,
      zIndex: 10
    }}>
      <h3 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
        Booking Summary
      </h3>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 20,
        marginBottom: 20
      }}>
        <div>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 4 }}>
            Showtime
          </p>
          <p style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {showtime}
          </p>
        </div>
        
        <div>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 4 }}>
            Selected Seats
          </p>
          <p style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {selectedSeats.map(seat => `${seat.row}${seat.number}`).join(", ")}
          </p>
        </div>
        
        <div>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 4 }}>
            Total Amount
          </p>
          <p style={{ color: "#4f46e5", fontSize: 24, fontWeight: "bold" }}>
            ${totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <button
        onClick={onProceed}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(79, 70, 229, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
        }}
      >
        Proceed to Payment
      </button>
    </div>
  );
};
