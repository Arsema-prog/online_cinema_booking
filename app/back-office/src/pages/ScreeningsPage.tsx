import { useEffect, useState } from 'react';
import { 
  Projector, 
  Trash2, 
  Plus, 
  Search, 
  Loader2, 
  Clock, 
  Star, 
  Calendar, 
  BadgeInfo, 
  ArrowRight, 
  MonitorPlay, 
  Pencil,
  Tag
} from 'lucide-react';
import type { Screening, Movie, Screen } from '@/types';
import { getScreenings, createScreening, updateScreening, deleteScreening } from '@/api/screenings';
import { getMovies } from '@/api/movies';
import { getScreens } from '@/api/screens';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';

const screeningSchema = z.object({
  movieId: z.coerce.number().min(1, 'Movie is required'),
  screenId: z.coerce.number().min(1, 'Screen is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
});

type ScreeningFormValues = z.infer<typeof screeningSchema>;

export default function ScreeningsPage() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  const [open, setOpen] = useState(false);
  const [editingScreening, setEditingScreening] = useState<Screening | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ScreeningFormValues>({
    resolver: zodResolver(screeningSchema) as any,
    defaultValues: { movieId: 0, screenId: 0, startTime: '', endTime: '', price: 0 },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [screeningsRes, moviesRes, screensRes] = await Promise.all([
        getScreenings(),
        getMovies(),
        getScreens(),
      ]);
      setScreenings(screeningsRes.data);
      setMovies(moviesRes.data);
      setScreens(screensRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const movieWatch = form.watch('movieId');
  const startWatch = form.watch('startTime');

  useEffect(() => {
    if (movieWatch && startWatch) {
      const movie = movies.find(m => m.id === Number(movieWatch));
      if (movie && startWatch) {
        const start = new Date(startWatch);
        const end = new Date(start.getTime() + (movie.duration + 20) * 60000); 
        form.setValue('endTime', end.toISOString().slice(0, 16));
      }
    }
  }, [movieWatch, startWatch, movies, form]);

  const onSubmit = async (values: ScreeningFormValues) => {
    try {
      setSaving(true);
      const movie = movies.find(m => m.id === Number(values.movieId));
      const screen = screens.find(s => s.id === Number(values.screenId));

      if (!movie || !screen) throw new Error('Missing selection');

      const payload = {
        movie,
        screen,
        startTime: values.startTime,
        endTime: values.endTime,
        price: values.price,
      };

      if (editingScreening) {
        await updateScreening(editingScreening.id, payload);
      } else {
        await createScreening(payload);
      }
      setOpen(false);
      form.reset();
      setEditingScreening(null);
      fetchData();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const screeningFormSections: ModernFormSection[] = [
    {
      title: "Content & Venue",
      fields: [
        { 
          name: "movieId", label: "Select Feature Film", type: "select", required: true,
          options: movies.map(m => ({ label: m.title, value: String(m.id) })),
          colSpan: 2
        },
        { 
          name: "screenId", label: "Physical Screen Room", type: "select", required: true,
          options: screens.map(s => ({ label: `${s.branch.name} - ${s.name}`, value: String(s.id) })),
          colSpan: 2
        },
      ]
    },
    {
      title: "Scheduling & Pricing",
      fields: [
        { name: "startTime", label: "Opening Credits", type: "date", required: true, icon: <Clock className="w-4 h-4" /> },
        { name: "endTime", label: "Expected Credits", type: "date", required: true, description: "Auto-calculated with 20min buffer." },
        { name: "price", label: "Standard Admission ($)", type: "number", required: true, icon: <Tag className="w-4 h-4" /> },
      ]
    }
  ];

  const handleEdit = (screening: Screening) => {
    setEditingScreening(screening);
    form.reset({
      movieId: screening.movie.id,
      screenId: screening.screen.id,
      startTime: screening.startTime,
      endTime: screening.endTime,
      price: screening.price || 0,
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to cancel this screening?')) {
      try {
        await deleteScreening(id);
        fetchData();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const filteredScreenings = screenings.filter(s => 
    s.movie.title.toLowerCase().includes(search.toLowerCase()) || 
    s.screen.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingScreening(null);
      form.reset();
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Showtimes</h1>
          <p className="text-muted-foreground mt-1">Orchestrate screening schedules and ticket pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search schedules..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-10 w-64 shadow-sm"
            />
          </div>
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-md shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Schedule Showtime
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
              <div className="px-8 py-8 border-b border-border shrink-0">
                <SheetHeader>
                  <SheetTitle className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                    <Projector className="h-8 w-8 text-primary" /> Session Config
                  </SheetTitle>
                  <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                    Define a new screening session with dynamic time logic.
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <ModernForm
                form={form as any}
                schema={screeningSchema}
                defaultValues={form.getValues()}
                onSubmit={onSubmit as any}
                sections={screeningFormSections}
                isSubmitting={saving}
                submitLabel={editingScreening ? 'Update Session' : 'Commit Schedule'}
                onCancel={() => setOpen(false)}
                className="flex-1 overflow-hidden"
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground font-medium">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Calibrating showtimes...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Feature Film</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScreenings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Projector className="h-12 w-12 mb-3 opacity-20" />
                      No showtimes have been scheduled for this criteria.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredScreenings.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((scr) => (
                  <TableRow key={scr.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {scr.movie.posterUrl && (
                          <img src={scr.movie.posterUrl} className="h-10 w-7 rounded-sm border border-border object-cover" alt="" />
                        )}
                        <div>
                          <div className="font-bold text-foreground leading-tight">{scr.movie.title}</div>
                          <div className="text-[10px] text-muted-foreground uppercase flex items-center font-bold tracking-widest gap-1 mt-0.5">
                            <BadgeInfo className="w-3 h-3" /> {scr.movie.genre.split(',')[0]}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="font-bold flex items-center">
                          {new Date(scr.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <ArrowRight className="mx-2 h-3 w-3 text-muted-foreground opacity-40" />
                          {new Date(scr.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1 opacity-60" /> {new Date(scr.startTime).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="font-semibold text-foreground flex items-center">
                          <MonitorPlay className="w-3 h-3 mr-1.5 opacity-60" /> {scr.screen.name}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                          {scr.screen.branch.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-foreground">${(scr.price || 0).toFixed(2)}</span>
                        <Star className="w-3 h-3 text-yellow-500 fill-current opacity-60" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(scr)} className="h-8 w-8 text-primary hover:bg-primary/10">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(scr.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <div>
              Showing {Math.min(filteredScreenings.length, (page * itemsPerPage) + 1)} - {Math.min(filteredScreenings.length, (page + 1) * itemsPerPage)} of {filteredScreenings.length} sessions
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredScreenings.length} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}