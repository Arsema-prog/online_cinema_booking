import { useEffect, useState } from 'react';
import type { Screen, Branch } from '@/types';
import { getScreens, createScreen, updateScreen, deleteScreen } from '@/api/screens';
import { getBranches } from '@/api/branches';
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
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus } from 'lucide-react';

// Schema definition
const screenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  branchId: z.coerce.number().min(1, 'Branch is required'),
  screenNumber: z.coerce.number().min(1, 'Screen number is required'),
  rowsCount: z.coerce.number().min(1, 'Rows count must be at least 1'),
  seatsPerRow: z.coerce.number().min(1, 'Seats per row must be at least 1'),
  isActive: z.boolean().default(true),
});

type ScreenFormValues = z.infer<typeof screenSchema>;

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);

  const form = useForm<ScreenFormValues>({
    resolver: zodResolver(screenSchema) as any,
    defaultValues: { name: '', branchId: 0, rowsCount: 0, seatsPerRow: 0, screenNumber: 0, isActive: true },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [screensRes, branchesRes] = await Promise.all([
        getScreens(),
        getBranches(),
      ]);
      setScreens(screensRes.data);
      setBranches(branchesRes.data);
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

  const onSubmit = async (values: ScreenFormValues) => {
    try {
      const branch = branches.find((b) => b.id === values.branchId);
      if (!branch) throw new Error('Selected branch not found');

      const totalSeats = values.rowsCount * values.seatsPerRow;
      const payload = {
        name: values.name,
        branch,
        screenNumber: values.screenNumber,
        capacity: totalSeats,
        rowsCount: values.rowsCount,
        seatsPerRow: values.seatsPerRow,
        isActive: values.isActive ?? true,
      };

      if (editingScreen) {
        await updateScreen(editingScreen.id, payload);
      } else {
        await createScreen(payload, totalSeats);
      }
      setOpen(false);
      form.reset();
      setEditingScreen(null);
      setSubmitError(null);
      fetchData();
    } catch (err: any) {
      console.error('Save failed', err);
      setSubmitError(err.response?.data?.message || err.message || 'Failed to save screen');
    }
  };

  const handleEdit = (screen: Screen) => {
    setEditingScreen(screen);
    form.reset({
      name: screen.name,
      branchId: screen.branch.id,
      screenNumber: screen.screenNumber || 0,
      rowsCount: screen.rowsCount || 0,
      seatsPerRow: screen.seatsPerRow || 0,
      isActive: screen.isActive ?? true,
    });
    setOpen(true);
  };

  const handleToggleActive = async (screen: Screen, checked: boolean) => {
    setScreens(prev => prev.map(s => s.id === screen.id ? { ...s, isActive: checked } : s));
    try {
      const { id, ...screenData } = screen;
      await updateScreen(id, { ...screenData, isActive: checked });
    } catch (err) {
      console.error('Toggle failed', err);
      setScreens(prev => prev.map(s => s.id === screen.id ? { ...s, isActive: !checked } : s));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this screen? This will also delete associated seats and screenings.')) {
      try {
        await deleteScreen(id);
        fetchData();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setEditingScreen(null);
      form.reset();
      setSubmitError(null);
    }
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Screens</h1>
          <p className="text-muted-foreground mt-1">Manage physical screening rooms and their capacities.</p>
        </div>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-md shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Screen
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
            <div className="px-8 py-8 border-b border-border shrink-0">
              <SheetHeader>
                <SheetTitle className="text-3xl font-extrabold tracking-tight">{editingScreen ? 'Edit Screen' : 'Create Screen'}</SheetTitle>
                <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                  {editingScreen
                    ? 'Update the screen details below.'
                    : 'Fill in the details to add a new screen. Seats will be generated automatically.'}
                </SheetDescription>
              </SheetHeader>
            </div>
            {submitError && (
              <div className="bg-destructive/15 text-destructive text-sm p-4 mx-8 mt-6 mb-2 rounded-md border border-destructive/20">
                {submitError}
              </div>
            )}
            <Form {...form}>
              <form id="screen-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-8 space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Screen Details
                    </h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Screen Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. IMAX, Screen 1" className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Branch</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value ? String(field.value) : ''}
                            >
                              <FormControl>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                {branches.map((branch) => (
                                  <SelectItem key={branch.id} value={String(branch.id)}>
                                    {branch.name}
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
                        name="screenNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Screen Number</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 1"
                                className={inputClass}
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const val = e.target.valueAsNumber;
                                  field.onChange(isNaN(val) ? '' : val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-border/30 shrink-0" />

                  <div className="space-y-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                      Capacity Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="rowsCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Rows</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 10"
                                className={inputClass}
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const val = e.target.valueAsNumber;
                                  field.onChange(isNaN(val) ? '' : val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="seatsPerRow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">*: Seats per Row</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 15"
                                className={inputClass}
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const val = e.target.valueAsNumber;
                                  field.onChange(isNaN(val) ? '' : val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {editingScreen && (
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
                                <p className="text-muted-foreground w-[250px]">Allow screenings in this room.</p>
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
              <Button type="submit" form="screen-form" size="lg" className="rounded-md shadow-sm px-8">
                {editingScreen ? 'Update Screen' : 'Create Screen'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {error && <div className="text-destructive mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Seats/Row</TableHead>
              <TableHead>Is Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {screens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No screens found.
                </TableCell>
              </TableRow>
            ) : (
              screens.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((screen) => (
                <TableRow key={screen.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-muted-foreground">{screen.id}</TableCell>
                  <TableCell className="font-semibold text-foreground">{screen.name}</TableCell>
                  <TableCell>{screen.branch.name}</TableCell>
                  <TableCell>{screen.screenNumber || '-'}</TableCell>
                  <TableCell>{screen.capacity || '-'}</TableCell>
                  <TableCell>{screen.rowsCount || '-'}</TableCell>
                  <TableCell>{screen.seatsPerRow || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Switch 
                         checked={screen.isActive && (screen.branch.isActive !== false)} 
                         disabled={screen.branch.isActive === false}
                         onCheckedChange={(checked) => handleToggleActive(screen, checked)} 
                       />
                       {screen.branch.isActive === false && (
                         <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">Branch Inactive</span>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(screen)} className="h-8 w-8 text-primary hover:bg-primary/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(screen.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
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
              Showing {Math.min(screens.length, (page * itemsPerPage) + 1)} - {Math.min(screens.length, (page + 1) * itemsPerPage)} of {screens.length} screens
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= screens.length} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}