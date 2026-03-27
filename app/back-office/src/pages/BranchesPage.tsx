// src/pages/BranchesPage.tsx
import { useEffect, useState } from 'react';
import type { Branch } from '../types';
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Pencil, Trash2, Plus } from 'lucide-react';

// Validation schema
const branchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '' },
  });

  // Fetch branches
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

  // Handle form submission (create or update)
  const onSubmit = async (values: BranchFormValues) => {
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, values);
      } else {
        await createBranch(values);
      }
      setOpen(false);
      form.reset();
      setEditingBranch(null);
      fetchBranches(); // refresh list
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  // Handle edit
  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.reset({ name: branch.name, address: branch.address });
    setOpen(true);
  };

  // Handle delete
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

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setEditingBranch(null);
      form.reset();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Branches</h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
              <DialogDescription>
                {editingBranch ? 'Update the branch details below.' : 'Fill in the details to add a new branch.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Downtown Cinema" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{editingBranch ? 'Update' : 'Create'}</Button>
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
              <TableHead>Address</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No branches found.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.id}</TableCell>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)}>
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