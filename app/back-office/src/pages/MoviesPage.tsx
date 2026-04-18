import { useEffect, useState } from 'react';
import type { Movie, Tag } from '@/types';
import { getMovies, getTags, createMovie, updateMovie, deleteMovie, searchExternalMovies, getExternalMovieDetails } from '@/api/movies';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';
import { env } from '../../env';
import { useToast } from '@/hooks/use-toast';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.coerce.number().min(1, 'Duration is required'),
  releaseDate: z.string().min(1, 'Release date is required'),
  tagIds: z.array(z.number()).min(1, 'At least one tag is required'),
  director: z.string().trim().max(255, 'Director name is too long').optional().or(z.literal('')),
  posterUrl: z.string().trim().max(500, 'Poster URL is too long').optional().or(z.literal('')),
  basePrice: z.coerce.number().positive('Base price must be greater than 0'),
  rating: z.coerce.number().min(0).max(10),
});

type MovieFormValues = z.infer<typeof movieSchema>;

const ImdbSearchField = ({ form, tags }: { form: any, tags: Tag[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setIsSearching(true);
      const res = await searchExternalMovies(searchTerm);
      setResults(res.data || []);
      if (res.data?.length === 0) {
         toast({ title: 'No results found', description: 'Try adjusting your search term' });
      }
    } catch (e) {
      toast({ title: 'Search failed', description: 'Could not fetch from IMDb.', variant: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (movie: Movie) => {
    if (!movie.imdbId) {
      form.setValue('title', movie.title || '');
      toast({ title: 'Metadata Imported', description: `Copied partial details for ${movie.title}`, variant: 'success' });
      setResults([]);
      setSearchTerm('');
      return;
    }
    
    try {
      setIsSearching(true);
      const res = await getExternalMovieDetails(movie.imdbId);
      const detailedMovie = res.data as any; // Allow extraction of arbitrary IMDB response params
      
      form.setValue('title', detailedMovie.title || '');
      
      // Auto-populate multiple mapped tag Ids from DB comparing the string returned by IMDb
      if (detailedMovie.genre && tags.length > 0) {
        const genresStr = detailedMovie.genre;
        const matchedTagIds: number[] = [];
        tags.forEach(t => {
           if (genresStr.toLowerCase().includes(t.genre.toLowerCase())) {
              matchedTagIds.push(t.id);
           }
        });
        if (matchedTagIds.length > 0) form.setValue('tagIds', matchedTagIds);
      }
      
      if (detailedMovie.director) form.setValue('director', detailedMovie.director);
      if (detailedMovie.releaseDate) form.setValue('releaseDate', detailedMovie.releaseDate);
      if (detailedMovie.posterUrl) form.setValue('posterUrl', detailedMovie.posterUrl);
      if (detailedMovie.duration) form.setValue('duration', detailedMovie.duration);
      if (detailedMovie.description) form.setValue('description', detailedMovie.description);
      if (detailedMovie.rating) form.setValue('rating', detailedMovie.rating);
      
      toast({ title: 'Full details loaded', description: `Successfully loaded data for ${detailedMovie.title}`, variant: 'success' });
    } catch (e) {
      toast({ title: 'Fetch failed', description: 'Could not fetch detailed metadata.', variant: 'error' });
    } finally {
      setIsSearching(false);
      setResults([]);
      setSearchTerm('');
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-2">
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80 mb-3 flex items-center"><span className="material-symbols-outlined text-[1rem] mr-2">auto_awesome</span> Automated Metadata Import</div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Input 
          placeholder="Search original title on IMDb..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          className="h-12 bg-background/80 focus-visible:bg-background border-primary/20 hover:border-primary/40 font-bold"
        />
        <Button type="button" onClick={handleSearch} disabled={isSearching} className="h-12 px-6 rounded-xl font-bold whitespace-nowrap w-full sm:w-auto shadow-md">
          {isSearching ? <span className="material-symbols-outlined animate-spin mr-2">refresh</span> : <span className="material-symbols-outlined mr-2">search</span>}
          Search IMDb
        </Button>
      </div>
      {results.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 max-h-[18rem] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
          {results.map((m, idx) => (
            <div key={idx} onClick={() => handleSelect(m)} className="flex items-center gap-4 bg-background/80 hover:bg-background p-3.5 rounded-xl border border-border/80 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md group">
              {m.posterUrl ? (
                <img src={m.posterUrl} alt={m.title} className="w-12 h-16 object-cover rounded-md shadow-sm border border-border/50" />
              ) : (
                <div className="w-12 h-16 bg-muted flex items-center justify-center rounded-md shadow-sm border border-border/50">
                  <span className="material-symbols-outlined text-muted-foreground/50">movie</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground group-hover:text-primary transition-colors truncate text-[1.1rem] leading-tight">{m.title}</div>
                <div className="text-xs font-bold text-muted-foreground mt-1 truncate">
                  <span className="inline-flex bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider mr-2">{m.releaseDate || 'N/A'}</span>
                  {m.director || 'Unknown Director'}
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" className="hidden sm:flex rounded-lg px-4 font-bold text-primary bg-primary/10 hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-all select-none pointer-events-none">Import</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  const [open, setOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema) as any,
    defaultValues: { title: '', description: '', duration: 0, releaseDate: '', tagIds: [], director: '', posterUrl: '', basePrice: 0, rating: 0 },
  });

  const suggestedMovieId = (movies.reduce((max, movie) => Math.max(max, movie.id), 0) || 0) + 1;

  const buildDefaultPosterUrl = (movieId: number | string) => `http://localhost:9000/posters/movie_${movieId}.jpg`;

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const [moviesRes, tagsRes] = await Promise.all([getMovies(), getTags()]);
      setMovies(moviesRes.data);
      setTags(tagsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch movies or tags');
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
        await updateMovie(editingMovie.id, values as any, posterFile);
      } else {
        await createMovie(values as any, posterFile);
      }

      toast({
        title: editingMovie ? 'Movie updated successfully' : 'Movie created successfully',
        description: values.title,
        variant: 'success',
      });

      setOpen(false);
      form.reset();
      setEditingMovie(null);
      fetchMovies();
    } catch (err) {
      console.error('Save failed', err);
      toast({
        title: 'Failed to save movie',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const movieFormSections: ModernFormSection[] = [
    {
      title: "Core Metadata",
      fields: [
        {
          name: "imdbSearch",
          label: "IMDb Importer",
          type: "custom",
          colSpan: 2,
          render: (f) => <ImdbSearchField form={f} tags={tags} />
        },
        {
          name: "movieIdPreview",
          label: "Movie ID",
          type: "custom",
          colSpan: 2,
          render: () => (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80">Movie ID</div>
              <div className="mt-1 text-lg font-black text-foreground">
                {editingMovie ? `#${editingMovie.id}` : `#${suggestedMovieId}`}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {editingMovie
                  ? 'This title keeps its existing database ID.'
                  : 'Estimated next movie ID for poster naming and MinIO uploads.'}
              </div>
            </div>
          )
        },
        { name: "title", label: "Movie Title", type: "text", required: true, placeholder: "e.g. Inception", icon: <span className="material-symbols-outlined text-[1rem]">title</span>, colSpan: 2 },
        { 
          name: "tagIds", 
          label: "Genres / Tags", 
          type: "custom", 
          colSpan: 2, 
          render: (f) => (
            <div className="space-y-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal text-left h-12 bg-background/50 border-input hover:bg-muted/50 rounded-xl">
                    <span className="flex items-center gap-2 truncate">
                      {f.getValues('tagIds')?.length > 0 ? (
                        <span className="text-foreground font-bold">
                          {tags.filter(t => (f.getValues('tagIds') || []).includes(t.id)).map(t => t.genre).join(', ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium">Select multiple genres...</span>
                      )}
                    </span>
                    <span className="material-symbols-outlined text-[1.2rem] opacity-50">arrow_drop_down</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto z-[100] rounded-xl border-border bg-card shadow-2xl p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground opacity-70">Predefined Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50 my-1.5" />
                  {tags.map(t => {
                    const val = f.getValues('tagIds') || [];
                    const checked = val.includes(t.id);
                    return (
                      <DropdownMenuCheckboxItem
                        key={t.id}
                        checked={checked}
                        onSelect={(e) => e.preventDefault()} // Keeps dropdown open after selection
                        onCheckedChange={(c) => {
                          if (c) f.setValue('tagIds', [...val, t.id]);
                          else f.setValue('tagIds', val.filter((id: number) => id !== t.id));
                        }}
                        className="font-bold text-foreground py-2 cursor-pointer rounded-lg hover:bg-muted focus:bg-muted text-sm"
                      >
                        {t.genre}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {(!f.getValues('tagIds') || f.getValues('tagIds').length === 0) && (
                <div className="text-xs text-destructive font-bold inline-flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">warning</span> At least one tag is required.</div>
              )}
            </div>
          )
        },
        { name: "director", label: "Director", type: "text", placeholder: "e.g. Greta Gerwig", icon: <span className="material-symbols-outlined text-[1rem]">theater_comedy</span>, colSpan: 2 },
        { name: "basePrice", label: "Base Ticket Price", type: "number", required: true, placeholder: "e.g. 15.00", icon: <span className="material-symbols-outlined text-[1rem]">payments</span> },
        { name: "rating", label: "Atlas Critics Score", type: "rating", required: true },
        { name: "duration", label: "Screening Time", type: "duration", required: true },
        { name: "releaseDate", label: "Premiere Date", type: "date", required: true },
      ]
    },
    {
      title: "Media & Synopsis",
      fields: [
        {
          name: "poster",
          label: "Official Poster",
          type: "image",
          placeholder: "Upload film poster",
          description: "Uploading a poster is preferred. The backend now stores the MinIO object key automatically.",
          allowManualUrl: false
        },
        {
          name: "posterUrl",
          label: "Poster URL",
          type: "text",
          placeholder: buildDefaultPosterUrl(editingMovie?.id ?? suggestedMovieId),
          description: "Optional fallback. Use the common pattern and change only the movie id if needed.",
          icon: <span className="material-symbols-outlined text-[1rem]">link</span>,
          colSpan: 2
        },
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
      tagIds: movie.tags?.map(t => t.id) || [],
      director: movie.director || '',
      posterUrl: movie.posterUrl || buildDefaultPosterUrl(movie.id),
      basePrice: movie.basePrice || 0,
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

  const filteredMovies = movies.filter(m => {
    const searchString = search.toLowerCase();
    const matchesTitle = m.title.toLowerCase().includes(searchString);
    const matchesTags = m.tags?.some(t => t.genre.toLowerCase().includes(searchString));
    return matchesTitle || matchesTags;
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingMovie(null);
      form.reset({
        title: '',
        description: '',
        duration: 0,
        releaseDate: '',
        tagIds: [],
        director: '',
        posterUrl: buildDefaultPosterUrl(suggestedMovieId),
        basePrice: 0,
        rating: 0,
      });
    } else if (!editingMovie) {
      form.reset({
        title: '',
        description: '',
        duration: 0,
        releaseDate: '',
        tagIds: [],
        director: '',
        posterUrl: buildDefaultPosterUrl(suggestedMovieId),
        basePrice: 0,
        rating: 0,
      });
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
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-[0_6px_20px_rgba(93,93,255,0.23)] hover:-translate-y-0.5 transition duration-200 font-bold shrink-0">
                <span className="material-symbols-outlined mr-2">add</span> Register Movie
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-none shadow-2xl rounded-[3rem] max-h-[90vh] flex flex-col">
              <div className="px-12 py-10 border-b border-border/40 shrink-0 relative overflow-hidden backdrop-blur-3xl bg-background/50">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
                <DialogHeader className="relative z-10 text-left">
                  <DialogTitle className="text-4xl font-headline font-black tracking-tight text-foreground">
                    {editingMovie ? 'Edit Feature' : 'Register New Film'}
                  </DialogTitle>
                  <DialogDescription className="text-lg mt-3 text-muted-foreground font-medium">
                    {editingMovie ? 'Update metadata for this official selection.' : 'Add a new title to the cinema database.'}
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <ModernForm
                  schema={movieSchema}
                  defaultValues={form.getValues()}
                  form={form}
                  onSubmit={onSubmit as any}
                  sections={movieFormSections}
                  isSubmitting={saving}
                  submitLabel={editingMovie ? 'Save Metadata' : 'Launch Feature'}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
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
                  <TableRow key={movie.id} className="group transition-colors border-b-border">
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
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {movie.tags?.slice(0, 3).map(t => (
                              <div key={t.id} className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-muted inline-flex px-1.5 py-0.5 rounded">
                                {t.genre}
                              </div>
                            ))}
                            {movie.tags && movie.tags.length > 3 && (
                               <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-muted inline-flex px-1.5 py-0.5 rounded">+{movie.tags.length - 3}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center text-xs font-bold text-muted-foreground">
                          <span className="material-symbols-outlined text-[1rem] mr-1.5 opacity-60">schedule</span> {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                        </div>
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
