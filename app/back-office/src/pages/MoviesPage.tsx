import { useEffect, useState } from 'react';
import { 
  Film, 
  Trash2, 
  Plus, 
  Search, 
  Loader2, 
  Clock, 
  Star, 
  Calendar, 
  Pencil,
  Clapperboard,
  BadgeInfo,
  Type
} from 'lucide-react';
import type { Movie } from '@/types';
import { getMovies, createMovie, updateMovie, deleteMovie } from '@/api/movies';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.coerce.number().min(1, 'Duration is required'),
  releaseDate: z.string().min(1, 'Release date is required'),
  genre: z.string().min(1, 'Genre is required'),
  rating: z.coerce.number().min(0).max(10),
  posterUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

type MovieFormValues = z.infer<typeof movieSchema>;

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  const [open, setOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema) as any,
    defaultValues: { title: '', description: '', duration: 0, releaseDate: '', genre: '', rating: 0, posterUrl: '' },
  });

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await getMovies();
      setMovies(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch movies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const onSubmit = async (values: MovieFormValues) => {
    try {
      setSaving(true);
      if (editingMovie) {
        await updateMovie(editingMovie.id, values);
      } else {
        await createMovie(values);
      }
      setOpen(false);
      form.reset();
      setEditingMovie(null);
      fetchMovies();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const movieFormSections: ModernFormSection[] = [
    {
      title: "Core Metadata",
      fields: [
        { name: "title", label: "Movie Title", type: "text", required: true, placeholder: "e.g. Inception", icon: <Type className="w-4 h-4" />, colSpan: 2 },
        { name: "genre", label: "Genre", type: "text", required: true, placeholder: "e.g. Sci-Fi, Action", icon: <BadgeInfo className="w-4 h-4" /> },
        { name: "rating", label: "Atlas Critics Score", type: "rating", required: true },
        { name: "duration", label: "Screening Time", type: "duration", required: true },
        { name: "releaseDate", label: "Premiere Date", type: "date", required: true },
      ]
    },
    {
      title: "Media & Synopsis",
      fields: [
        { name: "posterUrl", label: "Official Poster", type: "image", placeholder: "Upload film poster" },
        { name: "description", label: "Plot Summary", type: "textarea", placeholder: "Synopsis of the film..." },
      ]
    }
  ];

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    form.reset({
      title: movie.title,
      description: movie.description,
      duration: movie.duration,
      releaseDate: movie.releaseDate,
      genre: movie.genre,
      rating: movie.rating || 0,
      posterUrl: movie.posterUrl || '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this movie?')) {
      try {
        await deleteMovie(id);
        fetchMovies();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.genre.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingMovie(null);
      form.reset();
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Movies</h1>
          <p className="text-muted-foreground mt-1">Manage film catalog and ratings.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search features..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-10 w-64 shadow-sm"
            />
          </div>
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-md shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Register Movie
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
              <div className="px-8 py-8 border-b border-border shrink-0">
                <SheetHeader>
                  <SheetTitle className="text-3xl font-extrabold tracking-tight">
                    {editingMovie ? 'Edit Feature' : 'Register New Film'}
                  </SheetTitle>
                  <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                    {editingMovie ? 'Update metadata for this official selection.' : 'Add a new title to the cinema database.'}
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <ModernForm
                schema={movieSchema}
                defaultValues={form.getValues()}
                onSubmit={onSubmit as any}
                sections={movieFormSections}
                isSubmitting={saving}
                submitLabel={editingMovie ? 'Save Metadata' : 'Launch Feature'}
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
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Synchronizing film library...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Official Selection</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Release</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Clapperboard className="h-12 w-12 mb-3 opacity-20" />
                      No films matching your criteria were found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovies.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((movie) => (
                  <TableRow key={movie.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">#{movie.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        {movie.posterUrl ? (
                          <img src={movie.posterUrl} className="h-14 w-10 object-cover rounded shadow-sm border border-border" alt="" />
                        ) : (
                          <div className="h-14 w-10 bg-muted flex items-center justify-center rounded text-muted-foreground">
                            <Film className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-foreground text-base leading-tight">{movie.title}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-1">{movie.genre}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-xs font-semibold text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1 opacity-60" /> {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                        </div>
                        <Badge variant="secondary" className="w-fit text-[9px] font-bold px-1.5 py-0 rounded opacity-70">
                          {movie.genre.split(',')[0]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1 opacity-60" />
                        {movie.releaseDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                        <span className="font-black text-sm">{(movie.rating || 0).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(movie)} className="h-8 w-8 text-primary hover:bg-primary/10">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(movie.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
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
              Showing {Math.min(filteredMovies.length, (page * itemsPerPage) + 1)} - {Math.min(filteredMovies.length, (page + 1) * itemsPerPage)} of {filteredMovies.length} features
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredMovies.length} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}