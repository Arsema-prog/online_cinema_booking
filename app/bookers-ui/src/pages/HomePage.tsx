import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Film, PlayCircle, LogIn, UserPlus, Sparkles, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const HomePage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/bookers/movies');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleRegister = () => {
    navigate('/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="bg-muted rounded-full p-4 mb-4">
          <Film className="h-10 w-10 text-primary spin" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Entering the cinema...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-background flex flex-col font-sans overflow-hidden">
      
      {/* Structural Hero Background (Masked by Dark Mode Base) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

      {/* Hero Content aligned to standard container constraints */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 md:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 border border-border rounded-full mb-8 animate-fadeIn text-sm font-medium">
           <Sparkles className="h-4 w-4 text-primary" />
           <span className="text-foreground">Experience Premium Cinema</span>
        </div>

        <h1 className="font-headline text-5xl md:text-7xl font-black text-foreground mb-6 animate-fadeIn tracking-tight" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          ATLAS<span className="text-primary">CINEMA</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          Your premium destination for the biggest blockbusters. Secure your favorite seats in our luxury IMAX halls with realtime booking integration.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fadeIn" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <Button onClick={login} size="lg" className="h-12 w-full sm:w-auto gap-2 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <LogIn size={20} />
            Login to Book
          </Button>
          
          <Button onClick={handleRegister} variant="outline" size="lg" className="h-12 w-full sm:w-auto gap-2 rounded-xl font-bold border-border bg-card/50 hover:bg-accent hover:text-accent-foreground text-foreground">
            <UserPlus size={20} />
            Create Account
          </Button>
        </div>

        {/* Feature Grid matching back-office analytics cards structure */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-fadeIn" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <div className="flex flex-col items-center bg-card/40 p-6 rounded-2xl border border-border backdrop-blur-sm">
             <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
               <MonitorPlay className="h-6 w-6 text-primary" />
             </div>
             <h3 className="font-headline text-xl font-bold text-foreground mb-2">4K IMAX Laser</h3>
             <p className="text-sm text-muted-foreground">Crystal clear projection technology for extreme immersion.</p>
          </div>
          
          <div className="flex flex-col items-center bg-card/40 p-6 rounded-2xl border border-border backdrop-blur-sm">
             <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
               <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>speaker</span>
             </div>
             <h3 className="font-headline text-xl font-bold text-foreground mb-2">Dolby Atmos</h3>
             <p className="text-sm text-muted-foreground">Spatial audio architecture that moves completely around you.</p>
          </div>

          <div className="flex flex-col items-center bg-card/40 p-6 rounded-2xl border border-border backdrop-blur-sm">
             <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
               <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chair</span>
             </div>
             <h3 className="font-headline text-xl font-bold text-foreground mb-2">Reclining Comfort</h3>
             <p className="text-sm text-muted-foreground">Exceptional comfort featuring wide seats and personal space.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
