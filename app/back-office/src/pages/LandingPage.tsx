import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Film, LogIn, ChevronRight, CheckCircle2, Radar, ShieldCheck, Ticket, Sparkles } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground selection:bg-primary/20">
      
      {/* Abstract Background Effects */}
      <div className="absolute inset-0 cinema-grid opacity-50" />
      <div className="absolute left-1/2 top-0 h-[560px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-primary/30 to-transparent blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/4 translate-y-1/4 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-white/40 bg-background/65 p-6 backdrop-blur-xl lg:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
            <Film className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight">Atlas Cinema</span>
            <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Backoffice Suite</div>
          </div>
        </div>
        <div>
          <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')} className="rounded-full px-6" size="sm">
            <LogIn className="mr-2 h-4 w-4" /> Log In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Atlas Cinema version 1.0
        </div>
        
        <h1 className="max-w-5xl text-balance text-5xl font-extrabold leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 md:text-7xl">
          The unified platform for managing <span className="bg-gradient-to-r from-primary via-amber-400 to-cyan-500 bg-clip-text text-transparent">premium cinema</span> experiences.
        </h1>
        
        <p className="mt-6 max-w-3xl text-balance text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 md:text-xl">
          Streamline scheduling, scale locations, govern highly flexible pricing via Drools, and manage roles seamlessly in a world-class, production-ready interface.
        </p>
        
        <div className="mt-10 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 sm:flex-row">
          <Button 
            size="lg" 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="h-12 rounded-full px-8 text-base"
          >
            Sign in to Back Office 
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="h-12 rounded-full px-8 text-base border-white/60 bg-white/60 backdrop-blur-xl">
            View Documentation
          </Button>
        </div>

        <div className="glass-panel mt-16 grid w-full max-w-6xl gap-6 rounded-[2rem] p-6 text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.8rem] bg-slate-950 px-6 py-8 text-slate-50 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.8)]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Atlas Cinema
            </div>
            <h2 className="max-w-lg text-3xl font-semibold leading-tight">One place to manage scheduling, pricing, access control, and branch operations.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Screenings", value: "Live" },
                { label: "Pricing Engine", value: "Drools" },
                { label: "Identity", value: "Keycloak" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</div>
                  <div className="mt-2 text-2xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { icon: Radar, title: "Dynamic Pricing", desc: "Complex rule execution with a built-in Drools (DRL) engine for automated surge handling." },
              { icon: Ticket, title: "Smart Scheduling", desc: "Visual schedule overviews natively synced with automated seat capacity generation." },
              { icon: ShieldCheck, title: "Role-Based Access", desc: "Rigid security standards across administrative, management, and staff hierarchies." }
            ].map((feature, i) => (
              <div key={i} className="rounded-[1.6rem] border border-white/50 bg-white/70 p-5 backdrop-blur-xl">
                <feature.icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-10 grid max-w-5xl grid-cols-1 gap-6 text-left md:grid-cols-3">
          {[
            { title: "Dynamic Pricing", desc: "Complex rule execution with a built-in Drools (DRL) engine for automated surge handling." },
            { title: "Smart Scheduling", desc: "Visual schedule overviews natively synced with automated seat capacity generation." },
            { title: "Role-Based Access", desc: "Rigid security standards across administrative, management, and staff hierarchies." }
          ].map((feature, i) => (
            <div key={i} className="rounded-2xl border border-white/50 bg-card/55 p-6 backdrop-blur-xl shadow-sm transition-colors hover:bg-card/80">
              <CheckCircle2 className="h-6 w-6 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 mt-auto w-full border-t border-white/40 bg-muted/10 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Atlas Cinema Group. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="hover:text-foreground transition-colors cursor-pointer">Support</span>
          <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
