import { useEffect, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
        { name: "screenNumber", label: "Sequence Number", type: "number", required: true, icon: <span className="material-symbols-outlined text-[1rem]">tag</span> },
      ]
    },
    {
      title: "Capacity & Layout",
      fields: [
        { name: "rowsCount", label: "Rows", type: "number", required: true, icon: <span className="material-symbols-outlined text-[1rem]">format_list_bulleted</span> },
        { name: "seatsPerRow", label: "Seats per Row", type: "number", required: true, icon: <span className="material-symbols-outlined text-[1rem]">apps</span> },
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
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface-container-high rounded-[2rem] p-8 md:p-10 border border-surface-container-highest/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex rounded-lg bg-primary-container/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-container border border-primary-container/20 mb-4">
             Infrastructure
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface">Screens</h1>
          <p className="text-on-surface-variant font-medium mt-2">Manage physical screening rooms and their capacities.</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-primary-container/20 font-bold shrink-0 relative z-10">
              <span className="material-symbols-outlined mr-2">add</span> Add Screen Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-surface-container-lowest/95 backdrop-blur-2xl border-none shadow-2xl rounded-[3rem] max-h-[90vh] flex flex-col">
            <div className="px-12 py-10 border-b border-surface-container-highest/40 shrink-0 relative overflow-hidden backdrop-blur-3xl bg-surface-container-lowest/50">
              <div className="absolute right-0 top-0 w-64 h-64 bg-primary-container/20 blur-[80px] rounded-full pointer-events-none" />
              <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-4xl font-headline font-black tracking-tight text-on-surface">
                  {editingScreen ? 'Edit Screen' : 'Create Screen'}
                </DialogTitle>
                <DialogDescription className="text-lg mt-3 text-on-surface-variant/80 font-medium">
                  {editingScreen
                    ? 'Update the room configuration below.'
                    : 'Configure a new screening room with automated seat generation.'}
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ModernForm
                schema={screenSchema}
                defaultValues={form.getValues()}
                onSubmit={onSubmit as any}
                sections={screenFormSections}
                isSubmitting={saving}
                submitLabel={editingScreen ? 'Update Configuration' : 'Generate Room'}
                onCancel={() => setOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24 text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mr-3">progress_activity</span> Calibrating screens...
        </div>
      ) : (
        <div className="rounded-[1.5rem] bg-surface-container-low overflow-hidden shadow-xl border border-surface-container-highest/50">
          <Table>
            <TableHeader className="bg-surface-container-highest/20">
              <TableRow className="border-b-surface-container-highest/50">
                <TableHead className="w-16 font-bold text-on-surface">ID</TableHead>
                <TableHead className="font-bold text-on-surface">Room Identity</TableHead>
                <TableHead className="font-bold text-on-surface">Location</TableHead>
                <TableHead className="font-bold text-on-surface">Specs</TableHead>
                <TableHead className="font-bold text-on-surface">Capacity</TableHead>
                <TableHead className="font-bold text-on-surface">Status</TableHead>
                <TableHead className="w-24 text-right font-bold text-on-surface">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {screens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-24 text-on-surface-variant border-none">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>tv_options_edit_channels</span>
                      <span className="font-bold text-lg">No screen rooms have been configured yet.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                screens.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((screen) => (
                  <TableRow key={screen.id} className="group hover:bg-surface-container transition-colors border-b-surface-container-highest/30">
                    <TableCell className="font-bold text-on-surface-variant/70">#{screen.id}</TableCell>
                    <TableCell>
                      <div className="font-headline font-black text-on-surface text-lg leading-tight flex items-center gap-2">
                        {screen.name}
                        <span className="text-[9px] bg-primary-container/20 text-primary-container border border-primary-container/30 px-1.5 py-0.5 rounded-md font-black tracking-widest uppercase">#{screen.screenNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center text-on-surface-variant font-medium">
                        <span className="material-symbols-outlined text-[1rem] mr-2 opacity-60">pin_drop</span>
                        {screen.branch.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-on-surface flex items-center">
                           <span className="material-symbols-outlined text-[1rem] mr-1.5 opacity-60">format_list_bulleted</span> {screen.rowsCount} Rows
                        </div>
                        <div className="text-xs text-on-surface-variant flex items-center font-medium">
                           <span className="material-symbols-outlined text-[1rem] mr-1.5 opacity-40">apps</span> {screen.seatsPerRow} Seats/Row
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                        <span className="material-symbols-outlined text-[1rem] mr-1.5">groups</span>
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
                          <span className="text-[9px] text-on-surface-variant/60 bg-surface-container-highest px-2 py-0.5 rounded-full border border-outline-variant/30 font-black uppercase tracking-widest">Branch Closed</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(screen)} className="h-10 w-10 text-primary-container bg-primary-container/10 hover:bg-primary-container/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(screen.id)} className="h-10 w-10 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-5 border-t border-surface-container-highest/50 bg-surface-container flex flex-col sm:flex-row justify-between items-center text-sm text-on-surface-variant font-bold gap-4">
            <div>
              Showing <span className="text-on-surface">{Math.min(screens.length, (page * itemsPerPage) + (screens.length > 0 ? 1 : 0))}</span> - <span className="text-on-surface">{Math.min(screens.length, (page + 1) * itemsPerPage)}</span> of <span className="text-on-surface">{screens.length}</span> screens
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-surface-container-highest bg-surface-container-lowest h-10 px-4 rounded-xl shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * itemsPerPage >= screens.length} onClick={() => setPage(p => p + 1)} className="border-surface-container-highest bg-surface-container-lowest h-10 px-4 rounded-xl shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}