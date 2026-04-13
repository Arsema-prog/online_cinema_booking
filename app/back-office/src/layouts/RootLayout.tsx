import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard, Building2, Film, Monitor, Calendar, Users, FileSignature, ShieldCheck, Clapperboard, CircleDot, ShoppingBasket, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/branches', label: 'Branches', icon: Building2, roles: ['ADMIN'] },
  { to: '/movies', label: 'Movies', icon: Film, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/screens', label: 'Screens', icon: Monitor, roles: ['ADMIN', 'MANAGER'] },
  { to: '/screenings', label: 'Screenings', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/snacks', label: 'Snacks', icon: ShoppingBasket, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { to: '/rules', label: 'Pricing', icon: FileSignature, roles: ['ADMIN', 'MANAGER'] },
  { to: '/tickets', label: 'Tickets', icon: QrCode, roles: ['ADMIN'] },
];

export default function RootLayout() {
  const { logout, hasRole, user, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.some(role => hasRole(role))
  );
  
  const currentRole = ['ADMIN', 'MANAGER', 'STAFF'].find((role) => roles.includes(role)) || 'STAFF';
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Cinema Operator';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const SidebarContent = () => (
    <>
      <div className="px-6 mb-8 mt-2">
        <h1 className="text-xl font-headline font-black text-primary tracking-widest uppercase">Atlas Cinema</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-tighter mt-1 font-bold">Management Suite</p>
      </div>
      <nav className="flex flex-col gap-1 px-3 overflow-y-auto hide-scrollbar flex-1 pb-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/5" />
              )}
              <span className={cn("material-symbols-outlined relative z-10", isActive && "font-bold shadow-sm")} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-semibold text-sm relative z-10 tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto px-4 pt-4 pb-2 border-t border-border/50">
        <div className="bg-muted rounded-xl p-4 mb-2 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {displayInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate text-foreground">{displayName}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{currentRole}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            className="flex-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-xs uppercase tracking-widest transition-colors"
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined text-lg mr-2">logout</span> Sign Out
          </Button>
          <ModeToggle />
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-background text-foreground min-h-screen flex selection:bg-primary/30 font-sans">
      
      {/* Mobile Drawer */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button size="icon" className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] bg-card border-r border-border p-0 flex flex-col pt-6">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-[280px] fixed left-0 top-0 bg-card flex-col gap-2 py-6 z-40 border-r border-border shadow-xl">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-[280px] flex-1 flex flex-col min-h-screen w-full relative">
        {/* Top Header & Search Toolkit */}
        <header className="flex justify-between items-center px-6 lg:px-10 py-5 w-full sticky top-0 bg-background/80 backdrop-blur-xl z-30 transition-all border-b border-border/50">
          <div className="flex items-center gap-4 hidden md:flex">
            <h2 className="text-lg lg:text-xl font-headline font-bold text-foreground tracking-tight truncate max-w-sm">
              Operational Center
            </h2>
          </div>
          
          <div className="flex items-center gap-4 ml-auto w-full md:w-auto">
            <div className="relative group w-full md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">search</span>
              <Input
                type="text"
                placeholder="Search across modules..."
                className="w-full bg-muted/50 border-transparent rounded-xl flex-1 text-sm pl-10 pr-4 py-2.5 focus-visible:ring-2 hover:bg-muted focus-visible:ring-primary/50 focus-visible:border-primary transition-all placeholder:text-muted-foreground"
                aria-label="Search across modules"
              />
            </div>
            
            <div className="hidden lg:flex items-center bg-muted/50 p-1 rounded-xl">
               <button className="px-4 py-1.5 text-xs font-bold bg-background text-primary rounded-lg transition-all border border-border shadow-sm hidden xl:block">Live Status</button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="w-10 h-10 shrink-0 rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all relative" aria-label="Notifications">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content Injection */}
        <div className="flex-1 p-6 lg:p-10 pb-24 lg:pb-12 max-w-[1600px] w-full mx-auto relative z-10">
          <Outlet />
        </div>
        
        {/* Footer */}
        <footer className="mt-auto px-6 lg:px-10 py-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-muted-foreground">
            <span>© 2024 Atlas Cinema Back Office. All Rights Reserved.</span>
            <div className="flex gap-4">
                <a href="#" className="hover:text-foreground transition-colors">Support</a>
                <a href="#" className="hover:text-foreground transition-colors">System Logs</a>
            </div>
        </footer>
      </main>
    </div>
  );
}
