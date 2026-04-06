import { useEffect, useState } from 'react';
import type { Snack } from '../types';
import { getSnacks, createSnack, updateSnack, deleteSnack } from '@/api/snacks';
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
import { 
  Package, 
  Trash2, 
  Plus, 
  Search, 
  Loader2, 
  Edit3, 
  Utensils 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';

const snackSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['SNACK', 'DRINK', 'COMBO', 'POPCORN', 'CANDY']),
  price: z.coerce.number().min(0, 'Price must be positive'),
  stockQuantity: z.coerce.number().min(0, 'Stock must be positive'),
  description: z.string().optional(),
  available: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

type SnackFormValues = z.infer<typeof snackSchema>;

export default function SnacksPage() {
  const { hasRole } = useAuth();
  const isManager = hasRole('ADMIN') || hasRole('MANAGER') || hasRole('STAFF');

  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  // Sheet State
  const [open, setOpen] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<SnackFormValues>({
    resolver: zodResolver(snackSchema) as any,
    defaultValues: { name: '', category: 'SNACK', price: 0, stockQuantity: 0, description: '', available: true, imageUrl: '' },
  });

  const snackFormSections: ModernFormSection[] = [
    {
      title: "Essential Information",
      fields: [
        { name: "name", label: "Product Name", type: "text", required: true, placeholder: "e.g. Large Salted Popcorn", colSpan: 2 },
        { 
          name: "category", label: "Category", type: "select", required: true, 
          options: [
            { label: 'Popcorn', value: 'POPCORN' },
            { label: 'Drink', value: 'DRINK' },
            { label: 'Candy', value: 'CANDY' },
            { label: 'Combo', value: 'COMBO' },
            { label: 'Other Snack', value: 'SNACK' },
          ]
        },
        { name: "price", label: "Price ($)", type: "number", required: true, icon: <Utensils className="w-4 h-4" /> },
        { name: "stockQuantity", label: "Available Stock", type: "number", required: true },
        { name: "available", label: "Active in Menu", type: "switch", description: "Visible to customers for ordering.", colSpan: 2 },
      ]
    },
    {
      title: "Media & Details",
      fields: [
        { name: "imageUrl", label: "Product Imagery", type: "image", placeholder: "Upload product photo" },
        { name: "description", label: "Marketing Description", type: "textarea", placeholder: "Describe the snack flavor, size, etc." },
      ]
    }
  ];

  const fetchSnacks = async () => {
    try {
      setLoading(true);
      const response = await getSnacks();
      setSnacks(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch snacks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnacks();
  }, []);

  const onSubmit = async (values: SnackFormValues) => {
    try {
      setSaving(true);
      if (editingSnack) {
        await updateSnack(editingSnack.id, values);
      } else {
        await createSnack(values);
      }
      setOpen(false);
      form.reset();
      setEditingSnack(null);
      fetchSnacks();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (snack: Snack) => {
    setEditingSnack(snack);
    form.reset({
      name: snack.name,
      category: snack.category,
      price: snack.price,
      stockQuantity: snack.stockQuantity,
      description: snack.description || '',
      available: snack.available ?? true,
      imageUrl: snack.imageUrl || '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteSnack(id);
        fetchSnacks();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const filteredSnacks = snacks.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingSnack(null);
      form.reset();
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Concessions</h1>
          <p className="text-muted-foreground mt-1">Manage food, beverages, and combo deals.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search snacks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-10 w-64 shadow-sm focus:ring-1 focus:ring-primary"
            />
          </div>
          {isManager && (
            <Sheet open={open} onOpenChange={handleOpenChange}>
              <SheetTrigger asChild>
                <Button size="lg" className="rounded-md shadow-sm">
                  <Plus className="mr-2 h-5 w-5" /> Add New Item
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
                <div className="px-8 py-8 border-b border-border shrink-0">
                  <SheetHeader>
                    <SheetTitle className="text-3xl font-extrabold tracking-tight">
                      {editingSnack ? 'Edit Item' : 'New Concession'}
                    </SheetTitle>
                    <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                      {editingSnack ? 'Change details for this snack or drink.' : 'Add a new product to your cinema menu.'}
                    </SheetDescription>
                  </SheetHeader>
                </div>
                
                <ModernForm
                  schema={snackSchema}
                  defaultValues={form.getValues()}
                  onSubmit={onSubmit as any}
                  sections={snackFormSections}
                  isSubmitting={saving}
                  submitLabel={editingSnack ? 'Update Item' : 'Add to Menu'}
                  onCancel={() => setOpen(false)}
                  className="flex-1 overflow-hidden"
                />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground font-medium italic">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Synchronizing inventory...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Product Detail</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSnacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 mb-3 opacity-20" />
                      No concession items found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSnacks.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((snack) => (
                  <TableRow key={snack.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{snack.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {snack.imageUrl ? (
                          <img src={snack.imageUrl} className="h-10 w-10 rounded-md object-cover border border-border" alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                            <Utensils className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-foreground leading-tight">{snack.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{snack.category}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md border-border/50 text-muted-foreground/80 font-semibold px-2 py-0.5 uppercase text-[10px]">
                        {snack.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">${snack.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          snack.stockQuantity > 20 ? "bg-emerald-500" : snack.stockQuantity > 0 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-destructive"
                        )} />
                        <span className="font-medium">{snack.stockQuantity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={snack.available ? "default" : "secondary"} className={snack.available ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold" : "px-2 py-0.5 text-[10px] font-bold"}>
                        {snack.available ? 'AVAILABLE' : 'HIDDEN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isManager && (
                        <div className="flex justify-end gap-1 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(snack)} className="h-8 w-8 text-primary hover:bg-primary/10">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(snack.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <div>
              Showing {Math.min(filteredSnacks.length, (page * itemsPerPage) + 1)} - {Math.min(filteredSnacks.length, (page + 1) * itemsPerPage)} of {filteredSnacks.length} items
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredSnacks.length} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
