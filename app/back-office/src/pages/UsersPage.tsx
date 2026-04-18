import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import * as z from 'zod';

import type { User } from '../types';
import { getUsers, registerUser, updateUser, deleteUser, resetPassword, assignRoles, removeRoles } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  const { keycloak, roles: authRoles, isAuthenticated, isLoading: authLoading } = useAuth();
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
    if (authLoading || !isAuthenticated) return;
    fetchUsers();
  }, [authLoading, isAuthenticated, page, search]);

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
        { name: "email", label: "Email Address", type: "text", required: true, placeholder: "john.doe@example.com", icon: <span className="material-symbols-outlined text-[1rem]">mail</span>, colSpan: 2 },
      ]
    },
    {
      title: "Security & Permissions",
      fields: [
        { name: "username", label: "Username", type: "text", required: true, placeholder: "johndoe88", icon: <span className="material-symbols-outlined text-[1rem]">fingerprint</span> },
        { name: "password", label: "Password", type: "text", required: true, placeholder: "••••••••", icon: <span className="material-symbols-outlined text-[1rem]">key</span> },
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
        { name: "email", label: "Email Address", type: "text", required: true, icon: <span className="material-symbols-outlined text-[1rem]">mail</span>, colSpan: 2 },
        { name: "enabled", label: "Account Status", type: "switch", description: "Allow this user to authenticate.", colSpan: 2 }
      ]
    }
  ];

  const resetPasswordSections: ModernFormSection[] = [
    {
      title: "New Credentials",
      fields: [
        { name: "newPassword", label: "New Password", type: "text", required: true, placeholder: "••••••••", icon: <span className="material-symbols-outlined text-[1rem]">key</span>, colSpan: 2 },
        { name: "confirmPassword", label: "Confirm Password", type: "text", required: true, placeholder: "••••••••", icon: <span className="material-symbols-outlined text-[1rem]">lock_open</span>, colSpan: 2 },
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
                  className="flex items-center justify-between rounded-xl border border-surface-container-highest/50 p-4 bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                  onClick={() => {
                    const current = form.getValues('roles') || [];
                    const next = current.includes(role) ? current.filter((r: string) => r !== role) : [...current, role];
                    form.setValue('roles', next, { shouldValidate: true });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("material-symbols-outlined text-[1.2rem]", role === 'ADMIN' ? 'text-primary-container' : role === 'MANAGER' ? 'text-blue-400' : 'text-on-surface-variant')}>shield</span>
                    <span className="font-bold tracking-tight text-on-surface">{role}</span>
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
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface-container-high rounded-[2rem] p-8 md:p-10 border border-surface-container-highest/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex rounded-lg bg-primary-container/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-container border border-primary-container/20 mb-4">
             Identity Management
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface">Users</h1>
          <p className="text-on-surface-variant font-medium mt-2">Manage platform staff and administrative privileges.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[1.2rem] text-on-surface-variant">search</span>
            <Input
              placeholder="Search directory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-surface-container-lowest border-surface-container-highest/40 h-14 rounded-2xl w-full shadow-lg font-bold placeholder:text-on-surface-variant"
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>
          <Button onClick={() => setRegisterSheetOpen(true)} size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-primary-container/20 font-bold shrink-0">
            <span className="material-symbols-outlined mr-2">person_add</span> Add User
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md italic">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mr-3">progress_activity</span> Indexing user directory...
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-surface-container-highest/50 bg-surface-container-low shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-surface-container-highest/20">
              <TableRow className="border-b-surface-container-highest/50">
                <TableHead className="font-bold text-on-surface">Account Profile</TableHead>
                <TableHead className="font-bold text-on-surface">Privileges</TableHead>
                <TableHead className="font-bold text-on-surface">Status</TableHead>
                <TableHead className="font-bold text-on-surface">Joined</TableHead>
                <TableHead className="w-40 text-right font-bold text-on-surface">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 text-on-surface-variant border-none">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                      <span className="font-bold text-lg">No matching records found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-surface-container transition-colors border-b-surface-container-highest/30">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <div className="font-headline font-black text-on-surface leading-tight text-base">
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                          </div>
                          <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
                            <span className="material-symbols-outlined text-[12px] opacity-60">mail</span> {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(user.roles || []).filter((r: string) => r !== 'default-roles-cinema-realm').length > 0 ? (
                          (user.roles || []).filter((r: string) => r !== 'default-roles-cinema-realm').map((role: string) => (
                            <Badge 
                              key={role} 
                              variant="outline"
                              className={cn(
                                "border border-primary-container/30 font-black text-[9px] uppercase tracking-widest px-1.5 py-0.5",
                                role === 'ADMIN' ? 'bg-primary-container/10 text-primary-container' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              )}
                            >
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-on-surface-variant opacity-60">standard</span>
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
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", user.enabled ? 'text-emerald-400' : 'text-on-surface-variant/60')}>
                            {user.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <span className={cn("text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full border", user.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-surface-container-highest text-on-surface-variant/60 border-surface-container-highest')}>
                          {user.enabled ? 'Active Account' : 'Suspended'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-on-surface-variant text-xs font-medium">
                      {user.createdTimestamp ? format(new Date(user.createdTimestamp), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage(user.roles || []) && (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button title="Edit Profile" variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-10 w-10 text-primary-container bg-primary-container/10 hover:bg-primary-container/20 rounded-xl shadow-sm">
                            <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                          </Button>
                          <Button title="Change Code" variant="ghost" size="icon" onClick={() => handleResetPassword(user)} className="h-10 w-10 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl shadow-sm">
                            <span className="material-symbols-outlined text-[1.2rem]">key</span>
                          </Button>
                          <Button title="Access Shield" variant="ghost" size="icon" onClick={() => handleRoles(user)} className="h-10 w-10 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl shadow-sm">
                            <span className="material-symbols-outlined text-[1.2rem]">shield</span>
                          </Button>
                          <Button 
                            title={user.id === loggedInUserId ? "Restricted" : "Delete User"} 
                            variant="ghost" 
                            size="icon" 
                            disabled={user.id === loggedInUserId}
                            onClick={() => {
                              if (user.id !== loggedInUserId) handleDelete(user.id);
                            }}
                            className="h-10 w-10 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[1.2rem]">delete</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-5 border-t border-surface-container-highest/50 bg-surface-container flex flex-col sm:flex-row justify-between items-center text-sm text-on-surface-variant font-bold gap-4">
            <div>
              Showing <span className="text-on-surface">{users.length}</span> of <span className="text-on-surface">{total}</span> directory entries
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-surface-container-highest bg-surface-container-lowest h-10 px-4 rounded-xl shadow-sm">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={users.length < 10} onClick={() => setPage(p => p + 1)} className="border-surface-container-highest bg-surface-container-lowest h-10 px-4 rounded-xl shadow-sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={registerSheetOpen} onOpenChange={setRegisterSheetOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-surface-container-lowest/95 backdrop-blur-2xl border-none shadow-2xl rounded-[3rem] max-h-[90vh] flex flex-col">
          <div className="px-12 py-10 border-b border-surface-container-highest/40 shrink-0 relative overflow-hidden backdrop-blur-3xl bg-surface-container-lowest/50">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary-container/20 blur-[80px] rounded-full pointer-events-none" />
            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-4xl font-headline font-black tracking-tight text-on-surface">Create User</DialogTitle>
              <DialogDescription className="text-lg mt-3 text-on-surface-variant/80 font-medium">Register a new access point for the platform.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto">
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
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-surface-container-lowest/95 backdrop-blur-2xl border-none shadow-2xl rounded-[3rem] max-h-[90vh] flex flex-col">
           <div className="px-12 py-10 border-b border-surface-container-highest/40 shrink-0 relative overflow-hidden backdrop-blur-3xl bg-surface-container-lowest/50">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary-container/20 blur-[80px] rounded-full pointer-events-none" />
            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-4xl font-headline font-black tracking-tight text-on-surface">Edit Profile</DialogTitle>
              <DialogDescription className="text-lg mt-3 text-on-surface-variant/80 font-medium">Modify identity details for {selectedUser?.username}.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto">
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
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md border-surface-container-highest/50 bg-surface-container-lowest p-0 overflow-hidden rounded-[2rem] shadow-2xl">
          <div className="p-8 border-b border-surface-container-highest/40 bg-surface-container-lowest relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 blur-[50px] rounded-full" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-headline font-black tracking-tight flex items-center gap-3 text-on-surface">
                <span className="material-symbols-outlined text-[2rem] text-amber-500">lock_open</span> Reset Pin
              </DialogTitle>
              <DialogDescription className="text-base mt-2 text-on-surface-variant font-medium">Assign new security credentials.</DialogDescription>
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
            className="p-0 h-auto bg-surface-container-lowest"
          />
        </DialogContent>
      </Dialog>

      {/* Roles Dialog */}
      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent className="sm:max-w-md border-surface-container-highest/50 bg-surface-container-lowest p-0 overflow-hidden rounded-[2rem] shadow-2xl">
          <div className="p-8 border-b border-surface-container-highest/40 bg-surface-container-lowest relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-headline font-black tracking-tight flex items-center gap-3 text-on-surface">
                <span className="material-symbols-outlined text-[2rem] text-indigo-400">shield</span> Access Matrix
              </DialogTitle>
              <DialogDescription className="text-base mt-2 text-on-surface-variant font-medium">Calibrate administrative privileges.</DialogDescription>
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
            className="p-0 h-auto bg-surface-container-lowest"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { cn } from '@/lib/utils';
