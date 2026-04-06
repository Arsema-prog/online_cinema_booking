import React, { useRef, useState } from 'react';
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
import { 
  Loader2, 
  UploadCloud, 
  ImageIcon, 
  Star, 
  Clock, 
  Calendar as CalendarIcon,
  FileText as FileDescriptionIcon
} from 'lucide-react';
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
  submitLabel = 'Save Changes',
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

  const handleFileChange = (name: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [name]: file }));
    if (file) {
      form.setValue(name, '', { shouldValidate: true });
    }
  };

  const inputClass = "bg-muted/40 border-transparent shadow-sm hover:bg-muted/60 focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl transition-colors";

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
              <FormItem className={field.colSpan === 2 ? 'col-span-2' : ''}>
                <FormLabel className="text-foreground/80 font-medium">
                  {field.required && '*: '}{field.label}
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    {field.icon && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        {field.icon}
                      </div>
                    )}
                    <Input 
                      type={field.type}
                      step={field.step}
                      placeholder={field.placeholder} 
                      className={cn(inputClass, field.icon && "pl-10")} 
                      {..._fieldProps} 
                      onChange={(e) => {
                        const val = field.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value;
                        _fieldProps.onChange(val);
                      }}
                      value={_fieldProps.value ?? ''}
                      disabled={isDisabled}
                    />
                  </div>
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
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
              <FormItem className="col-span-2">
                <FormLabel className="text-foreground/80 font-medium">
                  {field.required && '*: '}{field.label}
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={field.placeholder} 
                    className={cn(inputClass, "min-h-[100px] resize-none")} 
                    {..._fieldProps}
                    disabled={isDisabled}
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
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
              <FormItem className={field.colSpan === 2 ? 'col-span-2' : ''}>
                <FormLabel className="text-foreground/80 font-medium">
                  {field.required && '*: '}{field.label}
                </FormLabel>
                <Select 
                  onValueChange={_fieldProps.onChange} 
                  defaultValue={_fieldProps.value} 
                  value={_fieldProps.value ? String(_fieldProps.value) : undefined}
                  disabled={isDisabled}
                >
                  <FormControl>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {currentOptions && (currentOptions as FormOption[]).map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
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
              <FormItem className={cn("flex flex-row items-center justify-between rounded-xl border border-border p-4 bg-muted/20", field.colSpan === 2 ? 'col-span-2' : '')}>
                <div className="space-y-0.5">
                  <FormLabel className="font-bold">{field.label}</FormLabel>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight italic">
                    {field.description || "Public availability toggle"}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={_fieldProps.value}
                    onCheckedChange={_fieldProps.onChange}
                    className="data-[state=checked]:bg-emerald-500"
                    disabled={isDisabled}
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
              const fileInputRef = useRef<HTMLInputElement>(null);
              const currentFile = files[field.name];
              const currentUrl = _fieldProps.value;

              return (
                <FormItem className="col-span-2">
                  <FormLabel className="text-foreground/80 font-medium font-bold">
                    {field.required && '*: '}{field.label}
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
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center",
                          (currentUrl || currentFile) ? 'border-primary/30 bg-primary/5' : 'border-border/60 hover:border-primary/50 bg-muted/40 hover:bg-muted/60'
                        )}
                      >
                        {!(currentUrl || currentFile) && (
                          <>
                            <div className="p-4 rounded-full bg-background shadow-sm text-muted-foreground mb-4 group-hover:scale-110 group-hover:text-primary transition-all">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">{field.placeholder || "Click or drag image here"}</h3>
                            <p className="text-xs text-muted-foreground">High-res JPEG, PNG, or WebP</p>
                          </>
                        )}
                        
                        {(currentUrl || currentFile) && (
                          <div className="flex flex-col items-center gap-4">
                            <img
                              src={currentFile ? URL.createObjectURL(currentFile) : currentUrl}
                              alt="Preview"
                              className="h-32 object-contain rounded-xl shadow-sm"
                            />
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
                              <ImageIcon className="w-3.5 h-3.5" /> Replace Media
                            </div>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
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
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Alt URL</span>
                         </div>
                         <Input
                           placeholder="https://..."
                           className={cn(inputClass, "pl-14 text-sm")}
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
                  <FormMessage />
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
              <FormItem className={cn("flex flex-col", field.colSpan === 2 ? 'col-span-2' : '')}>
                <FormLabel className="text-foreground/80 font-medium pb-2 block">
                  {field.required && '*: '}{field.label}
                </FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => _fieldProps.onChange(star)}
                            className={cn(
                              "transition-all duration-300 focus:outline-none",
                              (_fieldProps.value || 0) >= star 
                                ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)] scale-110' 
                                : 'text-muted-foreground/15 hover:text-yellow-400/40 hover:scale-110'
                            )}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" step="0.1" min="0" max="10"
                          className="w-16 h-8 text-center font-black bg-white/60 border-transparent rounded-lg"
                          {..._fieldProps}
                          value={_fieldProps.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : Number(e.target.value);
                            _fieldProps.onChange(val);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">/ 10</span>
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
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
                <FormItem className={field.colSpan === 2 ? 'col-span-2' : ''}>
                  <FormLabel className="text-foreground/80 font-medium">
                    {field.required && '*: '}{field.label}
                  </FormLabel>
                  <FormControl>
                    <div className={cn("flex items-center gap-3 rounded-xl bg-muted/40 p-1.5 border border-transparent hover:border-primary/20 transition-all", isDisabled && "opacity-50 pointer-events-none")}>
                      <div className="flex flex-1 items-center gap-2 px-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" min="0" placeholder="0" 
                          className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0 text-right w-10 font-bold"
                          value={h || ''} 
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            _fieldProps.onChange(val * 60 + m);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Hrs</span>
                      </div>
                      <div className="h-4 w-[1px] bg-border/40" />
                      <div className="flex flex-1 items-center gap-2 px-2">
                        <Input 
                          type="number" min="0" max="59" placeholder="00"
                          className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0 text-right w-10 font-bold"
                          value={m || ''} 
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            _fieldProps.onChange(h * 60 + val);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Min</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );
      
      case 'date':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className={field.colSpan === 2 ? 'col-span-2' : ''}>
                <FormLabel className="text-foreground/80 font-medium">
                  {field.required && '*: '}{field.label}
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10" />
                    <Input 
                      type="date" 
                      className={cn(inputClass, "pl-10")} 
                      {..._fieldProps}
                      disabled={isDisabled}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'file':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => {
              const fileInputRef = useRef<HTMLInputElement>(null);
              const currentFile = files[field.name];

              return (
                <FormItem className="col-span-2">
                  <FormLabel className="text-foreground/80 font-medium font-bold">
                    {field.required && '*: '}{field.label}
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
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center",
                        currentFile ? 'border-primary/30 bg-primary/5' : 'border-border/60 hover:border-primary/50 bg-muted/40 hover:bg-muted/60'
                      )}
                    >
                      {!currentFile ? (
                        <>
                          <div className="p-4 rounded-full bg-background shadow-sm text-muted-foreground mb-4 group-hover:scale-110 group-hover:text-primary transition-all">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{field.placeholder || "Click or drag file here"}</h3>
                          <p className="text-xs text-muted-foreground">{field.description || "Upload a document"}</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                            <FileDescriptionIcon className="w-8 h-8" />
                          </div>
                          <div className="font-semibold">{currentFile.name}</div>
                          <div className="text-xs text-muted-foreground">{(currentFile.size / 1024).toFixed(1)} KB</div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
                            Replace File
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
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
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );

      case 'custom':
        return (
          <div key={field.name} className={field.colSpan === 2 ? 'col-span-2' : ''}>
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
        className={cn("flex flex-col h-full", className)}
      >
        <div className="flex-1 overflow-y-auto hide-scrollbar p-8 space-y-10">
          {sections.map((section, idx) => {
             const visibleFields = section.fields.filter(f => !f.visible || f.visible(values));
             if (visibleFields.length === 0) return null;
             
             return (
               <div key={idx} className="space-y-6">
                 <div>
                   <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 pb-3 border-b border-border/30">
                     {section.title}
                   </h3>
                   {section.description && (
                     <p className="mt-1.5 text-sm text-muted-foreground/60">{section.description}</p>
                   )}
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   {section.fields.map(renderField)}
                 </div>
                 {idx < sections.length - 1 && (
                   <div className="h-[1px] w-full bg-border/20 shrink-0 mt-10" />
                 )}
               </div>
             );
          })}
        </div>

        <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0 z-10">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} className="rounded-md px-6">
              Cancel
            </Button>
          )}
          <Button type="submit" size="lg" className="rounded-md shadow-sm px-8" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
