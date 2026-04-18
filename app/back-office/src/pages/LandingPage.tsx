import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface text-on-surface selection:bg-primary/20">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pattern-grid opacity-[0.4]" />
      <div className="absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-primary-container/20 blur-[120px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-[500px] w-[500px] rounded-full bg-secondary-container/10 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-3xl bg-surface/50 border-b border-surface-container-highest/20">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/25 border border-outline-variant/30">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>movie</span>
          </div>
          <div>
            <div className="text-xl font-headline font-black tracking-tight text-on-surface">Atlas<span className="font-medium text-primary">Cinema</span></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isAuthenticated && (
            <Button variant="ghost" onClick={() => navigate('/login')} className="font-bold text-base h-12 px-6">
              Log In
            </Button>
          )}
          <Button 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')} 
            className="rounded-[1rem] px-8 h-12 shadow-xl shadow-primary-container/20 font-bold text-base"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-28">
        <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-primary-container/30 bg-primary-container/20 px-5 py-2 text-[0.65rem] font-bold uppercase tracking-widest text-primary shadow-sm hover:shadow-md transition-all shadow-primary-container/10 backdrop-blur-md">
          <span className="material-symbols-outlined text-[1rem] animate-pulse">sparkles</span>
          Next-Gen Cinema Management
        </div>
        
        <h1 className="max-w-5xl text-center text-6xl font-headline font-black leading-[1.1] tracking-tight md:text-8xl text-on-surface">
          Command your <span className="text-primary italic bg-surface-container px-2 rounded-3xl pb-2 shadow-inner inline-block -rotate-1 relative top-1 border border-surface-container-highest/50">cinema empire</span> with precision.
        </h1>
        
        <p className="mt-8 max-w-2xl text-center text-xl font-medium leading-relaxed text-on-surface-variant font-system">
          A unified command center for scheduling, pricing, inventory, and identity. Built natively on Drools and Keycloak for the entertainment industry.
        </p>
        
        <div className="mt-14 flex items-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="h-16 rounded-[1.2rem] px-10 text-lg font-bold shadow-2xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center border border-primary/50"
          >
            Enter Control Room
            <span className="material-symbols-outlined ml-2 text-[1.5rem]">chevron_right</span>
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="mt-32 grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
          {[
            { 
              icon: 'radar', 
              title: "Dynamic Pricing", 
              desc: "Automated surge handling powered by our advanced Drools pricing engine.",
              color: "text-primary",
              bg: "bg-primary/10"
            },
            { 
              icon: 'confirmation_number', 
              title: "Unified Inventory", 
              desc: "From movies to snacks, manage all your assets in one cohesive workspace.",
              color: "text-cyan-500",
              bg: "bg-cyan-500/10"
            },
            { 
              icon: 'admin_panel_settings', 
              title: "Enterprise IAM", 
              desc: "Bank-grade identity management with Keycloak and role-based enforcement.",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10"
            }
          ].map((feature, i) => (
            <div key={i} className="group relative rounded-[2rem] border border-surface-container-highest/40 bg-surface-container-low p-10 backdrop-blur-xl transition-all hover:bg-surface-container hover:shadow-2xl hover:-translate-y-2">
              <div className={`mb-8 inline-flex h-16 w-16 items-center justify-center rounded-[1.1rem] ${feature.bg} shadow-sm transition-transform group-hover:scale-110 ${feature.color} border border-surface-container-highest`}>
                <span className="material-symbols-outlined text-[2rem]" style={{ fontVariationSettings: "'FILL' 1" }}>{feature.icon}</span>
              </div>
              <h3 className="mb-3 text-2xl font-headline font-black tracking-tight text-on-surface">{feature.title}</h3>
              <p className="text-on-surface-variant leading-relaxed font-medium text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="z-10 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-surface-container-highest to-transparent" />
        © {new Date().getFullYear()} Atlas Cinema Group • Systems Online
      </footer>
    </div>
  );
}
