import { useEffect, useState, useRef } from 'react';
import type { Movie } from '../types';
import { getMovies, createMovie, updateMovie, deleteMovie, uploadImage } from '@/api/movies';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Plus, Star, Calendar, Clock, UploadCloud, ImageIcon, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MOVIE_GENRES = ["Action", "Adventure", "Animation", "Comedy", "Documentary", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller"];

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  genre: z.string().min(1, 'Genre is required'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  description: z.string().min(1, 'Description is required'),
  director: z.string().min(1, 'Director is required'),
  releaseDate: z.string().min(1, 'Release Date is required'),
  rating: z.coerce.number().min(0, 'Rating is required').max(10),
  posterUrl: z.string().min(1, 'Poster URL is required'),
  basePrice: z.coerce.number().min(0, 'Base price must be positive'),
  isActive: z.boolean().default(true),
});

type MovieFormValues = z.infer<typeof movieSchema>;

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema) as any,
    defaultValues: { title: '', genre: '', duration: 0, description: '', director: '', releaseDate: '', rating: undefined as any, posterUrl: '', basePrice: undefined as any, isActive: true },
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
      setUploading(true);
      let finalPosterUrl = values.posterUrl;
      
      if (posterFile) {
        const response = await uploadImage(posterFile);
        finalPosterUrl = response.data.url;
      }

      const payload = { ...values, posterUrl: finalPosterUrl };

      if (editingMovie) {
        await updateMovie(editingMovie.id, payload);
      } else {
        await createMovie(payload);
      }
      setOpen(false);
      form.reset();
      setEditingMovie(null);
      setPosterFile(null);
      fetchMovies();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    form.reset({ 
      title: movie.title, 
      genre: movie.genre, 
      duration: movie.duration,
      description: movie.description || '',
      director: movie.director || '',
      releaseDate: movie.releaseDate || '',
      rating: movie.rating ?? (undefined as any),
      posterUrl: movie.posterUrl || '',
      basePrice: movie.basePrice ?? (undefined as any),
      isActive: movie.isActive ?? true,
    });
    setOpen(true);
  };

  const handleToggleActive = async (movie: Movie, checked: boolean) => {
    setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, isActive: checked } : m));
    try {
      const { id, ...movieData } = movie;
      await updateMovie(id, { ...movieData, isActive: checked });
    } catch (err) {
      console.error('Toggle failed', err);
      setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, isActive: !checked } : m));
    }
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

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setEditingMovie(null);
      setPosterFile(null);
      form.reset();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPosterFile(e.dataTransfer.files[0]);
      form.setValue('posterUrl', ''); 
    }
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Movies</h1>
          <p className="text-muted-foreground mt-1">Manage your cinema's movie catalog and metadata.</p>
        </div>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-md shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> Add Movie
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-2xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
            <div className="px-8 py-8 border-b border-border shrink-0">
              <SheetHeader>
                <SheetTitle className="text-3xl font-extrabold tracking-tight">
                  {editingMovie ? 'Edit Movie' : 'Create New Movie'}
                </SheetTitle>
                <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                  {editingMovie ? 'Update the details for this movie below.' : 'Enter the details to list a new movie in the catalog.'}
                </SheetDescription>
              </SheetHeader>
            </div>
            
            <Form {...form}>
              <form id="movie-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-8 space-y-10">
                  
                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Basic Information
                    </h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Inception" className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="genre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Genre</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Select a genre" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {MOVIE_GENRES.map(g => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => {
                            const totalMins = field.value || 0;
                            const hours = Math.floor(totalMins / 60);
                            const minutes = totalMins % 60;
                            return (
                              <FormItem>
                                <FormLabel className="text-foreground/80 font-medium">*: Duration</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1 group">
                                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                      <Input 
                                        type="number" min="0" placeholder="Hrs" 
                                        className={`${inputClass} pl-9`}
                                        value={hours || ''} 
                                        onChange={(e) => {
                                          let h = parseInt(e.target.value);
                                          if (isNaN(h)) h = 0;
                                          field.onChange(h * 60 + minutes);
                                        }} 
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">h</span>
                                    <div className="relative flex-1">
                                      <Input 
                                        type="number" min="0" max="59" placeholder="Min"
                                        className={inputClass}
                                        value={minutes || ''} 
                                        onChange={(e) => {
                                          let m = parseInt(e.target.value);
                                          if (isNaN(m)) m = 0;
                                          field.onChange(hours * 60 + m);
                                        }} 
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">m</span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Movie plot summary..." className={`${inputClass} min-h-[100px] resize-none`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="director"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Director</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Christopher Nolan" className={inputClass} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="releaseDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Release Date</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none group-focus-within:text-primary transition-colors" />
                                  <Input type="date" className={`${inputClass} pl-9`} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-border/30 shrink-0" />

                  {/* Media & Pricing Section */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Media & Pricing
                    </h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="posterUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Cover Poster</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-4">
                                <div 
                                  onDragOver={handleDragOver}
                                  onDrop={handleDrop}
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`
                                    relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-8 
                                    flex flex-col items-center justify-center text-center transition-all duration-300
                                    ${(field.value || posterFile) ? 'border-primary/30 bg-primary/5' : 'border-border/60 hover:border-primary/50 bg-muted/40 hover:bg-muted/60'}
                                  `}
                                >
                                  {!(field.value || posterFile) && (
                                    <>
                                      <div className="p-4 rounded-full bg-background shadow-sm text-muted-foreground mb-4 group-hover:scale-110 group-hover:text-primary transition-all">
                                        <UploadCloud className="w-6 h-6" />
                                      </div>
                                      <h3 className="font-semibold text-sm mb-1">Click or drag image here</h3>
                                      <p className="text-xs text-muted-foreground">High-res JPEG, PNG, or WebP</p>
                                    </>
                                  )}
                                  
                                  {(field.value || posterFile) && (
                                    <div className="flex flex-col items-center gap-4">
                                      <img
                                        src={posterFile ? URL.createObjectURL(posterFile) : field.value}
                                        alt="Poster Preview"
                                        className="h-44 object-contain rounded-xl shadow-sm"
                                      />
                                      <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
                                        <ImageIcon className="w-3.5 h-3.5" /> Replace Upload
                                      </div>
                                    </div>
                                  )}
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        setPosterFile(e.target.files[0]);
                                        if (field.value) field.onChange('');
                                      }
                                    }}
                                  />
                                </div>
                                <div className="relative">
                                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">URL</span>
                                   </div>
                                   <Input
                                     placeholder="https://..."
                                     {...field}
                                     className={`${inputClass} pl-12 text-sm text-foreground placeholder:text-muted-foreground/50`}
                                     onChange={(e) => {
                                       field.onChange(e.target.value);
                                       if (e.target.value) setPosterFile(null);
                                     }}
                                   />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                              <FormLabel className="text-foreground/80 font-medium mb-3">*: Rating (0.0 - 10.0)</FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                      <button
                                        type="button"
                                        key={star}
                                        onClick={() => field.onChange(star)}
                                        className={`transition-all duration-300 focus:outline-none ${
                                          (field.value || 0) >= star 
                                            ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] scale-110' 
                                            : 'text-muted-foreground/20 hover:text-yellow-400/50 hover:scale-110'
                                        }`}
                                      >
                                        <Star className="h-5 w-5 fill-current" />
                                      </button>
                                    ))}
                                  </div>
                                  <Input
                                    type="number" step="0.1" min="0" max="10" placeholder="0.0"
                                    className={`${inputClass} w-24 font-bold text-lg text-center`}
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      let val = e.target.value;
                                      field.onChange(val === '' ? undefined : Number(val));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="basePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Base Price ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number" step="0.01" placeholder="0.00"
                                  className={`${inputClass} font-bold text-lg h-12`}
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? undefined : Number(val));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Section */}
                  {editingMovie && (
                    <>
                      <div className="h-[1px] w-full bg-border/30 shrink-0" />
                      <div className="space-y-6">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                          Visibility
                        </h3>
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-1 text-sm">
                                <FormLabel className="font-semibold text-foreground">*: Listed Publicly</FormLabel>
                                <p className="text-muted-foreground">Toggle booking availability in the front-end catalog.</p>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-500" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                  
                </div>
              </form>
            </Form>
            
            <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0 z-10">
               <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-md px-6">Cancel</Button>
               <Button type="submit" form="movie-form" size="lg" className="rounded-md shadow-sm px-8" disabled={uploading}>
                 {uploading ? (
                   <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</>
                 ) : editingMovie ? 'Update Movie' : 'Create Movie'}
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
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Loading movies...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-20">Poster</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="h-12 w-12 mb-3 opacity-20" />
                      No movies found in the catalog.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                movies.map((movie) => (
                  <TableRow key={movie.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{movie.id}</TableCell>
                    <TableCell>
                      {movie.posterUrl ? (
                        <div className="relative w-12 h-16 rounded-md overflow-hidden shadow-sm border border-border/50 group-hover:shadow-md transition-shadow">
                          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-16 bg-muted flex items-center justify-center rounded-md border border-border/50 text-muted-foreground">
                          <ImageIcon className="h-5 w-5 opacity-30" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{movie.title}</div>
                      <div className="text-xs text-muted-foreground">{movie.director}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {movie.genre}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 opacity-70" />
                        {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-yellow-500 font-medium">
                        <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                        {movie.rating?.toFixed(1) || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {movie.basePrice ? `$${movie.basePrice.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={movie.isActive} 
                        onCheckedChange={(checked) => handleToggleActive(movie, checked)} 
                        className="data-[state=checked]:bg-emerald-500"
                      />
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
        </div>
      )}
    </div>
  );
}