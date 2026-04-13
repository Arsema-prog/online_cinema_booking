import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { cn } from "@/lib/utils";
import { LogOut, Film, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const BookersLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="relative flex min-h-screen flex-col bg-background selection:bg-primary/30">
      
      {/* Floating Navbar */}
      <header className="fixed top-4 left-1/2 z-50 flex w-[95%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl shadow-2xl transition-all duration-300">
        
        <div className="flex items-center gap-8">
          <Link to="/bookers/movies" className="flex items-center gap-2 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Film className="h-5 w-5 z-10" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md group-hover:bg-primary/40 transition-colors" />
            </div>
            <span className="font-headline text-lg font-bold tracking-wide text-white">ATLAS<span className="text-primary font-light">CINEMA</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            <Link 
              to="/bookers/movies" 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200", 
                isActive("/bookers/movies") ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              Movies
            </Link>
            <Link 
              to="/bookers/history" 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200", 
                isActive("/bookers/history") ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              Bookings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
             <span className="text-sm font-medium text-white/80">{user?.preferred_username || 'User'}</span>
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-inner">
               <User className="h-4 w-4 text-white" />
             </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="text-white/70 hover:text-white hover:bg-destructive/20 gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-28">
        <Outlet />
      </main>

    </div>
  );
};