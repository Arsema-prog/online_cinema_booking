import { useEffect, useState } from 'react';
import { 
  Trash2, 
  Plus, 
  Search, 
  Loader2, 
  Phone, 
  Map as MapIcon, 
  Pencil, 
  Building2 
} from 'lucide-react';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';
import { cn } from '@/lib/utils';

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
      } else {
        await createBranch(values);
      }
      setOpen(false);
      form.reset();
      setEditingBranch(null);
      fetchBranches();
    } catch (err) {
      console.error('Save failed', err);
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
        { name: "phoneNumber", label: "Service Phone", type: "text", required: true, placeholder: "+251...", icon: <Phone className="w-4 h-4" /> },
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
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Branches</h1>
          <p className="text-muted-foreground mt-1 text-base">Manage cinema locations and operational status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search branches..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-10 w-64 shadow-sm"
            />
          </div>
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-md shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Open Branch
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
              <div className="px-8 py-8 border-b border-border shrink-0">
                <SheetHeader>
                  <SheetTitle className="text-3xl font-extrabold tracking-tight">
                    {editingBranch ? 'Update Location' : 'Onboard New Branch'}
                  </SheetTitle>
                  <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                    {editingBranch ? 'Change details for this branch location.' : 'Initialize a new operational cinema node.'}
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <ModernForm
                schema={branchSchema}
                defaultValues={form.getValues()}
                onSubmit={onSubmit as any}
                sections={branchFormSections}
                isSubmitting={saving}
                submitLabel={editingBranch ? 'Sync Changes' : 'Initialize Node'}
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
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Mapping locations...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Location Identity</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Building2 className="h-12 w-12 mb-3 opacity-20" />
                      No cinema branches have been registered.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBranches.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((branch) => (
                  <TableRow key={branch.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{branch.id}</TableCell>
                    <TableCell>
                      <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        {branch.name}
                        {branch.city && (
                           <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/20 text-primary font-bold">{branch.city}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start text-xs text-muted-foreground max-w-[200px]">
                        <MapIcon className="w-3.5 h-3.5 mr-1.5 mt-0.5 opacity-60 shrink-0" />
                        <span className="leading-tight">{branch.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       {branch.phoneNumber && (
                         <div className="flex items-center text-xs font-semibold text-foreground">
                           <Phone className="w-3 h-3 mr-1.5 opacity-60" /> {branch.phoneNumber}
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
                          "text-[10px] font-black uppercase tracking-tighter",
                          branch.isActive ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                          {branch.isActive ? "Online" : "Paused"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)} className="h-8 w-8 text-primary hover:bg-primary/10">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
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
              Showing {Math.min(filteredBranches.length, (page * itemsPerPage) + 1)} - {Math.min(filteredBranches.length, (page + 1) * itemsPerPage)} of {filteredBranches.length} locations
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= filteredBranches.length} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}