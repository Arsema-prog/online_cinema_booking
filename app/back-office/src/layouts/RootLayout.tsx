import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/branches', label: 'Branches', icon: 'store', roles: ['ADMIN'] },
  { to: '/movies', label: 'Movies', icon: 'movie', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/screens', label: 'Screens', icon: 'fullscreen', roles: ['ADMIN', 'MANAGER'] },
  { to: '/screenings', label: 'Screenings', icon: 'schedule', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/snacks', label: 'Inventory', icon: 'movie_filter', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { to: '/users', label: 'Users', icon: 'group', roles: ['ADMIN', 'MANAGER'] },
  { to: '/rules', label: 'Pricing', icon: 'request_quote', roles: ['ADMIN', 'MANAGER'] },
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
        <h1 className="text-xl font-black text-primary-container tracking-widest uppercase">Atlas Cinema</h1>
        <p className="text-xs text-on-surface-variant uppercase tracking-tighter mt-1 font-bold">Management Suite</p>
      </div>
      <nav className="flex flex-col gap-1 px-2 overflow-y-auto hide-scrollbar flex-1 pb-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_20px_var(--color-primary-container)]/30'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/10" />
              )}
              <span className="material-symbols-outlined relative z-10" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-semibold text-sm relative z-10 tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto px-4 pt-4 pb-2 border-t border-surface-container-highest/30">
        <div className="bg-surface-container-high rounded-xl p-4 mb-2 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg">
            {displayInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate text-on-surface">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{currentRole}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            className="flex-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest font-bold text-xs uppercase tracking-widest"
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
    <div className="bg-surface text-on-surface min-h-screen flex selection:bg-primary/30 font-sans">
      
      {/* Mobile Drawer */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button size="icon" className="h-14 w-14 rounded-full bg-primary-container text-on-primary-container shadow-2xl hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-surface-container-lowest border-r border-surface-container-highest/20 p-0 flex flex-col pt-6">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest flex-col gap-2 py-6 z-40 border-r border-surface-container-highest/20">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 flex-1 flex flex-col min-h-screen w-full">
        {/* Top Header & Search Toolkit */}
        <header className="flex justify-between items-center px-6 lg:px-10 py-5 w-full sticky top-0 bg-surface/80 backdrop-blur-xl z-30 transition-shadow border-b border-surface-container-highest/10">
          <div className="flex items-center gap-4 hidden md:flex">
            <h2 className="text-lg lg:text-xl font-headline font-bold text-on-surface tracking-tight truncate max-w-sm">
              Operational Center
            </h2>
          </div>
          
          <div className="flex items-center gap-4 ml-auto w-full md:w-auto">
            <div className="relative group w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search across modules..." 
                className="w-full bg-surface-container-high border-none rounded-xl text-sm pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary-container/50 transition-all placeholder:text-on-surface-variant/40 text-on-surface"
              />
            </div>
            
            <div className="hidden lg:flex items-center bg-surface-container-low p-1 rounded-xl">
               <button className="px-4 py-1.5 text-xs font-bold bg-surface-container-highest text-primary-container rounded-lg transition-all hidden xl:block">Live</button>
            </div>
            
            <div className="flex gap-2">
              <button className="w-10 h-10 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Injection */}
        <div className="flex-1 p-6 lg:p-10 pb-24 lg:pb-12 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </div>
        
        {/* Optional simple footer mimicking The Curator */}
        <footer className="mt-auto px-6 lg:px-10 py-6 border-t border-surface-container-highest/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-on-surface-variant/60">
            <span>© 2024 Atlas Cinema Back Office. All Rights Reserved.</span>
            <div className="flex gap-4">
                <a href="#" className="hover:text-on-surface transition-colors">Support</a>
                <a href="#" className="hover:text-on-surface transition-colors">System Logs</a>
            </div>
        </footer>
      </main>
    </div>
  );
}
