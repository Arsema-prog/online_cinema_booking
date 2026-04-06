import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Film, ChevronRight, Radar, ShieldCheck, Ticket, Sparkles } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground selection:bg-primary/20">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 cinema-grid opacity-[0.15]" />
      <div className="absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
            <Film className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">Atlas Cinema</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {!isAuthenticated && (
            <Button variant="ghost" onClick={() => navigate('/login')} className="font-semibold">
              Sign In
            </Button>
          )}
          <Button 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')} 
            className="rounded-full px-8 shadow-xl shadow-primary/20"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Next-Gen Cinema Management
        </div>
        
        <h1 className="max-w-4xl text-center text-6xl font-black leading-[1.1] tracking-tight md:text-8xl">
          Control your <span className="text-primary italic">cinema empire</span> with precision.
        </h1>
        
        <p className="mt-8 max-w-2xl text-center text-xl font-medium leading-relaxed text-muted-foreground/80">
          A unified command center for scheduling, pricing, inventory, and identity. Built for the modern entertainment industry.
        </p>
        
        <div className="mt-12 flex items-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="h-14 rounded-full px-10 text-lg font-bold shadow-2xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
          >
            Enter Control Room
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="mt-32 grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
          {[
            { 
              icon: Radar, 
              title: "Dynamic Pricing", 
              desc: "Automated surge handling powered by our advanced Drools pricing engine.",
              color: "text-primary"
            },
            { 
              icon: Ticket, 
              title: "Unified Inventory", 
              desc: "From movies to snacks, manage all your assets in one cohesive workspace.",
              color: "text-cyan-500"
            },
            { 
              icon: ShieldCheck, 
              title: "Enterprise IAM", 
              desc: "Bank-grade identity management with Keycloak and role-based enforcement.",
              color: "text-emerald-500"
            }
          ].map((feature, i) => (
            <div key={i} className="group relative rounded-[2.5rem] border border-white/40 bg-white/40 p-10 backdrop-blur-xl transition-all hover:bg-white/60 hover:shadow-2xl hover:shadow-primary/5">
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110 ${feature.color}`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground/90 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="z-10 py-12 text-center text-[0.7rem] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
        © {new Date().getFullYear()} Atlas Cinema Group • Systems Online
      </footer>
    </div>
  );
}
