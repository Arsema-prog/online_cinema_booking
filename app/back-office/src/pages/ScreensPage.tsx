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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Pencil, Trash2, Plus } from 'lucide-react';

// Schema definition
const screenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  branchId: z.coerce.number().min(1, 'Branch is required'),
  rows: z.coerce.number().optional().catch(undefined),
  seatsPerRow: z.coerce.number().optional().catch(undefined),
});

type ScreenFormValues = z.infer<typeof screenSchema>;

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [numberOfSeats, setNumberOfSeats] = useState<number>(0);

  const form = useForm<ScreenFormValues>({
    resolver: zodResolver(screenSchema) as any,
    defaultValues: { name: '', branchId: 0, rows: undefined, seatsPerRow: undefined },
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

      const payload = {
        name: values.name,
        branch,
        rows: values.rows,
        seatsPerRow: values.seatsPerRow,
      };

      if (editingScreen) {
        await updateScreen(editingScreen.id, payload);
      } else {
        let seats = numberOfSeats;
        if (values.rows && values.seatsPerRow) {
          seats = values.rows * values.seatsPerRow;
        }
        await createScreen(payload, seats);
      }
      setOpen(false);
      form.reset();
      setEditingScreen(null);
      setNumberOfSeats(0);
      fetchData();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleEdit = (screen: Screen) => {
    setEditingScreen(screen);
    form.reset({
      name: screen.name,
      branchId: screen.branch.id,
      rows: screen.rows,
      seatsPerRow: screen.seatsPerRow,
    });
    setOpen(true);
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
      setNumberOfSeats(0);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Screens</h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Screen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingScreen ? 'Edit Screen' : 'Create Screen'}</DialogTitle>
              <DialogDescription>
                {editingScreen
                  ? 'Update the screen details below.'
                  : 'Fill in the details to add a new screen. Seats will be generated automatically.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screen Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Screen 1" {...field} />
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
                      <FormLabel>Branch</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? String(field.value) : ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rows"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rows (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.valueAsNumber;
                              field.onChange(isNaN(val) ? undefined : val);
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
                        <FormLabel>Seats per Row (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.valueAsNumber;
                              field.onChange(isNaN(val) ? undefined : val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {!editingScreen && (
                  <div className="space-y-2">
                    <FormLabel>Number of Seats</FormLabel>
                    <Input
                      type="number"
                      placeholder="50"
                      value={numberOfSeats}
                      onChange={(e) => setNumberOfSeats(e.target.valueAsNumber || 0)}
                    />
                    <p className="text-sm text-muted-foreground">
                      If rows and seats per row are provided, they will be used to calculate total seats. Otherwise, enter the total number of seats manually.
                    </p>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit">{editingScreen ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Seats/Row</TableHead>
              <TableHead>Total Seats</TableHead>
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
              screens.map((screen) => (
                <TableRow key={screen.id}>
                  <TableCell>{screen.id}</TableCell>
                  <TableCell>{screen.name}</TableCell>
                  <TableCell>{screen.branch.name}</TableCell>
                  <TableCell>{screen.rows || '-'}</TableCell>
                  <TableCell>{screen.seatsPerRow || '-'}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(screen)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(screen.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}