import { useEffect, useState } from 'react';
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
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Search and Header UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface-container-high rounded-[2rem] p-8 md:p-10 border border-surface-container-highest/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex rounded-lg bg-primary-container/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-container border border-primary-container/20 mb-4">
             Business Rules
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface">Rules Engine</h1>
          <p className="text-on-surface-variant font-medium mt-2">Manage Drools rules for pricing and promotions.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <Button variant="outline" size="lg" className="rounded-2xl h-14 px-6 border-surface-container-highest bg-surface-container-lowest font-bold shadow-lg shrink-0" onClick={fetchRulesets}>
            <span className="material-symbols-outlined mr-2">sync</span> Sync Registry
          </Button>
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-2xl h-14 px-6 shadow-xl hover:shadow-primary-container/20 font-bold shrink-0">
                <span className="material-symbols-outlined mr-2">upload_file</span> Import Ruleset
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl overflow-hidden border-l border-surface-container-highest/50 bg-surface-container-lowest p-0 flex flex-col shadow-2xl">
              <div className="px-10 py-8 border-b border-surface-container-highest/40 shrink-0 bg-surface-container-lowest relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary-container/5 blur-[40px] rounded-full" />
                <SheetHeader className="relative z-10">
                  <SheetTitle className="text-3xl font-headline font-black tracking-tight text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-[2rem] text-primary-container">terminal</span> Rules Import
                  </SheetTitle>
                  <SheetDescription className="text-base mt-2 text-on-surface-variant/80 font-medium">
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
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl flex items-center font-bold">
          <span className="material-symbols-outlined mr-3">error</span> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24 text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary-container mr-3">progress_activity</span> Loading rules registry...
        </div>
      ) : (
        <div className="rounded-[1.5rem] bg-surface-container-low overflow-hidden shadow-xl border border-surface-container-highest/50">
          <Table>
            <TableHeader className="bg-surface-container-highest/20">
              <TableRow className="border-b-surface-container-highest/50">
                <TableHead className="w-16 font-bold text-on-surface">ID</TableHead>
                <TableHead className="font-bold text-on-surface">Logic Identity</TableHead>
                <TableHead className="font-bold text-on-surface">Created At</TableHead>
                <TableHead className="font-bold text-on-surface">Status</TableHead>
                <TableHead className="w-24 text-right font-bold text-on-surface">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rulesets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 text-on-surface-variant border-none">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                      <span className="font-bold text-lg">No active rulesets found. All transactions using default pricing.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rulesets.map((rs) => (
                  <TableRow key={rs.id} className="group hover:bg-surface-container transition-colors border-b-surface-container-highest/30">
                    <TableCell className="font-bold text-on-surface-variant/70">#{rs.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container">
                          <span className="material-symbols-outlined text-[1.2rem]">code</span>
                        </div>
                        <div>
                          <div className="font-headline font-black text-on-surface leading-tight text-base">{rs.name}</div>
                          <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-1">Drools Rule Set</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-on-surface-variant">
                       <div className="flex items-center">
                          <span className="material-symbols-outlined text-[1rem] mr-2 opacity-60">calendar_month</span>
                          {rs.createdAt ? new Date(rs.createdAt).toLocaleDateString() : 'System Default'}
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                        <Switch 
                          checked={rs.active} 
                          onCheckedChange={(checked) => handleToggleActive(rs, checked)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          rs.active ? "text-emerald-400" : "text-on-surface-variant/60"
                        )}>
                          {rs.active ? "LIVE" : "DORMANT"}
                        </span>
                        {rs.active && <span className="material-symbols-outlined text-[1rem] text-emerald-400 opacity-60" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleViewSource(rs.drlContent)} title="View Source" className="h-10 w-10 text-primary-container bg-primary-container/10 hover:bg-primary-container/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">data_object</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rs.id)} title="Remove Ruleset" className="h-10 w-10 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-[1.2rem]">delete</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-on-surface-variant bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-xl shadow-sm" title="Download Resource">
                          <span className="material-symbols-outlined text-[1.2rem]">download</span>
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
        <SheetContent className="sm:max-w-4xl border-l border-surface-container-highest/50 bg-[#0d1117] p-0 flex flex-col shadow-2xl z-[100]">
           <div className="px-10 py-8 border-b border-white/5 shrink-0 bg-[#161b22]">
              <SheetHeader>
                <SheetTitle className="text-2xl font-headline font-black text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400">terminal</span> drl_viewer
                </SheetTitle>
                <SheetDescription className="text-gray-400 font-medium text-base mt-2">
                  Read-only access to compiled rule buffers.
                </SheetDescription>
              </SheetHeader>
           </div>
           <div className="flex-1 overflow-auto p-6 bg-[#0d1117]">
              <pre className="font-mono text-sm leading-relaxed p-6 rounded-[1rem] bg-black/40 border border-white/5 text-gray-300">
                <code>{selectedSource}</code>
              </pre>
           </div>
           <div className="p-6 border-t border-white/5 bg-[#161b22] flex justify-end">
              <Button variant="ghost" className="text-gray-400 hover:text-white rounded-xl font-bold" onClick={() => setSourceViewerOpen(false)}>Close Inspector</Button>
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
