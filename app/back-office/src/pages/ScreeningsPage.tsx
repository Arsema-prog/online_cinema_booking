import { useEffect, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';
import { useToast } from '@/hooks/use-toast';

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

  const { toast } = useToast();

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

      toast({
        title: editingScreening ? 'Screening updated successfully' : 'Screening created successfully',
        description: movie?.title,
        variant: 'success',
      });

      setOpen(false);
      form.reset();
      setEditingScreening(null);
      fetchData();
    } catch (err) {
      console.error('Save failed', err);
      toast({
        title: 'Failed to save screening',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
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
        { name: "startTime", label: "Opening Credits", type: "datetime-local", required: true, icon: <span className="material-symbols-outlined text-[1rem]">schedule</span> },
        { name: "endTime", label: "Expected Credits", type: "datetime-local", required: true, description: "Auto-calculated with 20min buffer." },
        { name: "price", label: "Standard Admission ($)", type: "number", required: true, icon: <span className="material-symbols-outlined text-[1rem]">sell</span> },
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
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card rounded-[2rem] p-8 md:p-10 border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex rounded-lg bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 mb-4">
             Scheduling Systems
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-foreground">Showtimes</h1>
          <p className="text-muted-foreground font-medium mt-2">Orchestrate screening schedules and ticket pricing.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[1.2rem] text-muted-foreground">search</span>
            <Input 
              placeholder="Search schedules..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-background border-border h-14 rounded-2xl w-full shadow-lg font-bold placeholder:text-muted-foreground"
            />
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-primary/20 font-bold shrink-0">
                <span className="material-symbols-outlined mr-2">add</span> Schedule Showtime
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-none shadow-2xl rounded-[3rem] max-h-[90vh] flex flex-col">
              <div className="px-12 py-10 border-b border-border/40 shrink-0 relative overflow-hidden backdrop-blur-3xl bg-background/50">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
                <DialogHeader className="relative z-10 text-left">
                  <DialogTitle className="text-4xl font-headline font-black tracking-tight text-foreground flex items-center gap-3">
                    <span className="material-symbols-outlined text-[2.5rem] text-primary">videocam</span> Session Config
                  </DialogTitle>
                  <DialogDescription className="text-lg mt-3 text-muted-foreground font-medium">
                    Define a new screening session with dynamic time logic.
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <ModernForm
                  form={form as any}
                  schema={screeningSchema}
                  defaultValues={form.getValues()}
                  onSubmit={onSubmit as any}
                  sections={screeningFormSections}
                  isSubmitting={saving}
                  submitLabel={editingScreening ? 'Update Session' : 'Commit Schedule'}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24 text-muted-foreground font-medium">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mr-3">progress_activity</span> Calibrating showtimes...
        </div>
      ) : (
        <div className="rounded-[1.5rem] bg-card overflow-hidden shadow-2xl border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b-border">
                <TableHead className="font-bold text-muted-foreground">Feature Film</TableHead>
                <TableHead className="font-bold text-muted-foreground">Timing</TableHead>
                <TableHead className="font-bold text-muted-foreground">Venue</TableHead>
                <TableHead className="font-bold text-muted-foreground">Fare</TableHead>
                <TableHead className="w-24 text-right font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScreenings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-muted-foreground border-none">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                      <span className="font-bold text-lg">No showtimes have been scheduled for this criteria.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredScreenings.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((scr) => (
                  <TableRow key={scr.id} className="group transition-colors border-b-border">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        {scr.movie.posterUrl ? (
                          <img src={scr.movie.posterUrl} className="h-12 w-8 rounded overflow-hidden shadow-md object-cover" alt="" />
                        ) : (
                           <div className="h-12 w-8 bg-muted rounded flex items-center justify-center">
                             <span className="material-symbols-outlined text-muted-foreground">movie</span>
                           </div>
                        )}
                        <div>
                          <div className="font-headline font-black text-foreground text-base leading-tight">{scr.movie.title}</div>
                          <div className="text-[10px] text-muted-foreground uppercase flex items-center font-bold tracking-widest gap-1 mt-1">
                            <span className="material-symbols-outlined text-[10px]">info</span> {scr.movie.tags?.[0]?.genre || 'INFO'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="font-bold flex items-center text-foreground">
                          {new Date(scr.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="material-symbols-outlined mx-2 text-[1rem] text-muted-foreground/50">arrow_forward</span>
                          {new Date(scr.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center font-medium mt-1">
                          <span className="material-symbols-outlined text-[1rem] mr-1 opacity-60">calendar_month</span> {new Date(scr.startTime).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-foreground flex items-center">
                          <span className="material-symbols-outlined text-[1rem] mr-1.5 opacity-60">tv</span> {scr.screen.name}
                        </div>
                        <div className="text-[9px] uppercase font-black text-primary tracking-widest bg-primary/10 px-1.5 py-0.5 rounded w-fit border border-primary/20">
                          {scr.screen.branch.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-foreground text-base">${(scr.price || 0).toFixed(2)}</span>
                        <span className="material-symbols-outlined text-yellow-500 text-[1rem]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(scr)} className="h-10 w-10 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(scr.id)} className="h-10 w-10 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-5 border-t border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground font-bold gap-4">
            <div>
              Showing <span className="text-foreground">{Math.min(filteredScreenings.length, (page * itemsPerPage) + (filteredScreenings.length > 0 ? 1 : 0))}</span> - <span className="text-foreground">{Math.min(filteredScreenings.length, (page + 1) * itemsPerPage)}</span> of <span className="text-foreground">{filteredScreenings.length}</span> sessions
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border bg-card hover:bg-muted h-10 px-4 rounded-xl shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredScreenings.length} onClick={() => setPage(p => p + 1)} className="border-border bg-card hover:bg-muted h-10 px-4 rounded-xl shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}