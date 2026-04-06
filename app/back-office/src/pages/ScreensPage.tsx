import { useEffect, useState } from 'react';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  MonitorPlay, 
  Loader2, 
  Users, 
  Layers, 
  LayoutGrid, 
  Hash,
  MapPin
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { Switch } from '@/components/ui/switch';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';

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
  const [saving, setSaving] = useState(false);
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
      setSaving(true);
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
      fetchData();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const screenFormSections: ModernFormSection[] = [
    {
      title: "Screen Identity",
      fields: [
        { name: "name", label: "Screen Name", type: "text", required: true, placeholder: "e.g. IMAX, Screen 1", colSpan: 2 },
        { 
          name: "branchId", label: "Assigned Branch", type: "select", required: true,
          options: branches.map(b => ({ label: b.name, value: String(b.id) }))
        },
        { name: "screenNumber", label: "Sequence Number", type: "number", required: true, icon: <Hash className="w-4 h-4" /> },
      ]
    },
    {
      title: "Capacity & Layout",
      fields: [
        { name: "rowsCount", label: "Rows", type: "number", required: true, icon: <Layers className="w-4 h-4" /> },
        { name: "seatsPerRow", label: "Seats per Row", type: "number", required: true, icon: <LayoutGrid className="w-4 h-4" /> },
        { 
          name: "isActive", label: "Operational Status", type: "switch", 
          description: "Allow showtimes to be scheduled in this room.", 
          colSpan: 2,
          visible: () => !!editingScreen
        },
      ]
    }
  ];

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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingScreen(null);
      form.reset();
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Screens</h1>
          <p className="text-muted-foreground mt-1">Manage physical screening rooms and their capacities.</p>
        </div>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-md shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> Add Screen Room
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
            <div className="px-8 py-8 border-b border-border shrink-0">
              <SheetHeader>
                <SheetTitle className="text-3xl font-extrabold tracking-tight">
                  {editingScreen ? 'Edit Screen' : 'Create Screen'}
                </SheetTitle>
                <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                  {editingScreen
                    ? 'Update the room configuration below.'
                    : 'Configure a new screening room with automated seat generation.'}
                </SheetDescription>
              </SheetHeader>
            </div>
            
            <ModernForm
              schema={screenSchema}
              defaultValues={form.getValues()}
              onSubmit={onSubmit as any}
              sections={screenFormSections}
              isSubmitting={saving}
              submitLabel={editingScreen ? 'Update Configuration' : 'Generate Room'}
              onCancel={() => setOpen(false)}
              className="flex-1 overflow-hidden"
            />
          </SheetContent>
        </Sheet>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground font-medium">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Calibrating screens...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Room Identity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {screens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <MonitorPlay className="h-12 w-12 mb-3 opacity-20" />
                      No screen rooms have been configured yet.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                screens.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((screen) => (
                  <TableRow key={screen.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{screen.id}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {screen.name}
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">#{screen.screenNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center text-muted-foreground text-sm">
                        <MapPin className="h-3 w-3 mr-1 opacity-70" />
                        {screen.branch.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-semibold text-foreground flex items-center">
                           <Layers className="h-3 w-3 mr-1 opacity-60" /> {screen.rowsCount} Rows
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                           <LayoutGrid className="h-3 w-3 mr-1 opacity-40" /> {screen.seatsPerRow} Seats/Row
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 shadow-sm">
                        <Users className="w-3 h-3 mr-1" />
                        {screen.capacity} Seats
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={screen.isActive && (screen.branch.isActive !== false)} 
                          disabled={screen.branch.isActive === false}
                          onCheckedChange={(checked) => handleToggleActive(screen, checked)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        {screen.branch.isActive === false && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50 font-bold uppercase tracking-tighter">Branch Closed</span>
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