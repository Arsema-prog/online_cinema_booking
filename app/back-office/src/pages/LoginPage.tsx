import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
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
    <div className="pattern-grid relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 bg-surface text-on-surface">
      <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary-container/30 to-transparent blur-[120px]" />
      
      <div className="bg-surface-container-lowest relative w-full max-w-4xl rounded-[2.5rem] p-4 md:p-6 shadow-[0_0_100px_rgba(0,0,0,0.15)] border border-surface-container-highest/60 backdrop-blur-2xl">
        <div className="grid overflow-hidden rounded-[2rem] bg-surface-container-high md:grid-cols-[1.1fr_0.9fr] border border-surface-container-highest">
          <div className="relative p-10 text-on-surface md:p-12 overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-primary-container/10 blur-[80px]" />
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-surface-container-highest px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary relative z-10 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[1rem]">admin_panel_settings</span>
              Atlas Cinema Security
            </div>
            <h1 className="text-4xl font-headline font-black leading-[1.15] relative z-10">Access Control & Administration</h1>
            <p className="mt-5 max-w-md text-sm font-medium leading-7 text-on-surface-variant relative z-10">
              Authentication is handled securely through Keycloak. Please log in to verify your identity and roles.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-8 bg-surface-container-lowest px-10 py-12 text-center text-on-surface shadow-[-20px_0_40px_rgba(0,0,0,0.05)] border-l border-surface-container-highest/50 relative z-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary-container text-on-primary-container shadow-xl shadow-primary-container/20 border border-primary/20">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>movie_cog</span>
            </div>
            <div>
              <h2 className="text-2xl font-headline font-black">Back Office Login</h2>
              <p className="mt-3 text-xs font-semibold leading-6 text-on-surface-variant">
                Login  with your centralized account to access administrative tools and pricing systems.
              </p>
            </div>
            <Button onClick={login} className="w-full h-14 rounded-xl text-base font-bold shadow-xl hover:-translate-y-1 transition-transform">
              <span className="material-symbols-outlined mr-2">login</span>
              Secure Login 
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
