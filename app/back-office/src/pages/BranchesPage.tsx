import { useEffect, useState } from 'react';
import type { Branch } from '../types';
import { getBranches, updateBranch, deleteBranch } from '@/api/branches';
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
import { Pencil, Trash2, Plus, MapPin, Building2, MonitorPlay, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BranchScreensWizard from '@/components/BranchScreensWizard';

type CityMapping = Record<string, string[]>;
const COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "France", "Japan"];
const CITIES: CityMapping = {
  "USA": ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
  "UK": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Sapporo"]
};

// Form Schema
const branchFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  totalScreens: z.coerce.number().min(1, 'At least 1 screen is required for a new branch'),
  isActive: z.boolean(),
});
type BranchFormValues = z.infer<typeof branchFormSchema>;

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;

  // Sheet State
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Wizard State
  const [screensWizardOpen, setScreensWizardOpen] = useState(false);
  const [pendingBranchData, setPendingBranchData] = useState<BranchFormValues | null>(null);
  const [pendingScreensCount, setPendingScreensCount] = useState<number>(0);

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema) as any,
    defaultValues: { name: '', country: '', city: '', address: '', totalScreens: 1, isActive: true },
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
    if (editingBranch) {
      // Direct update flow (screens stay untouched)
      try {
        const payload = { ...values };
        await updateBranch(editingBranch.id, payload);
        setOpen(false);
        form.reset();
        setEditingBranch(null);
        fetchBranches();
      } catch (err) {
        console.error('Update failed', err);
      }
    } else {
      // Creation flow: Pass to Wizard
      setPendingScreensCount(values.totalScreens);
      setPendingBranchData(values);
      setOpen(false); // Close first sheet
      setScreensWizardOpen(true); // Open wizard
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.reset({ 
      name: branch.name, 
      country: branch.country || '',
      city: branch.city || '',
      address: branch.address || '',
      totalScreens: branch.totalScreens || 1,
      isActive: branch.isActive ?? true 
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingBranch(null);
      form.reset();
    }
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Branches</h1>
          <p className="text-muted-foreground mt-1">Manage physical cinema locations and screens.</p>
        </div>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-md shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> Add Location
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
            <div className="px-8 py-8 border-b border-border shrink-0">
              <SheetHeader>
                <SheetTitle className="text-3xl font-extrabold tracking-tight">
                  {editingBranch ? 'Edit Location' : 'Create Location'}
                </SheetTitle>
                <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                  {editingBranch ? 'Update the details for this branch below.' : 'Add a new location to the cinema network.'}
                </SheetDescription>
              </SheetHeader>
            </div>
            
            <Form {...form}>
              <form id="branch-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-8 space-y-10">
                  
                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Branch Information
                    </h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Downtown Cinema" className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalScreens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Initial Screens Allocation</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <MonitorPlay className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                  type="number" 
                                  min="1"
                                  className={`${inputClass} pl-10`} 
                                  {...field} 
                                  value={field.value || ''} 
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                                />
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground/70">You will configure capacities in the next step.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-border/30 shrink-0" />

                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Geography
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">*: Country</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  form.setValue('city', '');
                                }}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Select Country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {COUNTRIES.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => {
                            const selectedCountry = form.watch('country');
                            const availableCities = selectedCountry && CITIES[selectedCountry] ? CITIES[selectedCountry] : [];
                            return (
                              <FormItem>
                                <FormLabel className="text-foreground/80 font-medium">*: City</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                  disabled={!selectedCountry || availableCities.length === 0}
                                >
                                  <FormControl>
                                    <SelectTrigger className={inputClass}>
                                      <SelectValue placeholder="Select City" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-xl">
                                    {availableCities.map(city => (
                                      <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Street Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="e.g. 123 Main Street" className={`${inputClass} resize-none`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {editingBranch && (
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
                                <FormLabel className="font-semibold text-foreground">*: Operational Status</FormLabel>
                                <p className="text-muted-foreground w-[250px]">Accept bookings for this branch.</p>
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
              <Button type="button" variant="ghost" className="rounded-md px-6" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" form="branch-form" size="lg" className="rounded-md shadow-sm px-8">
                {editingBranch ? 'Update Location' : 'Next: Setup Screens'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <BranchScreensWizard 
          open={screensWizardOpen}
          pendingBranchData={pendingBranchData}
          numberOfScreens={pendingScreensCount}
          onComplete={() => {
            setScreensWizardOpen(false);
            setPendingBranchData(null);
            fetchBranches();
          }}
          onBack={() => {
            setScreensWizardOpen(false);
            if (pendingBranchData) {
              form.reset(pendingBranchData);
            }
            setOpen(true);
          }}
        />
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Loading locations...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Location Details</TableHead>
                <TableHead>Screens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Building2 className="h-12 w-12 mb-3 opacity-20" />
                      No branches have been added yet.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                branches.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((branch) => (
                  <TableRow key={branch.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{branch.id}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {branch.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 opacity-70" />
                        {branch.city}, {branch.country}
                        {branch.address && <span className="ml-1 text-muted-foreground/60">({branch.address})</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary shadow-sm hover:shadow-md transition-shadow">
                        <MonitorPlay className="w-3 h-3 mr-1" />
                        {branch.totalScreens} Screens
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={branch.isActive} 
                        onCheckedChange={(checked) => handleToggleActive(branch, checked)}
                        className="data-[state=checked]:bg-emerald-500" 
                      />
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
              Showing {Math.min(branches.length, (page * itemsPerPage) + 1)} - {Math.min(branches.length, (page + 1) * itemsPerPage)} of {branches.length} locations
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= branches.length} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}