import { useState, useEffect } from 'react';
import type { Screening, Movie, Branch, Screen } from '../types';
import { getScreenings, createScreening } from '@/api/screenings';
import { getMovies } from '@/api/movies';
import { getBranches } from '@/api/branches';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2, CalendarDays, MapPin, Video, Ticket, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const screeningSchema = z.object({
  movieId: z.coerce.number().min(1, 'Movie is required'),
  branchId: z.coerce.number().min(1, 'Branch is required'),
  screenId: z.coerce.number().min(1, 'Screen is required'),
  startTime: z.string().min(1, 'Start Time is required'),
  endTime: z.string().min(1, 'End Time is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
});

type ScreeningFormValues = z.infer<typeof screeningSchema>;

export default function ScreeningsPage() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ScreeningFormValues>({
    resolver: zodResolver(screeningSchema) as any,
    defaultValues: {
      movieId: 0,
      branchId: 0,
      screenId: 0,
      startTime: '',
      endTime: '',
    },
  });

  const selectedMovieId = form.watch('movieId');
  const selectedBranchId = form.watch('branchId');
  const startTimeVal = form.watch('startTime');

  useEffect(() => {
    if (selectedMovieId && startTimeVal) {
      const selectedMovie = movies.find(m => m.id === Number(selectedMovieId));
      if (selectedMovie) {
        const start = new Date(startTimeVal);
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + selectedMovie.duration * 60000);
          const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          form.setValue('endTime', endStr);
        }
      }
    }
  }, [selectedMovieId, startTimeVal, movies, form]);

  const uniqueBranches = Array.from(new Map(branches.map(b => [b.id, b])).values());
  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const filteredScreens: Screen[] = selectedBranch?.screens || [];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [screeningsRes, moviesRes, branchesRes] = await Promise.all([
        getScreenings(),
        getMovies(),
        getBranches(),
      ]);
      setScreenings(screeningsRes.data);
      
      const activeMovies = moviesRes.data.filter((m: Movie) => m.isActive);
      setMovies(activeMovies);
      
      const activeBranches = branchesRes.data.filter((b: Branch) => b.isActive);
      setBranches(activeBranches);
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

  const onSubmit = async (values: ScreeningFormValues) => {
    try {
      setSaving(true);
      const payload = {
        movie: { id: values.movieId },
        screen: { id: values.screenId },
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        price: values.price,
      };
      await createScreening(payload as any);
      setOpen(false);
      form.reset();
      fetchData();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) form.reset();
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Screenings</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage movie showtimes across all branches.</p>
        </div>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-md shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> Schedule Screening
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
            <div className="px-8 py-8 border-b border-border shrink-0">
              <SheetHeader>
                <SheetTitle className="text-3xl font-extrabold tracking-tight">Schedule a Screening</SheetTitle>
                <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                  Assign a movie to a physical screen, then set its timing and pricing.
                </SheetDescription>
              </SheetHeader>
            </div>
            
            <Form {...form}>
              <form id="screening-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-8 space-y-10">
                  
                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Location & Media
                    </h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="movieId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Movie</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ? String(field.value) : ''}
                            >
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Select a movie to screen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                {movies.map(movie => (
                                  <SelectItem key={movie.id} value={String(movie.id)}>
                                    {movie.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="branchId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Branch Location</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(parseInt(val));
                                  form.setValue('screenId', 0 as any); // Reset screen selection
                                }}
                                value={field.value ? String(field.value) : ''}
                              >
                                <FormControl>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Branch" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {uniqueBranches.map(branch => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                      {branch.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="screenId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Screen Room</FormLabel>
                              <Select
                                onValueChange={(val) => field.onChange(parseInt(val))}
                                value={field.value ? String(field.value) : ''}
                                disabled={!selectedBranchId}
                              >
                                <FormControl>
                                  <SelectTrigger className={`${inputClass} disabled:opacity-50`}>
                                    <SelectValue placeholder="Screen" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {filteredScreens.map(screen => (
                                    <SelectItem key={screen.id} value={String(screen.id)}>
                                      {screen.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-border/30 shrink-0" />

                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Schedule & Commerce
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Start Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: End Time <span className="text-xs text-muted-foreground/50 font-normal">(Auto)</span></FormLabel>
                              <FormControl>
                                <Input type="datetime-local" className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Ticketing Price ($)</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">$</span>
                                <Input 
                                  type="number" step="0.01" 
                                  className={`${inputClass} pl-8 text-primary font-semibold text-lg h-12`}
                                  {...field} 
                                  value={field.value || ''} 
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                                />
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground/70">Set a specific price overriding the movie's default pricing.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                </div>
              </form>
            </Form>

            <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0 z-10">
              <Button type="button" variant="ghost" className="rounded-md px-6" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" form="screening-form" size="lg" className="rounded-md shadow-sm px-8" disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Scheduling...</>
                ) : 'Publish Screening'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Loading schedules...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Screening Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {screenings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                     <div className="flex flex-col items-center">
                       <Ticket className="h-12 w-12 mb-3 opacity-20" />
                       No screenings currently scheduled.
                     </div>
                  </TableCell>
                </TableRow>
              ) : (
                screenings.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((screening) => (
                  <TableRow key={screening.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{screening.id}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground text-base mb-1 flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-primary" />
                        {screening.movie.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {screening.screen?.branch?.name || 'Unknown Branch'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 ml-4.5">
                        {screening.screen?.name || 'Unknown Screen'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(screening.startTime), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(screening.startTime), 'h:mm a')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(screening.endTime), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(screening.endTime), 'h:mm a')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {screening.price ? `$${screening.price.toFixed(2)}` : (
                        <span className="text-muted-foreground text-xs italic">Inherited</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(screening.startTime) > new Date() ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Upcoming
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                          <XCircle className="w-3 h-3 mr-1" />
                          Concluded
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <div>
              Showing {Math.min(screenings.length, (page * itemsPerPage) + 1)} - {Math.min(screenings.length, (page + 1) * itemsPerPage)} of {screenings.length} screenings
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= screenings.length} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}