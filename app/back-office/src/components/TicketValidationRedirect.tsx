import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function TicketValidationRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    const currentUrl = window.location.pathname + window.location.search;

    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(currentUrl)}`, { replace: true });
      return;
    }

    if (ticketId) {
      navigate(`/tickets?ticketId=${encodeURIComponent(ticketId)}`, { replace: true });
    } else {
      navigate('/tickets', { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-center text-sm text-muted-foreground">Redirecting to ticket validation...</p>
      </div>
    </div>
  );
}
