import { getAccessTokenGetter } from '../httpClient';
import { env } from '../env';

const API_BASE_URL = `${env.paymentServiceUrl ?? 'http://localhost:8083'}/api/payments`;

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

/**
 * Service to handle payment processing for cinema bookings.
 */
export const paymentService = {
  /**
   * Initializes a payment intent directly after holding seats.
   * Redirects user to Stripe checkout session.
   * @param bookingId The unique booking reference ID
   * @param amount The total transaction amount in dollars
   * @returns A promise that resolves to the Checkout URL
   */
  async createCheckoutSession(
    bookingId: string,
    amountDollars: number,
    options?: {
      successUrl?: string;
      cancelUrl?: string;
      currency?: string;
    }
  ): Promise<CheckoutSession> {
    const token = getAccessTokenGetter()();
    const currency = options?.currency ?? 'USD';

    try {
      const response = await fetch(`${API_BASE_URL}/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: bookingId,
          amount: Math.round(amountDollars * 100), // convert dollars to cents for Stripe
          currency,
          successUrl: options?.successUrl ?? `${window.location.origin}/bookers/booking/success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: options?.cancelUrl ?? `${window.location.origin}/bookers/booking/cancel?bookingId=${bookingId}`

        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }
      
      const data = await response.json();
      return {
        sessionId: data.sessionId,
        url: data.url
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }
};
