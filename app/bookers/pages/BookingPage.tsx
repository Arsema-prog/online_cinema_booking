import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../auth";
import { useBookingFlow } from "../hooks/useBookingFlow";
import { UUID } from "../../types";

export const BookingPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const { keycloak } = useAuth();
  const { hold, loading, error, startHold, confirm, cancel } = useBookingFlow();

  const mockSeatIds: UUID[] = [];

  const handleHold = () => {
    if (!showId || !keycloak?.subject) return;
    startHold({
      showId,
      userId: keycloak.subject,
      seatIds: mockSeatIds
    });
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Booking</h1>
      {error && (
        <div style={{ marginBottom: 12, color: "#f97373", fontSize: 14 }}>
          {error}
        </div>
      )}

      {!hold && (
        <button
          disabled={loading}
          onClick={handleHold}
          style={{
            padding: "10px 14px",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
            background: "#4f46e5",
            color: "white",
            fontSize: 14,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Holding seats..." : "Hold seats"}
        </button>
      )}

      {hold && (
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 4 }}>Booking ID: {hold.bookingId}</p>
          <p style={{ marginBottom: 12 }}>
            Expires at: {new Date(hold.expiresAt).toLocaleString()}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={loading}
              onClick={confirm}
              style={{
                padding: "8px 12px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: "#22c55e",
                color: "white",
                fontSize: 14,
                opacity: loading ? 0.7 : 1
              }}
            >
              Confirm booking
            </button>
            <button
              disabled={loading}
              onClick={cancel}
              style={{
                padding: "8px 12px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: "#ef4444",
                color: "white",
                fontSize: 14,
                opacity: loading ? 0.7 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

