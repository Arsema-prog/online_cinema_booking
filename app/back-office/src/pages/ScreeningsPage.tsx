import { useEffect, useState } from 'react';
import type { Screening, Movie, Screen } from '@/types';
import { getScreenings, createScreening } from '@/api/screenings';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { format } from 'date-fns'; // optional, for display

// Updated schema with proper preprocessing for numbers
const screeningSchema = z.object({
  movieId: z.coerce.number().min(1, 'Movie is required'),
  screenId: z.coerce.number().min(1, 'Screen is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

type ScreeningFormValues = z.infer<typeof screeningSchema>;

export default function ScreeningsPage() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<ScreeningFormValues>({
    resolver: zodResolver(screeningSchema) as any,
    defaultValues: { movieId: undefined, screenId: undefined, startTime: '', endTime: '' },
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

  const onSubmit = async (values: ScreeningFormValues) => {
    try {
      const movie = movies.find(m => m.id === values.movieId);
      const screen = screens.find(s => s.id === values.screenId);
      if (!movie || !screen) throw new Error('Selected movie or screen not found');

      await createScreening({
        startTime: values.startTime,
        endTime: values.endTime,
        movie,
        screen,
      });

      setOpen(false);
      form.reset();
      fetchData();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) form.reset();
  };

  // Helper to format datetime for display
  const formatDateTime = (iso: string) => {
    try {
      return format(new Date(iso), 'PPpp');
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Screenings</h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Screening
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Screening</DialogTitle>
              <DialogDescription>
                Fill in the details to schedule a new screening.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="movieId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Movie</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ? String(field.value) : ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a movie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                <FormField
                  control={form.control}
                  name="screenId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screen</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ? String(field.value) : ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a screen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {screens.map(screen => (
                            <SelectItem key={screen.id} value={String(screen.id)}>
                              {screen.name} ({screen.branch.name})
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
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
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
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Movie</TableHead>
              <TableHead>Screen</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {screenings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No screenings found.
                </TableCell>
              </TableRow>
            ) : (
              screenings.map((screening) => (
                <TableRow key={screening.id}>
                  <TableCell>{screening.id}</TableCell>
                  <TableCell>{screening.movie.title}</TableCell>
                  <TableCell>{screening.screen.name}</TableCell>
                  <TableCell>{screening.screen.branch.name}</TableCell>
                  <TableCell>{formatDateTime(screening.startTime)}</TableCell>
                  <TableCell>{formatDateTime(screening.endTime)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}