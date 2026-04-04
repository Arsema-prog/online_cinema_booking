import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard, Building2, Film, Monitor, Calendar, Users, FileSignature, ShieldCheck, Clapperboard, CircleDot, ShoppingBasket } from 'lucide-react';
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

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile sidebar (Sheet) */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-40">
          <Button variant="outline" size="icon" className="bg-white/75 backdrop-blur-xl border-white/60">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <div className="relative h-full overflow-hidden">
            <div className="absolute inset-x-6 top-6 h-32 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(245,166,35,0.35),transparent_70%)] opacity-80" />
            <div className="relative p-6">
            <Link to="/" className="mb-8 flex items-center gap-3 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div>
                <div>Atlas Cinema</div>
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-sidebar-foreground/55">Back Office</div>
              </div>
            </Link>
            <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{displayName}</div>
                  <div className="truncate text-xs text-sidebar-foreground/60">{user?.email || 'Operations Console'}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-sidebar-foreground/70">
                <span>{currentRole}</span>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white text-sidebar shadow-[0_16px_40px_-24px_rgba(245,166,35,0.95)]'
                        : 'text-sidebar-foreground/70 hover:bg-white/8 hover:text-sidebar-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="absolute bottom-6 left-6 right-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-3 backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-sidebar-foreground/55">
              <CircleDot className="h-3.5 w-3.5 text-emerald-400" />
              Live Operations
            </div>
            <div className="flex items-center justify-between">
            <Button variant="ghost" className="justify-start flex-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/8 rounded-xl" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
            <div className="ml-2">
              <ModeToggle />
            </div>
            </div>
          </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="relative z-10 hidden w-80 shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="absolute inset-x-8 top-8 h-40 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,rgba(245,166,35,0.32),transparent_70%)] opacity-90" />
        <Link to="/" className="relative p-8 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 shrink-0">
            <Film className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">Atlas Cinema</div>
          </div>
        </Link>

        <div className="relative mx-6 mb-8 rounded-[1.8rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary text-lg font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold tracking-tight">{displayName}</div>
              <div className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-primary">
                <ShieldCheck className="h-3 w-3" />
                {currentRole}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-3 text-xs font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/45">
          Control Deck
        </div>

        <nav className="relative flex flex-1 flex-col gap-2 px-4">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-white text-sidebar shadow-[0_18px_40px_-28px_rgba(245,166,35,1)]'
                    : 'text-sidebar-foreground/72 hover:bg-white/8 hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mx-6 mb-8 mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-6">
          <Button variant="ghost" className="justify-start flex-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/8 rounded-xl transition-colors" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
          <ModeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 w-full flex-1 overflow-y-auto">
        <div className="cinema-grid min-h-full px-6 py-20 md:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="glass-panel mb-8 flex items-center justify-between rounded-[2rem] px-8 py-6">
              <div>
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary/80">Command Center</div>
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Atlas Cinema Control Room</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-emerald-600">
                  Systems Online
                </div>
              </div>
            </div>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
