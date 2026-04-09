import { getAccessTokenGetter } from '../httpClient';
import { env } from '../env';

const API_BASE_URL = `${env.apiGatewayUrl ?? 'http://localhost:8090'}/api/v1/payment/api/payments`;

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

const getErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
};

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
        const fallback =
          response.status === 401
            ? 'Your session expired. Please sign in again.'
            : response.status === 409
              ? 'This booking is not ready for payment. Refresh and try again.'
              : 'Failed to initialize payment';
        throw new Error(await getErrorMessage(response, fallback));
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
  },

  async completeMockCheckout(sessionId: string): Promise<void> {
    const token = getAccessTokenGetter()();

    const response = await fetch(`${API_BASE_URL}/mock/complete/${sessionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const fallback =
        response.status === 401
          ? 'Your session expired. Please sign in again.'
          : response.status === 409
            ? 'This booking can no longer be completed. Please start again.'
            : 'Failed to complete demo payment';
      throw new Error(await getErrorMessage(response, fallback));
    }
  }
};
