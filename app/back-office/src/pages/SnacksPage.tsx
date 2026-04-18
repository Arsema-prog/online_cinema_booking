import { useEffect, useState } from 'react';
import type { Snack } from '../types';
import { getSnacks, createSnack, updateSnack, deleteSnack } from '@/api/snacks';
import { Button } from '@/components/ui/button';
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
        { name: "price", label: "Price ($)", type: "number", required: true, icon: <span className="material-symbols-outlined text-[1.1rem]">payments</span> },
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
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface-container-high rounded-[2rem] p-8 md:p-10 border border-surface-container-highest/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex rounded-lg bg-primary-container/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-container border border-primary-container/20 mb-4">
             Inventory Management
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface">Concessions</h1>
          <p className="text-on-surface-variant font-medium mt-2">Manage your high-margin cinema food and beverage offerings.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[1.2rem] text-on-surface-variant">search</span>
            <Input 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-surface-container-lowest border-surface-container-highest/40 h-14 rounded-2xl w-full shadow-lg font-bold placeholder:text-on-surface-variant"
            />
          </div>
          {isManager && (
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-primary-container/20 font-bold shrink-0">
                  <span className="material-symbols-outlined mr-2">add</span> Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-surface-container-lowest/95 backdrop-blur-2xl border-none shadow-2xl rounded-[3rem] max-h-[90vh] flex flex-col">
                <div className="px-12 py-10 border-b border-surface-container-highest/40 shrink-0 relative overflow-hidden backdrop-blur-3xl bg-surface-container-lowest/50">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-primary-container/20 blur-[80px] rounded-full pointer-events-none" />
                  <DialogHeader className="relative z-10 text-left">
                    <DialogTitle className="text-4xl font-headline font-black tracking-tight text-on-surface">
                      {editingSnack ? 'Edit Concession' : 'New Concession'}
                    </DialogTitle>
                    <DialogDescription className="text-lg mt-3 text-on-surface-variant/80 font-medium">
                      {editingSnack ? 'Modify the specifics for this snack or drink item.' : 'Add a new product offering to your cinema menu.'}
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <ModernForm
                    schema={snackSchema}
                    defaultValues={form.getValues()}
                    onSubmit={onSubmit as any}
                    sections={snackFormSections}
                    isSubmitting={saving}
                    submitLabel={editingSnack ? 'Update Item' : 'Add to Menu'}
                    onCancel={() => setOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mb-4">progress_activity</span>
          Synchronizing inventory...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSnacks.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-high rounded-[2rem] border border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-30" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                <p className="font-bold text-lg">No concession items found.</p>
              </div>
            ) : (
               filteredSnacks.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((snack) => (
                 <div key={snack.id} className="bg-surface-container-lowest border border-surface-container-highest/40 rounded-[2rem] p-6 shadow-xl flex flex-col group relative hover:-translate-y-1 transition-all overflow-hidden content-center">
                    <div className="absolute top-6 left-6 z-10 flex gap-2">
                       <span className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-lg shadow-sm border ${snack.available ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30'}`}>
                          {snack.available ? 'Available' : 'Hidden'}
                       </span>
                    </div>

                    <div className="h-44 bg-surface-container-highest rounded-[1.5rem] mb-6 relative overflow-hidden flex items-center justify-center border border-surface-container-highest/50 shadow-inner">
                       {snack.imageUrl ? (
                          <img src={snack.imageUrl} className="w-full h-full object-cover" alt={snack.name} />
                       ) : (
                          <span className="material-symbols-outlined text-[4rem] text-on-surface-variant/20" style={{ fontVariationSettings: "'FILL' 1" }}>fastfood</span>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent pointer-events-none" />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                       <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                             <h3 className="font-headline font-black text-xl text-on-surface line-clamp-1">{snack.name}</h3>
                             <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 bg-surface-container-high inline-block px-2 py-0.5 rounded">{snack.category}</p>
                          </div>
                          <div className="text-xl font-headline font-black text-primary-container shrink-0">${snack.price.toFixed(2)}</div>
                       </div>
                       
                       <p className="text-sm font-medium text-on-surface-variant mt-2 line-clamp-2 max-h-11">
                          {snack.description || "No description provided for this item."}
                       </p>

                       <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-xl border border-surface-container-highest/40">
                             <span className={`w-2 h-2 rounded-full ${snack.stockQuantity > 20 ? "bg-emerald-500" : snack.stockQuantity > 0 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-red-500"}`} />
                             <span className="font-bold text-sm text-on-surface">{snack.stockQuantity} <span className="text-on-surface-variant font-medium text-xs">in stock</span></span>
                          </div>

                          {isManager && (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(snack)} className="h-10 w-10 text-primary-container bg-primary-container/10 hover:bg-primary-container/20 rounded-xl shadow-sm">
                                <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(snack.id)} className="h-10 w-10 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl shadow-sm">
                                <span className="material-symbols-outlined text-[1.2rem]">delete</span>
                              </Button>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               ))
            )}
          </div>
          
          <div className="p-4 bg-surface-container-high rounded-[1.5rem] border border-surface-container-highest/40 flex flex-col sm:flex-row justify-between items-center text-sm text-on-surface-variant font-bold gap-4 shadow-sm">
            <div>
              Showing <span className="text-on-surface">{Math.min(filteredSnacks.length, (page * itemsPerPage) + (filteredSnacks.length > 0 ? 1 : 0))}</span> - <span className="text-on-surface">{Math.min(filteredSnacks.length, (page + 1) * itemsPerPage)}</span> of <span className="text-on-surface">{filteredSnacks.length}</span> items
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-surface-container-highest bg-surface-container-lowest h-10 px-4 rounded-xl shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredSnacks.length} onClick={() => setPage(p => p + 1)} className="border-surface-container-highest bg-surface-container-lowest h-10 px-4 rounded-xl shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
