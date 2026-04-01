import React, { useState } from 'react';
import { PaymentForm } from './PaymentForm';
import { paymentService } from '../services/paymentService';
import { X } from 'lucide-react';

interface Props {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<Props> = ({ bookingId, amount, onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const checkoutUrl = await paymentService.createCheckoutSession(bookingId, amount);
      window.location.href = checkoutUrl;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment processing.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800">
          <h2 className="text-xl font-bold text-white">Complete Booking</h2>
          <button 
            onClick={onCancel}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Reservation Timer Mock */}
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 mb-6 text-center">
            <p className="text-amber-400 text-sm font-medium">
              Seats are held for <span className="font-mono font-bold">09:59</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

          <PaymentForm 
            amount={amount}
            isProcessing={isProcessing}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};
