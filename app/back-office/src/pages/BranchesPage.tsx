import { useEffect, useState } from 'react';
import type { Branch } from '@/types';
import { getBranches, createBranch, updateBranch, deleteBranch } from '@/api/branches';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const branchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.string().min(1, 'Phone is required'),
  isActive: z.boolean().default(true),
});

type BranchFormValues = z.infer<typeof branchSchema>;

const cities = [
  'Addis Ababa', 'Debre Zeyit', 'Adama', 'Bahir Dar', 'Gondar', 'Hawassa', 'Mekele', 'Dire Dawa'
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema) as any,
    defaultValues: { name: '', city: 'Addis Ababa', address: '', phoneNumber: '', isActive: true },
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await getBranches();
      setBranches(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch branches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const onSubmit = async (values: BranchFormValues) => {
    try {
      setSaving(true);
      if (editingBranch) {
        await updateBranch(editingBranch.id, values);
        toast({
          title: 'Branch updated successfully',
          description: values.name,
          variant: 'success',
        });
      } else {
        await createBranch(values);
        toast({
          title: 'Branch created successfully',
          description: values.name,
          variant: 'success',
        });
      }
      setOpen(false);
      form.reset();
      setEditingBranch(null);
      fetchBranches();
    } catch (err) {
      console.error('Save failed', err);
      toast({
        title: 'Failed to save branch',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const branchFormSections: ModernFormSection[] = [
    {
      title: "Identity",
      fields: [
        { name: "name", label: "Branch Name", type: "text", required: true, placeholder: "e.g. Atlas Century", colSpan: 2 },
        { 
          name: "city", label: "Operational City", type: "select", required: true, 
          options: cities.map(city => ({ label: city, value: city }))
        },
        { name: "isActive", label: "Operational", type: "switch", description: "Allow customers to book tickets at this branch.", colSpan: 2 },
      ]
    },
    {
      title: "Contact & Location",
      fields: [
        { name: "address", label: "Full Address", type: "textarea", placeholder: "Exact building or mall location..." },
        { name: "phoneNumber", label: "Service Phone", type: "text", required: true, placeholder: "+251...", icon: <span className="material-symbols-outlined text-[1rem]">call</span> },
      ]
    }
  ];

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.reset({
      name: branch.name,
      city: branch.city || 'Addis Ababa',
      address: branch.address,
      phoneNumber: branch.phoneNumber || '',
      isActive: branch.isActive ?? true,
    });
    setOpen(true);
  };

  const handleToggleActive = async (branch: Branch, checked: boolean) => {
    setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, isActive: checked } : b));
    try {
      const { id, ...branchData } = branch;
      await updateBranch(id, { ...branchData, isActive: checked });
    } catch (err) {
      console.error('Toggle failed', err);
      setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, isActive: !checked } : b));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      try {
        await deleteBranch(id);
        fetchBranches();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    (b.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingBranch(null);
      form.reset();
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card rounded-[2rem] p-8 md:p-10 border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex rounded-lg bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 mb-4">
             Infrastructure
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-foreground">Branches</h1>
          <p className="text-muted-foreground font-medium mt-2">Manage physical cinema locations and their network status.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[1.2rem] text-muted-foreground">search</span>
            <Input 
              placeholder="Search branches..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-background border-border h-14 rounded-2xl w-full shadow-lg font-bold placeholder:text-muted-foreground"
            />
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-[0_6px_20px_rgba(93,93,255,0.23)] hover:-translate-y-0.5 transition duration-200 font-bold shrink-0">
                <span className="material-symbols-outlined mr-2">add</span> Open Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-none shadow-2xl rounded-[3rem] max-h-[90vh] flex flex-col">
              <div className="px-12 py-10 border-b border-border/40 shrink-0 relative overflow-hidden backdrop-blur-3xl bg-background/50">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
                <DialogHeader className="relative z-10 text-left">
                  <DialogTitle className="text-4xl font-headline font-black tracking-tight text-foreground">
                    {editingBranch ? 'Update Location' : 'Onboard New Branch'}
                  </DialogTitle>
                  <DialogDescription className="text-lg mt-3 text-muted-foreground font-medium">
                    {editingBranch ? 'Change details for this branch location.' : 'Initialize a new operational cinema node.'}
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <ModernForm
                  schema={branchSchema}
                  defaultValues={form.getValues()}
                  onSubmit={onSubmit as any}
                  sections={branchFormSections}
                  isSubmitting={saving}
                  submitLabel={editingBranch ? 'Sync Changes' : 'Initialize Node'}
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
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mr-3">progress_activity</span> Mapping locations...
        </div>
      ) : (
        <div className="rounded-[1.5rem] bg-card overflow-hidden shadow-2xl border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b-border">
                <TableHead className="w-16 font-bold text-muted-foreground">ID</TableHead>
                <TableHead className="font-bold text-muted-foreground">Location Identity</TableHead>
                <TableHead className="font-bold text-muted-foreground">Address</TableHead>
                <TableHead className="font-bold text-muted-foreground">Contacts</TableHead>
                <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                <TableHead className="w-24 text-right font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-muted-foreground border-none">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
                      <span className="font-bold text-lg">No cinema branches have been registered.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBranches.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((branch) => (
                  <TableRow key={branch.id} className="group transition-colors border-b-border">
                    <TableCell className="font-bold text-muted-foreground/70">#{branch.id}</TableCell>
                    <TableCell>
                      <div className="font-headline font-black text-foreground text-lg leading-tight flex items-center gap-2">
                        {branch.name}
                        {branch.city && (
                           <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 bg-primary/10 text-primary font-black uppercase tracking-widest">{branch.city}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start text-xs text-muted-foreground max-w-[200px] font-medium">
                        <span className="material-symbols-outlined text-[1rem] mr-2 opacity-60 shrink-0">pin_drop</span>
                        <span className="leading-tight">{branch.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       {branch.phoneNumber && (
                         <div className="flex items-center text-xs font-bold text-foreground">
                           <span className="material-symbols-outlined text-[1rem] mr-2 opacity-60">call</span> {branch.phoneNumber}
                         </div>
                       )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={branch.isActive} 
                          onCheckedChange={(checked) => handleToggleActive(branch, checked)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          branch.isActive ? "text-emerald-400" : "text-muted-foreground/60"
                        )}>
                          {branch.isActive ? "Online" : "Paused"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)} className="h-10 w-10 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="h-10 w-10 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl shadow-sm">
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
              Showing <span className="text-foreground">{Math.min(filteredBranches.length, (page * itemsPerPage) + (filteredBranches.length > 0 ? 1 : 0))}</span> - <span className="text-foreground">{Math.min(filteredBranches.length, (page + 1) * itemsPerPage)}</span> of <span className="text-foreground">{filteredBranches.length}</span> locations
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border bg-card hover:bg-muted h-10 px-4 rounded-xl shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredBranches.length} onClick={() => setPage(p => p + 1)} className="border-border bg-card hover:bg-muted h-10 px-4 rounded-xl shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}