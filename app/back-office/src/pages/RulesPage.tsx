import { useEffect, useState } from 'react';
import { 
  FileCode, 
  Trash2, 
  Plus, 
  Loader2, 
  Terminal, 
  Download, 
  Calendar, 
  Code2, 
  Gavel,
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { RuleSet as Ruleset } from '@/types';
import { getRulesets, deleteRuleset, uploadRuleset, activateRuleset, deactivateRuleset } from '@/api/rules';
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
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModernForm } from '@/components/ui/modern-form';
import type { ModernFormSection } from '@/components/ui/modern-form';
import { cn } from '@/lib/utils';

const rulesetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  content: z.string().min(1, 'Rule content is required'),
  active: z.boolean().default(true),
});

type RulesetFormValues = z.infer<typeof rulesetSchema>;

export default function RulesPage() {
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sourceViewerOpen, setSourceViewerOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const form = useForm<RulesetFormValues>({
    resolver: zodResolver(rulesetSchema) as any,
    defaultValues: { name: '', content: '', active: true },
  });

  const fetchRulesets = async () => {
    try {
      setLoading(true);
      const response = await getRulesets();
      setRulesets(response.data.content);
      setError(null);
    } catch (err) {
      setError('Failed to fetch rulesets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesets();
  }, []);

  const onSubmit = async (values: RulesetFormValues, files: Record<string, File | null>) => {
    try {
      setSaving(true);
      const drlFile = files['drlFile'];
      
      if (!drlFile) {
        // If no file uploaded, we might need a different API or convert text to file
        const blob = new Blob([values.content], { type: 'text/plain' });
        const file = new File([blob], `${values.name.replace(/\s+/g, '_')}.drl`, { type: 'text/plain' });
        await uploadRuleset(file, "1.0.0", values.active);
      } else {
        await uploadRuleset(drlFile, "1.0.0", values.active);
      }

      setOpen(false);
      form.reset();
      fetchRulesets();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ruleset: Ruleset, checked: boolean) => {
    setRulesets(prev => prev.map(r => r.id === ruleset.id ? { ...r, active: checked } : r));
    try {
      if (checked) {
        await activateRuleset(ruleset.id);
      } else {
        await deactivateRuleset(ruleset.id);
      }
    } catch (err) {
      setRulesets(prev => prev.map(r => r.id === ruleset.id ? { ...r, active: !checked } : r));
      console.error('Toggle failed', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this ruleset? This will affect pricing and logic.')) {
      try {
        await deleteRuleset(id);
        fetchRulesets();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const rulesetFormSections: ModernFormSection[] = [
    {
      title: "Core Configuration",
      fields: [
        { name: "name", label: "Rule Instance Name", type: "text", required: true, placeholder: "e.g. Student Discount Pack", colSpan: 2 },
        { name: "active", label: "Production Status", type: "switch", description: "Apply these rules to the live checkout engine.", colSpan: 2 },
      ]
    },
    {
      title: "Rule Definition (DRL)",
      fields: [
        { name: "drlFile", label: "Upload .drl File", type: "file", description: "Drools Rule Language file", placeholder: "Select DRL file..." },
        { name: "content", label: "Raw DRL Buffer", type: "textarea", placeholder: "package com.atlas.rules..." },
      ]
    }
  ];

  const handleViewSource = (content: string) => {
    setSelectedSource(content);
    setSourceViewerOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) form.reset();
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Search and Header UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Rules Engine</h1>
          <p className="text-muted-foreground mt-1">Manage Drools rules for pricing and promotions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="rounded-md border-border" onClick={fetchRulesets}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Sync Registry
          </Button>
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-md shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Import Ruleset
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
              <div className="px-8 py-8 border-b border-border shrink-0">
                <SheetHeader>
                  <SheetTitle className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                    <Terminal className="h-8 w-8 text-primary" /> Rules Import
                  </SheetTitle>
                  <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                    Deploy new business logic via Drools Rule Language (DRL).
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <ModernForm
                schema={rulesetSchema}
                defaultValues={form.getValues()}
                onSubmit={onSubmit as any}
                sections={rulesetFormSections}
                isSubmitting={saving}
                submitLabel="Compile & Deploy"
                onCancel={() => setOpen(false)}
                className="flex-1 overflow-hidden"
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 mb-6 rounded-md flex items-center italic">
          <AlertCircle className="h-5 w-5 mr-3" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground font-medium">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Loading rules registry...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Logic Identity</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rulesets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Gavel className="h-16 w-16 mb-4 opacity-10" />
                      No active rulesets found. All transactions using default pricing.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rulesets.map((rs) => (
                  <TableRow key={rs.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">#{rs.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                          <Code2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{rs.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Drools Rule Set</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                       <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1.5 opacity-60" />
                          {rs.createdAt ? new Date(rs.createdAt).toLocaleDateString() : 'System Default'}
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                        <Switch 
                          checked={rs.active} 
                          onCheckedChange={(checked) => handleToggleActive(rs, checked)}
                          className="data-[state=checked]:bg-emerald-500 scale-90"
                        />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter",
                          rs.active ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                          {rs.active ? "LIVE" : "DORMANT"}
                        </span>
                        {rs.active && <CheckCircle2 className="h-3 w-3 text-emerald-500 opacity-60" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleViewSource(rs.drlContent)} title="View Source" className="h-8 w-8 text-primary hover:bg-primary/10">
                          <FileCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rs.id)} title="Remove Ruleset" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" title="Download Resource">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Source Viewer Sheet */}
      <Sheet open={sourceViewerOpen} onOpenChange={setSourceViewerOpen}>
        <SheetContent className="sm:max-w-4xl border-l border-border bg-[#0d1117] p-0 flex flex-col shadow-2xl">
           <div className="px-8 py-8 border-b border-white/5 shrink-0 bg-[#161b22]">
              <SheetHeader>
                <SheetTitle className="text-2xl font-black text-white flex items-center gap-3">
                  <Terminal className="h-6 w-6 text-emerald-400" /> drl_viewer
                </SheetTitle>
                <SheetDescription className="text-gray-400">
                  Read-only access to compiled rule buffers.
                </SheetDescription>
              </SheetHeader>
           </div>
           <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
              <pre className="font-mono text-sm leading-relaxed p-6 rounded-xl bg-black/40 border border-white/5 text-gray-300">
                <code>{selectedSource}</code>
              </pre>
           </div>
           <div className="p-4 border-t border-white/5 bg-[#161b22] text-right">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setSourceViewerOpen(false)}>Close Inspector</Button>
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
