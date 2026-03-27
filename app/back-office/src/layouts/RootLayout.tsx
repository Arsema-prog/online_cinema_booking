import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', roles: ['ADMIN', 'MANAGER'] },
  { to: '/branches', label: 'Branches', roles: ['ADMIN', 'MANAGER'] },
  { to: '/movies', label: 'Movies', roles: ['ADMIN', 'MANAGER'] },
  { to: '/screens', label: 'Screens', roles: ['ADMIN', 'MANAGER'] },
  { to: '/screenings', label: 'Screenings', roles: ['ADMIN', 'MANAGER'] },
  { to: '/users', label: 'User Management', roles: ['ADMIN', 'MANAGER'] },
];

export default function RootLayout() {
  const { logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter nav items based on user roles
  const filteredNavItems = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.some(role => hasRole(role))
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar (Sheet) */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-40">
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <nav className="flex flex-col gap-2 p-4">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card p-4">
        <div className="text-xl font-bold mb-6 px-3">Back Office</div>
        <nav className="flex flex-col gap-2 flex-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" className="mt-4 justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}