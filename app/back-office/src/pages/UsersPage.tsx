import { useEffect, useState } from 'react';
import type { User } from '../types';
import { getUsers, registerUser, updateUser, deleteUser, resetPassword, assignRoles, removeRoles } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Search, UserPlus, Shield, Key, Trash2, Users, Pencil, Edit3, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/auth/AuthContext';

const availableRoles = ['ADMIN', 'MANAGER', 'STAFF'];

export default function UsersPage() {
  const { keycloak, roles: authRoles } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [registerSheetOpen, setRegisterSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const loggedInUserId = keycloak?.subject || null;
  const loggedInRoles = authRoles;

  const canManage = (targetUserRoles: string[]) => {
    if (loggedInRoles.includes('ADMIN')) return true;
    if (loggedInRoles.includes('MANAGER')) {
      if (targetUserRoles.includes('ADMIN') || targetUserRoles.includes('MANAGER')) return false;
      return true;
    }
    return false;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers(search || undefined, page, 10);
      setUsers(res.data.content);
      setTotal(res.data.totalElements);
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
  }, [page]);

  // Forms Setup
  const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(6),
    roles: z.array(z.string()).min(1, 'Select at least one role')
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', firstName: '', lastName: '', password: '', roles: ['STAFF'] }
  });

  const editSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    enabled: z.boolean()
  });

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { email: '', firstName: '', lastName: '', enabled: true }
  });

  const resetSchema = z.object({
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6)
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  const rolesSchema = z.object({
    roles: z.array(z.string()).min(1, 'User must have at least one role')
  });

  const rolesForm = useForm<z.infer<typeof rolesSchema>>({
    resolver: zodResolver(rolesSchema),
    defaultValues: { roles: [] }
  });

  // Action Handlers
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled: user.enabled
    });
    setEditSheetOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    resetForm.reset();
    setResetDialogOpen(true);
  };

  const handleRoles = (user: User) => {
    setSelectedUser(user);
    rolesForm.reset({
      roles: user.roles?.filter((r: string) => availableRoles.includes(r)) || []
    });
    setRolesDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user. They might be referenced by other records.');
    }
  };

  const toggleEnabled = async (user: User) => {
    try {
      await updateUser(user.id, {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: !user.enabled
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: !u.enabled } : u));
    } catch (err) {
      console.error(err);
      alert('Failed to toggle active status');
    }
  };

  // Submits
  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setSaving(true);
      await registerUser(values);
      setRegisterSheetOpen(false);
      registerForm.reset({ username: '', email: '', firstName: '', lastName: '', password: '', roles: ['STAFF'] });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to register user. The username/email might be taken.');
    } finally {
      setSaving(false);
    }
  };

  const onEditSubmit = async (values: z.infer<typeof editSchema>) => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      await updateUser(selectedUser.id, values);
      setEditSheetOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const onResetPasswordSubmit = async (values: z.infer<typeof resetSchema>) => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      await resetPassword(selectedUser.id, values.newPassword);
      setResetDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const onRolesSubmit = async (values: z.infer<typeof rolesSchema>) => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      const currentRoles = selectedUser.roles || [];
      const newRoles = values.roles;
      
      const rolesToAssign = newRoles.filter(r => !currentRoles.includes(r));
      const rolesToRemove = currentRoles.filter(r => !newRoles.includes(r) && r !== 'default-roles-cinema-realm');

      if (rolesToAssign.length > 0) {
        await assignRoles(selectedUser.id, rolesToAssign);
      }
      if (rolesToRemove.length > 0) {
        await removeRoles(selectedUser.id, rolesToRemove);
      }
      setRolesDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update roles.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff, managers, and customer accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 lg:w-64 pl-9 bg-card shadow-sm border-border rounded-md"
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>
          <Button onClick={() => setRegisterSheetOpen(true)} className="rounded-md shadow-sm px-6">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Loading users directory...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User Profile</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 mb-3 opacity-20" />
                      No users found. Try adjusting your search query.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-foreground text-base">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      <div className="text-[10px] text-muted-foreground opacity-50 font-mono mt-0.5">{user.username}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {(user.roles || []).filter((r: string) => r !== 'default-roles-cinema-realm').length > 0 ? (
                          (user.roles || []).filter((r: string) => r !== 'default-roles-cinema-realm').map((role: string) => (
                            <Badge key={role} variant={role === 'ADMIN' ? 'default' : 'secondary'} className={`${role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}`}>
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard User</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage(user.roles || []) ? (
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={user.enabled} 
                            disabled={user.id === loggedInUserId}
                            onCheckedChange={() => toggleEnabled(user)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                          <span className="text-sm font-medium text-muted-foreground">
                            {user.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <Badge variant={user.enabled ? 'default' : 'destructive'} className={user.enabled ? 'bg-emerald-500/10 text-emerald-500' : ''}>
                          {user.enabled ? 'Active Account' : 'Suspended'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.createdTimestamp ? format(new Date(user.createdTimestamp), 'PPp') : '-'}
                    </TableCell>
                      <TableCell className="text-right">
                      {canManage(user.roles || []) && (
                        <div className="flex justify-end gap-1 transition-opacity">
                          <Button title="Edit Profile" variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8 text-primary hover:bg-primary/10">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button title="Change Password" variant="ghost" size="icon" onClick={() => handleResetPassword(user)} className="h-8 w-8 text-amber-500 hover:bg-amber-500/10">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button title="Manage Roles" variant="ghost" size="icon" onClick={() => handleRoles(user)} className="h-8 w-8 text-indigo-500 hover:bg-indigo-500/10">
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button 
                            title={user.id === loggedInUserId ? "You cannot delete yourself" : "Delete User"} 
                            variant="ghost" 
                            size="icon" 
                            disabled={user.id === loggedInUserId}
                            onClick={() => {
                              if (user.id !== loggedInUserId) handleDelete(user.id);
                            }}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <div>
              Showing {users.length} of {total} accounts
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border/50 h-8">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={users.length < 10} onClick={() => setPage(p => p + 1)} className="border-border/50 h-8">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Register User Sheet --- */}
      <Sheet open={registerSheetOpen} onOpenChange={setRegisterSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
          <div className="px-8 py-8 border-b border-border shrink-0">
            <SheetHeader>
              <SheetTitle className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <UserPlus className="h-8 w-8 text-primary" /> Create New Account
              </SheetTitle>
              <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                Register a new administrative or customer user to the platform.
              </SheetDescription>
            </SheetHeader>
          </div>
          
          <Form {...registerForm}>
            <form id="register-form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="flex-1 overflow-y-auto hide-scrollbar">
              <div className="p-8 space-y-10">
                
                <div className="space-y-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                    Account Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">*: First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">*: Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">*: Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" className={inputClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="h-[1px] w-full bg-border/30 shrink-0" />

                <div className="space-y-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                    Security & Identity
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">*: Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe88" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">*: Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="roles"
                    render={() => (
                      <FormItem className="pt-2">
                        <div className="mb-4">
                          <FormLabel className="text-foreground/80 font-medium block mb-1">System Roles</FormLabel>
                          <p className="text-xs text-muted-foreground">Assign appropriate access privileges to this account.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {availableRoles.map((role) => (
                            <FormField
                              key={role}
                              control={registerForm.control}
                              name="roles"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={role}
                                    className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-border/50 p-4 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(role)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, role])
                                            : field.onChange(field.value?.filter((value) => value !== role))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-bold tracking-wide text-sm cursor-pointer w-full text-foreground/90">
                                      {role}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
              </div>
            </form>
          </Form>

          <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0 z-10">
            <Button type="button" variant="ghost" onClick={() => setRegisterSheetOpen(false)} className="rounded-md px-6">Cancel</Button>
            <Button type="submit" form="register-form" size="lg" className="rounded-md shadow-sm px-8" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : 'Create Account'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- Edit User Sheet --- */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
          <div className="px-8 py-8 border-b border-border shrink-0">
            <SheetHeader>
              <SheetTitle className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <Edit3 className="h-8 w-8 text-primary" /> Edit Profile
              </SheetTitle>
              <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                Update details or active status for <strong>{selectedUser?.username}</strong>.
              </SheetDescription>
            </SheetHeader>
          </div>
          
          <Form {...editForm}>
            <form id="edit-form" onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex-1 overflow-y-auto hide-scrollbar">
              <div className="p-8 space-y-10">
                
                <div className="space-y-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                    Demographics
                  </h3>
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">*: Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" className={inputClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={editForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">*: First Name</FormLabel>
                          <FormControl>
                            <Input className={inputClass} {...field} />
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
                          <FormLabel className="text-foreground/80 font-medium">*: Last Name</FormLabel>
                          <FormControl>
                            <Input className={inputClass} {...field} />
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
                    Accessibility
                  </h3>
                  <FormField
                    control={editForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                          <FormLabel className="text-base font-semibold text-foreground">Account Enabled</FormLabel>
                          <p className="text-xs text-muted-foreground">Is this user allowed to log into the platform?</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
              </div>
            </form>
          </Form>

          <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0 z-10 w-full">
            <Button type="button" variant="ghost" onClick={() => setEditSheetOpen(false)} className="rounded-md px-6">Cancel</Button>
            <Button type="submit" form="edit-form" size="lg" className="rounded-md shadow-sm px-8" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- Reset Password Dialog --- */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-background rounded-xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Unlock className="h-6 w-6 text-amber-500" /> Reset Password
            </DialogTitle>
            <DialogDescription className="text-base">
              Assign a new security credential to <strong className="text-foreground">{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetPasswordSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-medium">*: New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-medium">*: Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="mt-2 text-right">
                <Button type="button" variant="ghost" className="rounded-md" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-md bg-amber-500 hover:bg-amber-600 shadow-sm transition-all text-white px-6">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Reset Password'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* --- Manage Roles Dialog --- */}
      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-background rounded-xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Shield className="h-6 w-6 text-indigo-500" /> Administrative Roles
            </DialogTitle>
            <DialogDescription className="text-base">
              Adjust platform access privileges for <strong className="text-foreground">{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Form {...rolesForm}>
            <form onSubmit={rolesForm.handleSubmit(onRolesSubmit)} className="space-y-6">
              <FormField
                control={rolesForm.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 gap-3">
                      {availableRoles.map((role) => (
                        <FormField
                          key={role}
                          control={rolesForm.control}
                          name="roles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={role}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-border/50 p-4 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, role])
                                        : field.onChange(field.value?.filter((value) => value !== role))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-bold tracking-wide text-sm cursor-pointer w-full text-foreground/90">
                                  {role}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-2">
                <Button type="button" variant="ghost" className="rounded-md" onClick={() => setRolesDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-md bg-indigo-500 hover:bg-indigo-600 shadow-sm transition-all text-white px-8">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Save Roles'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
