import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createScreen } from '@/api/screens';
import { createBranch } from '@/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MonitorPlay, Save, ArrowLeft, Loader2 } from 'lucide-react';

const screenItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  screenNumber: z.coerce.number().min(1).optional(),
  rowsCount: z.coerce.number().min(1, 'Rows count is required'),
  seatsPerRow: z.coerce.number().min(1, 'Seats per row is required'),
});

const formSchema = z.object({
  screens: z.array(screenItemSchema)
});

type FormValues = z.infer<typeof formSchema>;

export default function BranchScreensWizard({
  open,
  pendingBranchData,
  numberOfScreens,
  onComplete,
  onBack
}: {
  open: boolean;
  pendingBranchData: any | null;
  numberOfScreens: number;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { screens: [] }
  });

  useEffect(() => {
    if (open && numberOfScreens > 0) {
      const initialScreens = Array.from({ length: numberOfScreens }).map((_, i) => ({
        name: `Screen ${i + 1}`,
        screenNumber: i + 1,
        rowsCount: 10,
        seatsPerRow: 10,
      }));
      form.reset({ screens: initialScreens });
    }
  }, [open, numberOfScreens, form]);

  const { fields } = useFieldArray({
    control: form.control,
    name: 'screens'
  });

  const onSubmit = async (values: FormValues) => {
    if (!pendingBranchData) return;
    try {
      setIsSubmitting(true);
      // Create branch first
      let createdBranch;
      try {
        const branchRes = await createBranch(pendingBranchData);
        createdBranch = branchRes.data;
      } catch (err: any) {
        console.error('Failed to create branch', err);
        alert(`Failed to create branch: ${err.response?.data?.message || err.message}`);
        setIsSubmitting(false);
        return;
      }

      // Create all screens sequentially 
      try {
        for (const s of values.screens) {
          const totalSeats = s.rowsCount * s.seatsPerRow;
          const payload = {
            name: s.name,
            branch: { id: createdBranch.id } as any,
            screenNumber: s.screenNumber,
            capacity: totalSeats,
            rowsCount: s.rowsCount,
            seatsPerRow: s.seatsPerRow,
            isActive: true,
          };
          await createScreen(payload, totalSeats);
        }
      } catch (err: any) {
        console.error('Failed to create screens', err);
        alert(`Branch created successfully, but failed to create screens: ${err.response?.data?.message || err.message}`);
      }
      onComplete();
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

  return (
    <Sheet open={open} onOpenChange={() => {}}>
      <SheetContent 
        className="sm:max-w-xl w-full overflow-hidden border-l border-border/50 bg-background/95 backdrop-blur-3xl p-0 flex flex-col shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="px-8 py-8 border-b border-border/40 bg-muted/20 shrink-0">
          <SheetHeader>
            <SheetTitle className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <MonitorPlay className="w-8 h-8 text-primary" /> Configure Screens
            </SheetTitle>
            <SheetDescription className="text-base mt-2 text-muted-foreground/80">
              You requested to create {numberOfScreens} screen(s) for <strong>{pendingBranchData?.name}</strong>. Provide seating capacities below.
            </SheetDescription>
          </SheetHeader>
        </div>
        
        <Form {...form}>
          <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="p-8 space-y-12">
              {fields.map((field, index) => {
                const rows = form.watch(`screens.${index}.rowsCount`) || 0;
                const seats = form.watch(`screens.${index}.seatsPerRow`) || 0;
                const total = rows * seats;
                
                return (
                  <div key={field.id} className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-border/30">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                         Screen #{index + 1}
                      </h3>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{total} Total Seats</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name={`screens.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Name</FormLabel>
                            <FormControl>
                              <Input className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`screens.${index}.screenNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Screen Number</FormLabel>
                            <FormControl>
                              <Input type="number" className={inputClass} {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name={`screens.${index}.rowsCount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Rows</FormLabel>
                            <FormControl>
                              <Input type="number" className={inputClass} {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`screens.${index}.seatsPerRow`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Seats per Row</FormLabel>
                            <FormControl>
                              <Input type="number" className={inputClass} {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </Form>
        
        <div className="p-6 border-t border-border/40 bg-background/95 backdrop-blur flex items-center justify-between gap-3 shrink-0 z-10 w-full">
          <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting} className="rounded-full px-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Edit Branch
          </Button>
          <Button type="submit" form="wizard-form" disabled={isSubmitting} size="lg" className="rounded-full shadow-md hover:shadow-lg transition-all px-8">
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Locations & Screens</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
