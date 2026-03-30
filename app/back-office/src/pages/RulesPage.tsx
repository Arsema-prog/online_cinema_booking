import { useEffect, useState, useRef } from 'react';
import type { RuleSet as RulesetMetadata } from '../types';
import { getRulesets, uploadRuleset, activateRuleset, deactivateRuleset, deleteRuleset } from '@/api/rules';
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
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UploadCloud, FileCode2, Loader2, FileText, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function RulesPage() {
  const [rulesets, setRulesets] = useState<RulesetMetadata[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // View Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDrlContent, setSelectedDrlContent] = useState<string | null>(null);

  // Upload Sheet State
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [activateOnUpload, setActivateOnUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRulesets = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await getRulesets(page, 10);
      setRulesets(res.data.content);
      setTotal(res.data.totalElements);
    } catch (err) {
      console.error('Failed to fetch rulesets', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesets();
  }, [page]);

  const handleActivate = async (id: number) => {
    try {
      await activateRuleset(id);
      fetchRulesets(false); 
    } catch (err) {
      console.error('Failed to activate ruleset', err);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateRuleset(id);
      fetchRulesets(false); 
    } catch (err) {
      console.error('Failed to deactivate ruleset', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ruleset?')) return;
    try {
      await deleteRuleset(id);
      fetchRulesets(false); 
    } catch (err) {
      console.error('Failed to delete ruleset', err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      await uploadRuleset(file, version || undefined, activateOnUpload);
      setUploadSheetOpen(false);
      setFile(null);
      setVersion('');
      setActivateOnUpload(false);
      fetchRulesets(false);
    } catch (err) {
      console.error('Failed to upload ruleset', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.drl')) {
         setFile(droppedFile);
      } else {
         alert('Please upload a valid .drl Drools file.');
      }
    }
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Pricing Rules</h1>
          <p className="text-muted-foreground mt-1">Manage Drools (.drl) rulesets for dynamic pricing.</p>
        </div>
        <Button onClick={() => setUploadSheetOpen(true)} size="lg" className="rounded-md shadow-sm">
          <UploadCloud className="mr-2 h-5 w-5" /> Upload Ruleset
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" /> 
            <div>Loading rules engines...</div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rulesets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FileCode2 className="h-12 w-12 mb-3 opacity-20" />
                        No pricing rules found. Upload a .drl file to get started.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rulesets.map((rule) => (
                    <TableRow key={rule.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary opacity-70" />
                        {rule.name}
                      </TableCell>
                      <TableCell><Badge variant="outline">{rule.version || 'v1'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.active}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleActivate(rule.id);
                              } else {
                                handleDeactivate(rule.id);
                              }
                            }}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                          <Badge variant={rule.active ? "default" : "secondary"} className={rule.active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : ''}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {rule.createdAt ? format(new Date(rule.createdAt), 'PPp') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedDrlContent(rule.drlContent);
                              setViewDialogOpen(true);
                            }} 
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8"
                            title="View DRL Source"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={rule.active}
                            onClick={() => handleDelete(rule.id)} 
                            className={`text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 ${rule.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Delete Ruleset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border/50 flex justify-between items-center text-sm text-muted-foreground">
              <div>Showing {rulesets.length} of {total} rulesets</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-border/50 h-8">Previous</Button>
                <Button variant="outline" size="sm" disabled={rulesets.length < 10} onClick={() => setPage(p => p + 1)} className="border-border/50 h-8">Next</Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Sheet open={uploadSheetOpen} onOpenChange={setUploadSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-hidden border-l border-border bg-background p-0 flex flex-col shadow-2xl">
          <div className="px-8 py-8 border-b border-border shrink-0">
            <SheetHeader>
              <SheetTitle className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <UploadCloud className="h-8 w-8 text-primary" /> Upload Drools
              </SheetTitle>
              <SheetDescription className="text-base mt-2 text-muted-foreground/80">
                Upload a business rule file (.drl) to process automated dynamic pricing in the booking flow.
              </SheetDescription>
            </SheetHeader>
          </div>
          
          <form id="rules-upload-form" onSubmit={handleUpload} className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="p-8 space-y-10">
              
              <div className="space-y-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                  Rule File
                </h3>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-10 
                    flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-background/50
                    ${file ? 'border-primary/50 bg-primary/5' : 'border-border/60 hover:border-primary/50 bg-muted/40 hover:bg-muted/60'}
                  `}
                >
                  {!file ? (
                    <>
                      <div className="p-4 rounded-full bg-background shadow-sm text-muted-foreground mb-4 group-hover:scale-110 group-hover:text-primary transition-all">
                        <FileCode2 className="w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">Click or drag file here</h3>
                      <p className="text-xs text-muted-foreground">Only standard .drl files are permitted.</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="font-semibold">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                      <div className="text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors mt-2">
                        Replace File
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".drl"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                    required={!file}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                  Metadata
                </h3>
                <div className="space-y-4">
                  <label htmlFor="version" className="text-sm font-medium text-foreground/80">*: Version Label</label>
                  <Input 
                    id="version" 
                    placeholder="e.g. 1.0.0, WinterPromo" 
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    required
                    className={`${inputClass} h-12`}
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                  Activation
                </h3>
                <div className="flex flex-row items-center justify-between">
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-foreground">Activate Automatically</div>
                    <div className="text-muted-foreground">The rule will take effect immediately.</div>
                  </div>
                  <Switch
                    checked={activateOnUpload}
                    onCheckedChange={setActivateOnUpload}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>

            </div>
          </form>

          <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0 z-10">
            <Button type="button" variant="ghost" onClick={() => setUploadSheetOpen(false)} className="rounded-md px-6">Cancel</Button>
            <Button type="submit" form="rules-upload-form" size="lg" disabled={!file || uploading} className="rounded-md shadow-sm px-8">
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : 'Import Rules'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <FileCode2 className="h-5 w-5 text-primary" /> View Rules DRL Source
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4 rounded-md border border-border/50 bg-[#1e1e1e] p-4 font-mono text-sm leading-relaxed text-gray-300 shadow-inner">
            <pre className="whitespace-pre-wrap">
              {selectedDrlContent || 'No content found.'}
            </pre>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setViewDialogOpen(false)}>Close Editor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
