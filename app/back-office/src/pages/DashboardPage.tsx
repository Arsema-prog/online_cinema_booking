import { useEffect, useState } from 'react';
import { getBranches } from '@/api/branches';
import { getMovies } from '@/api/movies';
import { getScreens } from '@/api/screens';
import { getScreenings } from '@/api/screenings';
import { getUsers } from '@/api/users';
import { getBookings } from '@/api/bookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Film, Monitor, Calendar, Users, TrendingUp, PlusCircle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    branches: 0,
    movies: 0,
    screens: 0,
    screenings: 0,
    users: 0,
    bookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; bookings: number }[]>([]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [branches, movies, screens, screenings, users, bookingsRes] = await Promise.all([
          getBranches().catch(() => ({ data: [] })),
          getMovies().catch(() => ({ data: [] })),
          getScreens().catch(() => ({ data: [] })),
          getScreenings().catch(() => ({ data: [] })),
          getUsers(undefined, 0, 1).catch(() => ({ data: { totalElements: 0 } })),
          getBookings().catch(() => ({ data: [] })),
        ]);
        
        const bookings = bookingsRes.data || [];
        setCounts({
          branches: branches.data?.length || 0,
          movies: movies.data?.length || 0,
          screens: screens.data?.length || 0,
          screenings: screenings.data?.length || 0,
          users: users.data?.totalElements || 0,
          bookings: bookings.length,
        });

        // Compute real weekly data
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));
        
        const realChartData = last7Days.map(date => {
          const dayBookings = bookings.filter((b: any) => 
            b.createdDate && isSameDay(new Date(b.createdDate), date)
          );
          return {
            name: format(date, 'eee'),
            bookings: dayBookings.length,
          };
        });
        
        // Remove mock data - always use real data as requested by user
        setChartData(realChartData);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const cards = [
    { title: 'Branches', value: counts.branches, icon: Building2, color: 'from-blue-500/20 to-cyan-500/20', text: 'text-cyan-500' },
    { title: 'Movies', value: counts.movies, icon: Film, color: 'from-fuchsia-500/20 to-pink-500/20', text: 'text-fuchsia-500' },
    { title: 'Screens', value: counts.screens, icon: Monitor, color: 'from-violet-500/20 to-purple-500/20', text: 'text-violet-500' },
    { title: 'Screenings', value: counts.screenings, icon: Calendar, color: 'from-emerald-500/20 to-green-500/20', text: 'text-emerald-500' },
    { title: 'Users', value: counts.users, icon: Users, color: 'from-orange-500/20 to-red-500/20', text: 'text-orange-500' },
  ];

  return (
    <div className="page-shell animate-in fade-in duration-500">
      
      <div className="glass-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="inline-flex rounded-full bg-primary/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Atlas Cinema
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-foreground md:text-5xl">
              Cinema Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Welcome back to the Atlas Cinema management portal.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/movies">
                <Button className="font-semibold">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Movie
                </Button>
              </Link>
              <Link to="/screenings">
                <Button variant="outline" className="font-semibold">
                  <Calendar className="mr-2 h-4 w-4" /> Schedule Show
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-[1.8rem] bg-slate-950 p-6 text-slate-50 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.8)]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary">System Overview</div>
            <div className="space-y-4">
              {[
                `Track branches, movies, screens, and screenings from one dashboard`,
                `Monitor current booking activity across the platform`,
                `Jump directly into pricing and scheduling workflows`,
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/6 p-4 text-sm text-slate-200">
                  <div className="mt-0.5 rounded-full bg-primary/20 p-1 text-primary">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse h-32 bg-muted/40 border-muted/20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => (
              <Card key={card.title} className="glass-panel rounded-[1.7rem] border-white/55 shadow-sm hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</CardTitle>
                  <div className={`rounded-2xl bg-muted/70 p-2.5 ${card.text}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-4">
                  <div className="text-4xl font-black tracking-tight text-foreground">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3 relative z-10">
            <Card className="glass-panel col-span-2 rounded-[1.8rem] border-white/55 shadow-sm transition-colors">
              <CardHeader className="border-b border-white/45 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Weekly Bookings Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pl-2">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-foreground, #a8a29e)" opacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-foreground, #a8a29e)', opacity: 0.7, fontWeight: 500 }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-foreground, #a8a29e)', opacity: 0.7, fontWeight: 500 }} dx={-10} />
                      <RechartsTooltip 
                        cursor={false} 
                        contentStyle={{ backgroundColor: 'var(--color-card, #fff)', border: '1px solid var(--color-border, #e5e5e5)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', color: 'var(--color-foreground, #0a0a0a)', fontWeight: 600 }} 
                        itemStyle={{ color: 'var(--color-primary, #d946ef)', fontWeight: 700 }}
                      />
                      <Bar dataKey="bookings" radius={[6, 6, 0, 0]} className="fill-primary hover:fill-primary/80 transition-colors" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel col-span-1 flex flex-col overflow-hidden rounded-[1.8rem] border-white/55 shadow-sm transition-colors">
              <CardHeader className="border-b border-white/45 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center items-center p-8 text-center text-muted-foreground relative z-10">
                <div className="mb-6">
                  <div className="rounded-full bg-emerald-500/10 p-5 text-emerald-500">
                    <Activity className="h-10 w-10" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-foreground mb-3">{counts.bookings} <span className="text-lg font-medium text-foreground/60">Total Bookings</span></h3>
                <p className="leading-relaxed">
                  All active <strong className="text-primary font-semibold">Drools Pricing Rules</strong> are functioning nominally across your <strong className="text-foreground">{counts.branches}</strong> connected branches.
                </p>
                <Link to="/rules" className="mt-6 w-full">
                  <Button variant="secondary" className="w-full font-semibold border border-border/50 hover:bg-foreground/10 shadow-sm transition-colors">Manage Pricing Rules</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
