import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, login, navigate]);

  return (
    <div className="cinema-grid relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/30 to-transparent blur-[120px]" />
      <div className="glass-panel relative w-full max-w-4xl rounded-[2.2rem] p-4 md:p-6">
        <div className="grid overflow-hidden rounded-[1.8rem] bg-slate-950 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative p-8 text-slate-50 md:p-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Atlas Cinema
            </div>
            <h1 className="text-4xl font-bold leading-tight">Redirecting you to the Atlas Cinema sign in.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
              Authentication is handled securely through the configured identity provider.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-6 bg-white px-8 py-10 text-center text-slate-900 md:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/12 text-primary">
              <Clapperboard className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Back Office Login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in with your Keycloak account to access admin tools.
              </p>
            </div>
            <Button onClick={login} className="w-full">
              Sign in with Keycloak
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
