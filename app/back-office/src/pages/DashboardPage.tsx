import { useEffect, useState } from 'react';
import { getBranches } from '@/api/branches';
import { getMovies } from '@/api/movies';
import { getScreens } from '@/api/screens';
import { getScreenings } from '@/api/screenings';
import { getUsers } from '@/api/users';
import { getBookings } from '@/api/bookings';
import { Button } from '@/components/ui/button';
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
    { title: 'Branches', value: counts.branches, icon: 'store', bgContainer: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { title: 'Movies', value: counts.movies, icon: 'movie', bgContainer: 'bg-pink-500/10', iconColor: 'text-pink-500' },
    { title: 'Screens', value: counts.screens, icon: 'fullscreen', bgContainer: 'bg-purple-500/10', iconColor: 'text-purple-500' },
    { title: 'Screenings', value: counts.screenings, icon: 'schedule', bgContainer: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { title: 'Users', value: counts.users, icon: 'group', bgContainer: 'bg-orange-500/10', iconColor: 'text-orange-500' },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      <div className="bg-card overflow-hidden rounded-3xl p-8 md:p-10 border border-border shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] relative z-10">
          <div>
            <div className="inline-flex rounded-lg bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
               Welcome back
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-headline font-black tracking-tight text-foreground md:text-5xl">
              Cinema Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground font-medium">
              Manage branches, configure ticket prices using Drools rules, and monitor your entire cinematic ecosystem seamlessly.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/movies">
                <Button className="font-bold flex items-center h-12 px-8 py-0 rounded-xl shadow-[0_4px_14px_0_hsl(var(--primary)/39%)] hover:shadow-[0_6px_20px_rgba(93,93,255,0.23)] hover:-translate-y-0.5 transition duration-200">
                  <span className="material-symbols-outlined mr-2">add_circle</span> Add Movie
                </Button>
              </Link>
              <Link to="/screenings">
                <Button variant="outline" className="font-bold flex items-center h-12 px-8 py-0 rounded-xl bg-muted/50 border-transparent hover:bg-muted text-foreground transition duration-200">
                  <span className="material-symbols-outlined mr-2">calendar_add_on</span> Schedule Show
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-muted/30 p-8 text-foreground flex flex-col justify-center border border-border relative overflow-hidden backdrop-blur-sm">
            <div className="mb-6 text-xs font-bold uppercase tracking-widest text-primary relative z-10">System Overview</div>
            <div className="space-y-4 relative z-10">
              {[
                `Track branches, movies, screens, and screenings`,
                `Monitor current booking activity`,
                `Jump directly into pricing and scheduling`,
              ].map((item) => (
                <div key={item} className="flex items-start gap-4 rounded-xl">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>vital_signs</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-36 bg-card border border-border rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => (
              <div key={card.title} className="bg-card rounded-3xl p-6 border border-border flex flex-col justify-between hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 group shadow-md hover:shadow-xl">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 w-full mb-6">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{card.title}</span>
                  <div className={`rounded-xl p-2.5 ${card.bgContainer} ${card.iconColor} border border-white/5`}>
                  
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="text-4xl font-headline font-black tracking-tight text-foreground">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3 relative z-10">
            <div className="bg-card col-span-2 rounded-3xl border border-border shadow-md transition-colors flex flex-col pt-6 pb-4">
              <div className="border-b border-border pb-5 px-8 mb-6">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground font-headline">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  Weekly Bookings Analysis
                </h2>
              </div>
              <div className="flex-1 w-full px-4">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 12 }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 12 }} dx={-10} />
                      <RechartsTooltip 
                        cursor={{ fill: 'none' }} 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: 'hsl(var(--foreground))', fontWeight: 600 }} 
                        itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 800 }}
                      />
                      <Bar dataKey="bookings" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-card col-span-1 flex flex-col overflow-hidden rounded-3xl border border-border shadow-md transition-colors relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="border-b border-border pb-5 pt-6 px-8 flex items-center justify-between relative z-10">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground font-headline">
                  System Health
                </h2>
                <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <span className="material-symbols-outlined text-[1rem]">check_circle</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center px-8 py-10 text-center relative z-10">
                <div className="mb-6">
                  <div className="rounded-full bg-primary/10 p-5 text-primary border border-primary/20 shadow-inner">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-foreground mb-3 flex flex-col gap-1 items-center font-headline">
                  {counts.bookings}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Total Bookings</span>
                </h3>
                <p className="leading-relaxed mt-4 font-medium text-sm text-muted-foreground">
                  Active <span className="text-primary font-bold">Drools Rules</span> scaling nominal load across <span className="text-foreground font-bold bg-muted px-2 py-0.5 rounded-md text-xs">{counts.branches}</span> branch processors.
                </p>
                <Link to="/rules" className="mt-8 w-full block">
                  <Button variant="secondary" className="w-full font-bold h-12 text-sm shadow-sm rounded-xl bg-muted/50 border hover:bg-muted transition duration-200">
                    <span className="material-symbols-outlined mr-2 text-[1.1rem]">rule_settings</span>
                    Manage Pricing Engine
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
