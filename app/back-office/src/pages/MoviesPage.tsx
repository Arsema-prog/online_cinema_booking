import { useEffect, useState } from 'react';
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
import { env } from '../../env';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.coerce.number().min(1, 'Duration is required'),
  releaseDate: z.string().min(1, 'Release date is required'),
  genre: z.string().min(1, 'Genre is required'),
  rating: z.coerce.number().min(0).max(10),
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
    defaultValues: { title: '', description: '', duration: 0, releaseDate: '', genre: '', rating: 0 },
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

  const onSubmit = async (values: MovieFormValues, files: Record<string, File | null>) => {
    try {
      setSaving(true);
      const posterFile = files['poster'] || undefined;
      
      if (editingMovie) {
        await updateMovie(editingMovie.id, values, posterFile);
      } else {
        await createMovie(values, posterFile);
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
        { name: "title", label: "Movie Title", type: "text", required: true, placeholder: "e.g. Inception", icon: <span className="material-symbols-outlined text-[1rem]">title</span>, colSpan: 2 },
        { name: "genre", label: "Genre", type: "text", required: true, placeholder: "e.g. Sci-Fi, Action", icon: <span className="material-symbols-outlined text-[1rem]">info</span> },
        { name: "rating", label: "Atlas Critics Score", type: "rating", required: true },
        { name: "duration", label: "Screening Time", type: "duration", required: true },
        { name: "releaseDate", label: "Premiere Date", type: "date", required: true },
      ]
    },
    {
      title: "Media & Synopsis",
      fields: [
        { name: "poster", label: "Official Poster", type: "image", placeholder: "Upload film poster" },
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
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card rounded-[2rem] p-8 md:p-10 border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex rounded-lg bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 mb-4">
             Content Management
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-foreground">Movies</h1>
          <p className="text-muted-foreground font-medium mt-2">Manage film catalog, metadata, and theatrical ratings.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[1.2rem] text-muted-foreground">search</span>
            <Input 
              placeholder="Search features..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-background border-border h-14 rounded-2xl w-full shadow-lg font-bold placeholder:text-muted-foreground"
            />
          </div>
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-[0_6px_20px_rgba(93,93,255,0.23)] hover:-translate-y-0.5 transition duration-200 font-bold shrink-0">
                <span className="material-symbols-outlined mr-2">add</span> Register Movie
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-card p-0 flex flex-col shadow-2xl">
              <div className="px-10 py-8 border-b border-border shrink-0 bg-card relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full" />
                <SheetHeader className="relative z-10">
                  <SheetTitle className="text-3xl font-headline font-black tracking-tight text-foreground">
                    {editingMovie ? 'Edit Feature' : 'Register New Film'}
                  </SheetTitle>
                  <SheetDescription className="text-base mt-2 text-muted-foreground font-medium">
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
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24 text-muted-foreground font-medium">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mr-3">progress_activity</span> Synchronizing film library...
        </div>
      ) : (
        <div className="rounded-[1.5rem] bg-card overflow-hidden shadow-2xl border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b-border">
                <TableHead className="w-16 font-bold text-muted-foreground">ID</TableHead>
                <TableHead className="font-bold text-muted-foreground">Official Selection</TableHead>
                <TableHead className="font-bold text-muted-foreground">Details</TableHead>
                <TableHead className="font-bold text-muted-foreground">Release</TableHead>
                <TableHead className="font-bold text-muted-foreground">Rating</TableHead>
                <TableHead className="w-24 text-right font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-muted-foreground border-none">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>movie_filter</span>
                      <span className="font-bold">No films matching your criteria were found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovies.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((movie) => (
                  <TableRow key={movie.id} className="group hover:bg-muted/30 transition-colors border-b-border">
                    <TableCell className="font-bold text-muted-foreground/70">#{movie.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-5">
                        <img 
                          src={`${env.apiGatewayUrl}/api/v1/core/movies/${movie.id}/poster`} 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                          className="h-[4.5rem] w-12 object-cover rounded-md shadow-md border border-border" 
                          alt="" 
                        />
                        <div style={{display: 'none'}} className="h-[4.5rem] w-12 bg-muted items-center justify-center rounded-md text-muted-foreground/50 border border-border shadow-inner">
                          <span className="material-symbols-outlined text-xl">movie</span>
                        </div>
                        <div>
                          <div className="font-headline font-black text-foreground text-lg leading-tight">{movie.title}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1.5 bg-muted inline-flex px-1.5 py-0.5 rounded">{movie.genre}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center text-xs font-bold text-muted-foreground">
                          <span className="material-symbols-outlined text-[1rem] mr-1.5 opacity-60">schedule</span> {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                        </div>
                        <Badge variant="secondary" className="w-fit text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-muted text-foreground border-transparent">
                          {movie.genre.split(',')[0]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs font-bold text-muted-foreground">
                        <span className="material-symbols-outlined text-[1rem] mr-1.5 opacity-60">calendar_month</span>
                        {movie.releaseDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 bg-yellow-500/10 w-fit px-2 py-1 rounded-lg border border-yellow-500/20">
                        <span className="material-symbols-outlined text-[1rem] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-black text-sm text-yellow-500">{(movie.rating || 0).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(movie)} className="h-10 w-10 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(movie.id)} className="h-10 w-10 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl shadow-sm">
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
              Showing <span className="text-foreground">{Math.min(filteredMovies.length, (page * itemsPerPage) + (filteredMovies.length > 0 ? 1 : 0))}</span> - <span className="text-foreground">{Math.min(filteredMovies.length, (page + 1) * itemsPerPage)}</span> of <span className="text-foreground">{filteredMovies.length}</span> features
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border bg-card hover:bg-muted h-10 px-4 rounded-xl shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredMovies.length} onClick={() => setPage(p => p + 1)} className="border-border bg-card hover:bg-muted h-10 px-4 rounded-xl shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}