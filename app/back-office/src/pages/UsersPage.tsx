import { useEffect, useState } from 'react';
import type { User } from '@/types';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  resetPassword,
  assignRoles,
  removeRoles,
} from '@/api/users';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Pencil, Trash2, Key, Shield, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Schema for editing user (only fields that can be updated)
const editUserSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  enabled: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

// Schema for reset password
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [availableRoles] = useState(['ADMIN', 'MANAGER', 'STAFF', 'USER']); // could be fetched from backend

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { email: '', firstName: '', lastName: '', enabled: true },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers(search || undefined, page, 10);
      const usersWithoutRoles = response.data.content;
      
      // Fetch full details for each user to get roles
      const usersWithRoles = await Promise.all(
        usersWithoutRoles.map(async (user) => {
          try {
            const fullUser = await getUser(user.id);
            return fullUser.data;
          } catch (err) {
            console.error(`Failed to fetch roles for user ${user.username}`, err);
            return user; // fallback to original without roles
          }
        })
      );
      
      setUsers(usersWithRoles);
      setTotal(response.data.total);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      enabled: user.enabled,
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (values: EditUserFormValues) => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, values);
      setEditDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        fetchUsers();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    resetForm.reset({ newPassword: '' });
    setResetDialogOpen(true);
  };

  const onResetPasswordSubmit = async (values: ResetPasswordFormValues) => {
    if (!selectedUser) return;
    try {
      await resetPassword(selectedUser.id, values.newPassword);
      setResetDialogOpen(false);
      // optionally show success message
    } catch (err) {
      console.error('Reset password failed', err);
    }
  };

  const handleRoles = async (user: User) => {
    setSelectedUser(user);
    setRolesDialogOpen(true);
    setLoadingRoles(true);
    try {
      // Fetch full user details including roles (already have them, but refresh)
      const response = await getUser(user.id);
      const fullUser = response.data;
      setSelectedUser(fullUser);
      // Update the user in the list
      setUsers(prev =>
        prev.map(u => (u.id === fullUser.id ? fullUser : u))
      );
    } catch (err) {
      console.error('Failed to fetch user roles', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const toggleRole = async (role: string, checked: boolean) => {
    if (!selectedUser) return;
    try {
      if (checked) {
        await assignRoles(selectedUser.id, [role]);
      } else {
        await removeRoles(selectedUser.id, [role]);
      }
      // Update local state optimistically
      const updatedUser = {
        ...selectedUser,
        roles: checked
          ? [...(selectedUser.roles || []), role]
          : (selectedUser.roles || []).filter(r => r !== role),
      };
      setSelectedUser(updatedUser);
      // Also update the user in the list
      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? updatedUser : u))
      );
    } catch (err) {
      console.error('Role update failed', err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={() => fetchUsers()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <div className="text-destructive mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || []).length > 0 ? (
                          (user.roles || []).map(role => (
                            <Badge key={role} variant="outline">{role}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.enabled ? 'default' : 'destructive'}>
                        {user.enabled ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.createdTimestamp ? format(new Date(user.createdTimestamp), 'PP') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleResetPassword(user)}>
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRoles(user)}>
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination (simplified) */}
          <div className="flex justify-between items-center mt-4">
            <div>
              Showing {users.length} of {total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={users.length < 10}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Enabled</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Reset Password</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
            <DialogDescription>
              {loadingRoles ? (
                <span>Loading roles...</span>
              ) : (
                `Assign or remove roles for ${selectedUser?.username}`
              )}
            </DialogDescription>
          </DialogHeader>
          {loadingRoles ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {availableRoles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={(selectedUser?.roles || []).includes(role)}
                    onCheckedChange={(checked) => toggleRole(role, checked as boolean)}
                  />
                  <label htmlFor={role} className="text-sm font-medium leading-none">
                    {role}
                  </label>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}