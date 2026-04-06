import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function TicketValidationRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const ticketId = searchParams.get('ticketId');

    if (!isAuthenticated) {
      // Redirect to login with return URL
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // User is authenticated, redirect to tickets page with ticketId
    if (ticketId) {
      navigate(`/tickets?ticketId=${ticketId}`);
    } else {
      navigate('/tickets');
    }
  }, [isAuthenticated, navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to ticket validation...</p>
      </div>
    </div>
  );
}