import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'date' 
  | 'switch' 
  | 'textarea' 
  | 'image' 
  | 'rating' 
  | 'duration'
  | 'file'
  | 'datetime-local'
  | 'custom';

export interface FormOption {
  label: string;
  value: string;
}

export interface ModernFormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  options?: FormOption[] | ((values: any) => FormOption[]);
  visible?: (values: any) => boolean;
  colSpan?: 1 | 2;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean | ((values: any) => boolean);
  icon?: React.ReactNode;
  render?: (form: UseFormReturn<any>) => React.ReactNode;
}

export interface ModernFormSection {
  title: string;
  description?: string;
  fields: ModernFormField[];
}

interface ModernFormProps {
  schema: z.ZodType<any, any, any>;
  defaultValues: any;
  onSubmit: (data: any, files: Record<string, File | null>) => Promise<void>;
  sections: ModernFormSection[];
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  className?: string;
  form?: UseFormReturn<any>;
}

export function ModernForm({
  schema,
  defaultValues,
  onSubmit,
  sections,
  isSubmitting = false,
  submitLabel = 'Save Features',
  onCancel,
  form: externalForm,
  className
}: ModernFormProps) {
  const internalForm = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const form = (externalForm || internalForm) as UseFormReturn<any>;
  const values = form.watch();

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const nextPreviewUrls: Record<string, string> = {};
    Object.entries(files).forEach(([name, file]) => {
      if (file) {
        nextPreviewUrls[name] = URL.createObjectURL(file);
      }
    });
    setPreviewUrls(nextPreviewUrls);

    return () => {
      Object.values(nextPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileChange = (name: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [name]: file }));
    if (file) {
      form.setValue(name, '', { shouldValidate: true });
    }
  };

  // Radically updated for a tactile, cinematic, huge ticketing UI aesthetic
  const inputClass = "w-full h-14 px-5 bg-background border-border/60 hover:border-border rounded-xl text-base font-medium transition-all focus-visible:bg-muted/10 focus-visible:border-primary/50 focus-visible:ring-[4px] focus-visible:ring-primary/10 shadow-[0_2px_4px_rgba(0,0,0,0.05)_inset]";
  const labelClass = "block text-sm font-bold text-foreground mb-2 flex items-center justify-between";

  const renderField = (field: ModernFormField) => {
    if (field.visible && !field.visible(values)) return null;

    const currentOptions = typeof field.options === 'function' ? field.options(values) : field.options;
    const isDisabled = typeof field.disabled === 'function' ? field.disabled(values) : field.disabled;

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className={cn("group flex flex-col pt-1", field.colSpan === 2 ? 'col-span-1 md:col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                </FormLabel>
                <div className="relative">
                  {field.icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors pointer-events-none z-10 flex items-center text-[1.2rem]">
                      {field.icon}
                    </div>
                  )}
                  <FormControl>
                    <Input 
                      type={field.type}
                      step={field.step}
                      placeholder={field.placeholder} 
                      className={cn(inputClass, field.icon ? "pl-12" : "pl-4")} 
                      {..._fieldProps} 
                      onChange={(e) => {
                        const val = field.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value;
                        _fieldProps.onChange(val);
                      }}
                      value={_fieldProps.value ?? ''}
                      disabled={isDisabled}
                    />
                  </FormControl>
                </div>
                {field.description && <FormDescription className="text-xs text-muted-foreground mt-1.5 font-medium">{field.description}</FormDescription>}
                <FormMessage className="text-xs text-destructive font-semibold" />
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className="col-span-1 md:col-span-2 flex flex-col group pt-1">
                <FormLabel className={labelClass}>
                  <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={field.placeholder} 
                    className={cn(inputClass, "min-h-[140px] resize-y py-4 px-5 leading-relaxed")} 
                    {..._fieldProps}
                    disabled={isDisabled}
                  />
                </FormControl>
                {field.description && <FormDescription className="text-xs text-muted-foreground mt-1.5 font-medium">{field.description}</FormDescription>}
                <FormMessage className="text-xs text-destructive font-semibold" />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className={cn("group flex flex-col pt-1", field.colSpan === 2 ? 'col-span-1 md:col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                </FormLabel>
                <Select 
                  onValueChange={_fieldProps.onChange} 
                  defaultValue={_fieldProps.value} 
                  value={_fieldProps.value ? String(_fieldProps.value) : undefined}
                  disabled={isDisabled}
                >
                  <FormControl>
                    <SelectTrigger className={cn(inputClass, "font-medium text-base")}>
                      <SelectValue placeholder={field.placeholder || "Select an option..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover border-border/80 rounded-xl shadow-2xl backdrop-blur-md">
                    {currentOptions && (currentOptions as FormOption[]).map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)} className="focus:bg-muted focus:text-foreground rounded-lg mx-1.5 my-1 cursor-pointer text-base py-2 font-medium">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && <FormDescription className="text-xs text-muted-foreground mt-1.5 font-medium">{field.description}</FormDescription>}
                <FormMessage className="text-xs text-destructive font-semibold" />
              </FormItem>
            )}
          />
        );

      case 'switch':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className={cn("flex flex-row items-center justify-between p-6 bg-muted/20 border border-border/40 rounded-2xl", field.colSpan === 2 ? 'col-span-1 md:col-span-2' : '')}>
                <div className="space-y-1">
                  <FormLabel className="text-base font-bold text-foreground">{field.label}</FormLabel>
                  <FormDescription className="text-sm text-muted-foreground font-medium">
                    {field.description || "Toggle to enable or disable"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={!!_fieldProps.value}
                    onCheckedChange={_fieldProps.onChange}
                    disabled={isDisabled}
                    className="data-[state=checked]:bg-primary h-[24px] w-[44px] [&_span]:h-[18px] [&_span]:w-[18px] [&_span[data-state=checked]]:translate-x-[20px] scale-125 origin-right"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case 'image':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => {
              const currentFile = files[field.name];
              const currentUrl = _fieldProps.value;

              return (
                <FormItem className="col-span-1 md:col-span-2 group pt-1">
                  <FormLabel className={labelClass}>
                    <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-4">
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileChange(field.name, e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRefs.current[field.name]?.click()}
                        className={cn(
                          "relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-10 py-12 transition-all flex flex-col items-center justify-center text-center",
                          (currentUrl || currentFile) ? 'border-primary/50 bg-primary/5 hover:border-primary' : 'border-border/60 hover:border-primary/50 bg-muted/10 hover:bg-muted/20'
                        )}
                      >
                        {!(currentUrl || currentFile) && (
                          <>
                            <div className="rounded-full bg-background border border-border shadow-sm p-4 mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-3xl">photo_library</span>
                            </div>
                            <h3 className="font-bold text-lg text-foreground mb-1.5">
                              Drag image here or <span className="text-primary underline decoration-primary/30 underline-offset-4">browse files</span>
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium">Supports JPG, PNG in high resolution</p>
                          </>
                        )}
                        
                        {(currentUrl || currentFile) && (
                          <div className="flex flex-col items-center gap-4">
                            <img
                              src={currentFile ? previewUrls[field.name] : currentUrl}
                              alt="Preview"
                              className="h-40 object-contain rounded-xl shadow-lg border-4 border-background"
                            />
                            <div className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-xl border border-primary/20">
                              <span className="material-symbols-outlined text-[1.2rem]">swap_calls</span> Replace Media
                            </div>
                          </div>
                        )}
                        <input
                          ref={(el) => {
                            fileInputRefs.current[field.name] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileChange(field.name, e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-muted-foreground text-[11px] font-black uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">URL</span>
                         </div>
                         <Input
                           placeholder="Paste an external image link..."
                           className={cn(inputClass, "pl-[4.5rem] font-medium text-sm")}
                           value={currentUrl || ''}
                           onChange={(e) => {
                             form.setValue(field.name, e.target.value);
                             if (e.target.value) handleFileChange(field.name, null);
                           }}
                           disabled={isDisabled}
                         />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive font-semibold mt-2" />
                </FormItem>
              );
            }}
          />
        );

      case 'file':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => {
              const currentFile = files[field.name];

              return (
                <FormItem className="col-span-1 md:col-span-2 group pt-1">
                  <FormLabel className={labelClass}>
                    <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                  </FormLabel>
                  <FormControl>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileChange(field.name, e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => fileInputRefs.current[field.name]?.click()}
                      className={cn(
                        "relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-10 py-12 transition-all flex flex-col items-center justify-center text-center",
                        currentFile ? 'border-primary/50 bg-primary/5 hover:border-primary' : 'border-border/60 hover:border-primary/50 bg-muted/10 hover:bg-muted/20'
                      )}
                    >
                      {!currentFile ? (
                        <>
                          <div className="rounded-full bg-background border border-border shadow-sm p-4 mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-3xl">upload_file</span>
                          </div>
                          <h3 className="font-bold text-lg text-foreground mb-1.5">{field.placeholder || "Drag document here or click to browse"}</h3>
                          <p className="text-sm text-muted-foreground font-medium">{field.description || "Upload a document"}</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 rounded-full bg-primary/10 text-primary mb-2 border border-primary/20 shadow-inner">
                            <span className="material-symbols-outlined text-4xl">draft</span>
                          </div>
                          <div className="font-bold text-base text-foreground tracking-tight">{currentFile.name}</div>
                          <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded">{(currentFile.size / 1024).toFixed(1)} KB</div>
                          <div className="text-sm font-bold text-primary hover:text-primary/80 transition-colors mt-3 px-5 py-2 hover:bg-primary/10 rounded-xl">Tap to replace</div>
                        </div>
                      )}
                      <input
                        ref={(el) => {
                          fileInputRefs.current[field.name] = el;
                        }}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(field.name, e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive font-semibold mt-2" />
                </FormItem>
              );
            }}
          />
        );

      case 'rating':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className={cn("flex flex-col group pt-1", field.colSpan === 2 ? 'col-span-1 md:col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                </FormLabel>
                <FormControl>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-3 px-4 rounded-xl bg-background border border-border/60 shadow-[0_2px_4px_rgba(0,0,0,0.05)_inset]">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => _fieldProps.onChange(star)}
                          className={cn(
                            "transition-all duration-200 outline-none flex items-center justify-center p-1.5 rounded-full",
                            (_fieldProps.value || 0) >= star 
                              ? 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] scale-110' 
                              : 'text-muted-foreground/20 hover:text-yellow-500/50 hover:bg-muted'
                          )}
                        >
                          <span className="material-symbols-outlined fill-current text-lg md:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center bg-muted/30 border border-border/60 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all h-11">
                      <Input
                        type="number" step="0.1" min="0" max="10"
                        className="w-16 h-full text-center font-bold text-lg bg-transparent border-none py-0 px-0 outline-none focus-visible:ring-0 shadow-none rounded-none"
                        {..._fieldProps}
                        value={_fieldProps.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          _fieldProps.onChange(val);
                        }}
                        disabled={isDisabled}
                      />
                      <span className="pr-4 text-sm font-bold text-muted-foreground bg-muted/50 h-full flex items-center border-l border-border/40 pl-3">/ 10</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-destructive font-semibold" />
              </FormItem>
            )}
          />
        );

      case 'duration':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => {
              const totalMins = _fieldProps.value || 0;
              const h = Math.floor(totalMins / 60);
              const m = totalMins % 60;
              return (
                <FormItem className={cn("group flex flex-col pt-1", field.colSpan === 2 ? 'col-span-1 md:col-span-2' : '')}>
                  <FormLabel className={labelClass}>
                    <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                  </FormLabel>
                  <FormControl>
                    <div className={cn(
                      "flex items-center h-14 bg-background border border-border/60 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)_inset] transition-all hover:border-border overflow-hidden focus-within:bg-muted/10 focus-within:border-primary/50 focus-within:ring-[4px] focus-within:ring-primary/10", 
                      isDisabled && "opacity-50 pointer-events-none"
                    )}>
                      <div className="pl-5 pr-4 border-r border-border/30 h-full flex items-center bg-muted/10">
                        <span className="material-symbols-outlined text-muted-foreground text-[1.4rem]">schedule</span>
                      </div>
                      <div className="flex flex-1 items-center px-1 h-full">
                        <Input 
                          type="number" min="0" placeholder="0" 
                          className="h-full border-transparent bg-transparent rounded-none px-2 focus:ring-0 focus-visible:ring-0 text-right w-16 font-bold text-lg shadow-none text-foreground"
                          value={h || ''} 
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            _fieldProps.onChange(val * 60 + m);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-sm text-muted-foreground mr-2 select-none font-bold">hrs</span>
                      </div>
                      <div className="h-8 w-px bg-border/40 mx-1" />
                      <div className="flex flex-1 items-center px-1 h-full">
                        <Input 
                          type="number" min="0" max="59" placeholder="00"
                          className="h-full border-transparent bg-transparent rounded-none px-2 focus:ring-0 focus-visible:ring-0 text-right w-16 font-bold text-lg shadow-none text-foreground"
                          value={m || ''} 
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            _fieldProps.onChange(h * 60 + val);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-sm text-muted-foreground mr-4 select-none font-bold">min</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive font-semibold" />
                </FormItem>
              );
            }}
          />
        );
      
      case 'date':
      case 'datetime-local':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className={cn("group flex flex-col pt-1", field.colSpan === 2 ? 'col-span-1 md:col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  <span>{field.label} {field.required && <span className="text-primary ml-1">*</span>}</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors pointer-events-none z-10 text-[1.3rem]">event</span>
                    <Input 
                      type={field.type} 
                      className={cn(inputClass, "pl-12 font-medium [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer")} 
                      {..._fieldProps}
                      disabled={isDisabled}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-destructive font-semibold" />
              </FormItem>
            )}
          />
        );

      case 'custom':
        return (
          <div key={field.name} className={field.colSpan === 2 ? 'col-span-1 md:col-span-2' : ''}>
             {field.render ? field.render(form) : null}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit((data) => onSubmit(data, files))(e);
        }} 
        className={cn("flex flex-col h-full bg-card rounded-[2.5rem] relative contain-layout", className)}
      >
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 space-y-12 animate-in fade-in duration-500 pb-32">
          {sections.map((section, idx) => {
             const visibleFields = section.fields.filter(f => !f.visible || f.visible(values));
             if (visibleFields.length === 0) return null;
             
             return (
               <div key={idx} className="flex flex-col gap-8 animate-in slide-in-from-bottom-6 fade-in" style={{ animationDelay: (idx * 150) + 'ms', animationFillMode: 'both' }}>
                 <div className="pb-4 border-b-2 border-border/40">
                   <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                     <span className="w-8 h-1.5 bg-primary rounded-full"></span>
                     {section.title}
                   </h3>
                   {section.description && (
                     <p className="text-sm font-medium text-muted-foreground mt-2 ml-11">{section.description}</p>
                   )}
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8 bg-muted/5 p-6 rounded-[2rem] border border-border/30">
                   {section.fields.map(renderField)}
                 </div>
               </div>
             );
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8 bg-background/80 backdrop-blur-2xl border-t border-border/50 flex flex-col sm:flex-row items-center justify-end gap-4 rounded-b-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
           {onCancel && (
             <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-xl border-border/80 hover:bg-muted/60 text-muted-foreground hover:text-foreground">
               Cancel Setup
             </Button>
           )}
           <Button type="submit" variant="default" className="w-full sm:w-min whitespace-nowrap h-14 px-10 text-base font-black rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3" disabled={isSubmitting}>
             {isSubmitting && <span className="material-symbols-outlined animate-spin text-[1.4rem]">refresh</span>}
             {submitLabel}
           </Button>
        </div>
      </form>
    </Form>
  );
}
