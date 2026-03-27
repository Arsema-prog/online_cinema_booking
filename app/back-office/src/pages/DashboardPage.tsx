import { useEffect, useState } from 'react';
import { getBranches } from '@/api/branches';
import { getMovies } from '@/api/movies';
import { getScreens } from '@/api/screens';
import { getScreenings } from '@/api/screenings';
import { getUsers } from '@/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Film, Monitor, Calendar, Users } from 'lucide-react';

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    branches: 0,
    movies: 0,
    screens: 0,
    screenings: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [branches, movies, screens, screenings, users] = await Promise.all([
          getBranches(),
          getMovies(),
          getScreens(),
          getScreenings(),
          getUsers(undefined, 0, 1), // get total count
        ]);
        setCounts({
          branches: branches.data.length,
          movies: movies.data.length,
          screens: screens.data.length,
          screenings: screenings.data.length,
          users: users.data.total,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const cards = [
    { title: 'Branches', value: counts.branches, icon: Building2 },
    { title: 'Movies', value: counts.movies, icon: Film },
    { title: 'Screens', value: counts.screens, icon: Monitor },
    { title: 'Screenings', value: counts.screenings, icon: Calendar },
    { title: 'Users', value: counts.users, icon: Users },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}