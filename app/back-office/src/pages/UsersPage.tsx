import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Search, 
  UserPlus, 
  Shield, 
  Key, 
  Trash2, 
  Users, 
  Pencil, 
  Unlock,
  User as UserIcon,
  Mail,
  Fingerprint
} from 'lucide-react';
import { format } from 'date-fns';
import * as z from 'zod';

import type { User } from '../types';
import { getUsers, registerUser, updateUser, deleteUser, resetPassword, assignRoles, removeRoles } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/auth/AuthContext';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';

const availableRoles = ['ADMIN', 'MANAGER', 'STAFF'];

// Schemas
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roles: z.array(z.string()).min(1, 'Select at least one role')
});

const editSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  enabled: z.boolean()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const rolesSchema = z.object({
  roles: z.array(z.string()).min(1, 'User must have at least one role')
});

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
  }, [page, search]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditSheetOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetDialogOpen(true);
  };

  const handleRoles = (user: User) => {
    setSelectedUser(user);
    setRolesDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
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
    }
  };

  // ModernForm Sections
  const registerSections: ModernFormSection[] = [
    {
      title: "Personal Identity",
      fields: [
        { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
        { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Doe" },
        { name: "email", label: "Email Address", type: "text", required: true, placeholder: "john.doe@example.com", icon: <Mail className="w-4 h-4" />, colSpan: 2 },
      ]
    },
    {
      title: "Security & Permissions",
      fields: [
        { name: "username", label: "Username", type: "text", required: true, placeholder: "johndoe88", icon: <Fingerprint className="w-4 h-4" /> },
        { name: "password", label: "Password", type: "text", required: true, placeholder: "••••••••", icon: <Key className="w-4 h-4" /> },
        { 
          name: "roles", label: "System Roles", type: "custom", colSpan: 2,
          render: (form) => (
            <div className="space-y-4 pt-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Privileges</div>
              <div className="grid grid-cols-3 gap-3">
                {availableRoles.map((role) => (
                  <div 
                    key={role} 
                    className="flex items-center space-x-3 rounded-xl border border-border p-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => {
                      const current = form.getValues('roles') || [];
                      const next = current.includes(role) ? current.filter((r: string) => r !== role) : [...current, role];
                      form.setValue('roles', next, { shouldValidate: true });
                    }}
                  >
                    <Checkbox checked={(form.watch('roles') || []).includes(role)} />
                    <span className="text-xs font-bold">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }
      ]
    }
  ];

  const editSections: ModernFormSection[] = [
    {
      title: "Profile Information",
      fields: [
        { name: "firstName", label: "First Name", type: "text", required: true },
        { name: "lastName", label: "Last Name", type: "text", required: true },
        { name: "email", label: "Email Address", type: "text", required: true, icon: <Mail className="w-4 h-4" />, colSpan: 2 },
        { name: "enabled", label: "Account Status", type: "switch", description: "Allow this user to authenticate.", colSpan: 2 }
      ]
    }
  ];

  const resetPasswordSections: ModernFormSection[] = [
    {
      title: "New Credentials",
      fields: [
        { name: "newPassword", label: "New Password", type: "text", required: true, placeholder: "••••••••", icon: <Key className="w-4 h-4" />, colSpan: 2 },
        { name: "confirmPassword", label: "Confirm Password", type: "text", required: true, placeholder: "••••••••", icon: <Unlock className="w-4 h-4" />, colSpan: 2 },
      ]
    }
  ];

  const rolesSections: ModernFormSection[] = [
    {
      title: "Platform Access",
      fields: [
        { 
          name: "roles", label: "Active Roles", type: "custom", colSpan: 2,
          render: (form) => (
            <div className="grid grid-cols-1 gap-3">
              {availableRoles.map((role) => (
                <div 
                  key={role} 
                  className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => {
                    const current = form.getValues('roles') || [];
                    const next = current.includes(role) ? current.filter((r: string) => r !== role) : [...current, role];
                    form.setValue('roles', next, { shouldValidate: true });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={cn("h-5 w-5", role === 'ADMIN' ? 'text-primary' : role === 'MANAGER' ? 'text-blue-500' : 'text-slate-400')} />
                    <span className="font-bold tracking-tight">{role}</span>
                  </div>
                  <Checkbox checked={(form.watch('roles') || []).includes(role)} />
                </div>
              ))}
            </div>
          )
        }
      ]
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage platform staff and administrative privileges.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search directory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 lg:w-64 pl-9 bg-card shadow-sm border-border rounded-md"
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>
          <Button onClick={() => setRegisterSheetOpen(true)} size="lg" className="rounded-md shadow-sm">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Indexing user directory...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Account Profile</TableHead>
                <TableHead>Privileges</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 mb-3 opacity-20" />
                      No matching records found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground leading-tight">
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 opacity-60" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {(user.roles || []).filter((r: string) => r !== 'default-roles-cinema-realm').length > 0 ? (
                          (user.roles || []).filter((r: string) => r !== 'default-roles-cinema-realm').map((role: string) => (
                            <Badge 
                              key={role} 
                              variant="outline"
                              className={cn(
                                "rounded-md border-transparent font-black text-[10px] tracking-widest",
                                role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
                              )}
                            >
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-40">standard</span>
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
                            className="data-[state=checked]:bg-emerald-500 scale-90"
                          />
                          <span className={cn("text-[10px] font-black uppercase tracking-tighter", user.enabled ? 'text-emerald-500' : 'text-muted-foreground')}>
                            {user.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className={user.enabled ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'opacity-40 rounded-md font-bold uppercase tracking-tighter'}>
                          {user.enabled ? 'Active Account' : 'Suspended'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium">
                      {user.createdTimestamp ? format(new Date(user.createdTimestamp), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage(user.roles || []) && (
                        <div className="flex justify-end gap-1 transition-opacity">
                          <Button title="Edit Profile" variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8 text-primary hover:bg-primary/10">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button title="Change Code" variant="ghost" size="icon" onClick={() => handleResetPassword(user)} className="h-8 w-8 text-amber-500 hover:bg-amber-500/10">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button title="Access Shield" variant="ghost" size="icon" onClick={() => handleRoles(user)} className="h-8 w-8 text-indigo-500 hover:bg-indigo-500/10">
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button 
                            title={user.id === loggedInUserId ? "Restricted" : "Delete User"} 
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
          
          <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <div>
              Showing {users.length} of {total} directory entries
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border h-8 shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={users.length < 10} onClick={() => setPage(p => p + 1)} className="border-border h-8 shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Register Sheet */}
      <Sheet open={registerSheetOpen} onOpenChange={setRegisterSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
          <div className="px-8 py-8 border-b border-border shrink-0">
            <SheetHeader>
              <SheetTitle className="text-3xl font-extrabold tracking-tight">Create User</SheetTitle>
              <SheetDescription className="text-base mt-1 text-muted-foreground/80">Register a new access point for the platform.</SheetDescription>
            </SheetHeader>
          </div>
          <ModernForm
            schema={registerSchema}
            defaultValues={{ username: '', email: '', firstName: '', lastName: '', password: '', roles: ['STAFF'] }}
            onSubmit={async (values) => {
              try {
                setSaving(true);
                await registerUser(values);
                setRegisterSheetOpen(false);
                fetchUsers();
              } finally { setSaving(false); }
            }}
            sections={registerSections}
            isSubmitting={saving}
            submitLabel="Deploy Account"
            onCancel={() => setRegisterSheetOpen(false)}
            className="flex-1 overflow-hidden"
          />
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
          <div className="px-8 py-8 border-b border-border shrink-0">
            <SheetHeader>
              <SheetTitle className="text-3xl font-extrabold tracking-tight">Edit Profile</SheetTitle>
              <SheetDescription className="text-base mt-1 text-muted-foreground/80">Modify identity details for {selectedUser?.username}.</SheetDescription>
            </SheetHeader>
          </div>
          <ModernForm
            schema={editSchema}
            defaultValues={selectedUser ? { email: selectedUser.email, firstName: selectedUser.firstName, lastName: selectedUser.lastName, enabled: selectedUser.enabled } : {}}
            onSubmit={async (values) => {
              if (!selectedUser) return;
              try {
                setSaving(true);
                await updateUser(selectedUser.id, values);
                setEditSheetOpen(false);
                fetchUsers();
              } finally { setSaving(false); }
            }}
            sections={editSections}
            isSubmitting={saving}
            submitLabel="Sync Profile"
            onCancel={() => setEditSheetOpen(false)}
            className="flex-1 overflow-hidden"
          />
        </SheetContent>
      </Sheet>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md border-border bg-background p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="p-8 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Unlock className="h-6 w-6 text-amber-500" /> Reset Pin
              </DialogTitle>
              <DialogDescription className="text-base">Assign new security credentials.</DialogDescription>
            </DialogHeader>
          </div>
          <ModernForm
            schema={resetPasswordSchema}
            defaultValues={{ newPassword: '', confirmPassword: '' }}
            onSubmit={async (values) => {
              if (!selectedUser) return;
              try {
                setSaving(true);
                await resetPassword(selectedUser.id, values.newPassword);
                setResetDialogOpen(false);
              } finally { setSaving(false); }
            }}
            sections={resetPasswordSections}
            isSubmitting={saving}
            submitLabel="Override Credentials"
            onCancel={() => setResetDialogOpen(false)}
            className="p-0 h-auto"
          />
        </DialogContent>
      </Dialog>

      {/* Roles Dialog */}
      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent className="sm:max-w-md border-border bg-background p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="p-8 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Shield className="h-6 w-6 text-indigo-500" /> Access Matrix
              </DialogTitle>
              <DialogDescription className="text-base">Calibrate administrative privileges.</DialogDescription>
            </DialogHeader>
          </div>
          <ModernForm
            schema={rolesSchema}
            defaultValues={{ roles: selectedUser?.roles?.filter((r: string) => availableRoles.includes(r)) || [] }}
            onSubmit={async (values) => {
              if (!selectedUser) return;
              try {
                setSaving(true);
                const currentRoles = selectedUser.roles || [];
                const rolesToAssign = values.roles.filter((r: string) => !currentRoles.includes(r));
                const rolesToRemove = currentRoles.filter((r: string) => !values.roles.includes(r) && r !== 'default-roles-cinema-realm');

                if (rolesToAssign.length > 0) await assignRoles(selectedUser.id, rolesToAssign);
                if (rolesToRemove.length > 0) await removeRoles(selectedUser.id, rolesToRemove);

                setRolesDialogOpen(false);
                fetchUsers();
              } finally { setSaving(false); }
            }}
            sections={rolesSections}
            isSubmitting={saving}
            submitLabel="Update Access"
            onCancel={() => setRolesDialogOpen(false)}
            className="p-0 h-auto"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { cn } from '@/lib/utils';
