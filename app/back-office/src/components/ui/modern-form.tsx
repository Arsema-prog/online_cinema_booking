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

  const inputClass = "w-full bg-surface-container-high border-transparent rounded-xl focus-visible:ring-2 focus-visible:ring-primary-container transition-all text-on-surface";
  const labelClass = "block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 transition-colors";

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
              <FormItem className={cn("group", field.colSpan === 2 ? 'col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  {field.required && '* '}{field.label}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    {field.icon && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors z-10 flex items-center">
                        {field.icon}
                      </div>
                    )}
                    <Input 
                      type={field.type}
                      step={field.step}
                      placeholder={field.placeholder} 
                      className={cn(inputClass, field.icon && "pl-11")} 
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
                {field.description && <FormDescription className="text-xs text-on-surface-variant/60">{field.description}</FormDescription>}
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
              <FormItem className="col-span-2 group">
                <FormLabel className={labelClass}>
                  {field.required && '* '}{field.label}
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={field.placeholder} 
                    className={cn(inputClass, "min-h-[140px] resize-none py-4 px-5 leading-relaxed")} 
                    {..._fieldProps}
                    disabled={isDisabled}
                  />
                </FormControl>
                {field.description && <FormDescription className="text-xs text-on-surface-variant/60">{field.description}</FormDescription>}
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
              <FormItem className={cn("group", field.colSpan === 2 ? 'col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  {field.required && '* '}{field.label}
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
                  <SelectContent>
                    {currentOptions && (currentOptions as FormOption[]).map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && <FormDescription className="text-xs text-on-surface-variant/60">{field.description}</FormDescription>}
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
              <FormItem className={cn("flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl", field.colSpan === 2 ? 'col-span-2' : '')}>
                <div>
                  <FormLabel className="text-sm font-bold text-on-surface block mb-1">{field.label}</FormLabel>
                  <FormDescription className="text-xs text-on-surface-variant">
                    {field.description || "Toggle this setting value"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={_fieldProps.value}
                    onCheckedChange={_fieldProps.onChange}
                    disabled={isDisabled}
                    className="data-[state=checked]:bg-primary-container"
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
                <FormItem className="col-span-2 group">
                  <FormLabel className={labelClass}>
                    {field.required && '* '}{field.label}
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
                          "relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-10 transition-colors flex flex-col items-center justify-center text-center",
                          (currentUrl || currentFile) ? 'border-primary-container/30 bg-primary-container/5' : 'border-outline-variant hover:border-primary-container hover:bg-surface-container-high bg-surface-container-lowest'
                        )}
                      >
                        {!(currentUrl || currentFile) && (
                          <>
                            <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary-container transition-colors mb-4">cloud_upload</span>
                            <h3 className="font-medium text-sm text-on-surface shrink-0 mb-1">
                              Drag image here or <span className="text-primary-container font-bold">browse files</span>
                            </h3>
                            <p className="text-[10px] text-on-surface-variant">Recommended size: 800x600px (JPG/PNG)</p>
                          </>
                        )}
                        
                        {(currentUrl || currentFile) && (
                          <div className="flex flex-col items-center gap-4">
                            <img
                              src={currentFile ? URL.createObjectURL(currentFile) : currentUrl}
                              alt="Preview"
                              className="h-32 object-contain rounded-xl shadow-lg border border-surface-container-highest"
                            />
                            <div className="flex items-center gap-2 text-xs font-bold text-primary-container bg-primary-container/10 px-4 py-2 rounded-lg hover:bg-primary-container/20 transition-colors">
                              <span className="material-symbols-outlined text-sm">image</span> Replace Media
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
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-on-surface-variant/60 text-[10px] uppercase font-bold tracking-widest">Alt URL</span>
                         </div>
                         <Input
                           placeholder="https://..."
                           className={cn(inputClass, "pl-[4.5rem]")}
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
              <FormItem className={cn("flex flex-col group", field.colSpan === 2 ? 'col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  {field.required && '* '}{field.label}
                </FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-4 rounded-xl border border-transparent bg-surface-container-high p-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => _fieldProps.onChange(star)}
                            className={cn(
                              "transition-all duration-300 outline-none flex items-center justify-center p-1",
                              (_fieldProps.value || 0) >= star 
                                ? 'text-secondary-fixed-dim drop-shadow-[0_0_8px_rgba(233,196,0,0.4)] scale-110' 
                                : 'text-on-surface-variant/30 hover:text-secondary-fixed-dim/40 hover:scale-110'
                            )}
                          >
                            <span className="material-symbols-outlined fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" step="0.1" min="0" max="10"
                          className="w-16 h-8 text-center font-black bg-surface-container-lowest py-0 px-0 rounded-lg text-sm"
                          {..._fieldProps}
                          value={_fieldProps.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : Number(e.target.value);
                            _fieldProps.onChange(val);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase">/ 10</span>
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
                <FormItem className={cn("group", field.colSpan === 2 ? 'col-span-2' : '')}>
                  <FormLabel className={labelClass}>
                    {field.required && '* '}{field.label}
                  </FormLabel>
                  <FormControl>
                    <div className={cn("flex items-center gap-3 rounded-xl bg-surface-container-high py-2 px-3 focus-within:ring-2 ring-primary-container transition-all", isDisabled && "opacity-50 pointer-events-none")}>
                      <div className="flex flex-1 items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant/50 ml-2 text-sm">schedule</span>
                        <Input 
                          type="number" min="0" placeholder="0" 
                          className="h-10 border-transparent bg-transparent rounded-none px-2 focus:ring-0 text-right w-14 font-black text-on-surface shadow-none"
                          value={h || ''} 
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            _fieldProps.onChange(val * 60 + m);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mr-2">Hrs</span>
                      </div>
                      <div className="h-6 w-[1px] bg-surface-container-highest" />
                      <div className="flex flex-1 items-center gap-2">
                        <Input 
                          type="number" min="0" max="59" placeholder="00"
                          className="h-10 border-transparent bg-transparent rounded-none px-2 focus:ring-0 text-right w-14 font-black text-on-surface shadow-none"
                          value={m || ''} 
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            _fieldProps.onChange(h * 60 + val);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mr-2">Min</span>
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
      case 'datetime-local':
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: _fieldProps }) => (
              <FormItem className={cn("group", field.colSpan === 2 ? 'col-span-2' : '')}>
                <FormLabel className={labelClass}>
                  {field.required && '* '}{field.label}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors pointer-events-none z-10 text-[1.1rem]">calendar_month</span>
                    <Input 
                      type={field.type} 
                      className={cn(inputClass, "pl-11")} 
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
                <FormItem className="col-span-2 group">
                  <FormLabel className={labelClass}>
                    {field.required && '* '}{field.label}
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
                        "relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-10 transition-colors flex flex-col items-center justify-center text-center",
                        currentFile ? 'border-primary-container/30 bg-primary-container/5' : 'border-outline-variant hover:border-primary-container hover:bg-surface-container-high bg-surface-container-lowest'
                      )}
                    >
                      {!currentFile ? (
                        <>
                          <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary-container transition-colors mb-4">cloud_upload</span>
                          <h3 className="font-medium text-sm text-on-surface shrink-0 mb-1">{field.placeholder || "Click or drag file here"}</h3>
                          <p className="text-[10px] text-on-surface-variant">{field.description || "Upload a document"}</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-on-surface">
                          <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                            <span className="material-symbols-outlined text-3xl">description</span>
                          </div>
                          <div className="font-bold text-sm tracking-tight">{currentFile.name}</div>
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{(currentFile.size / 1024).toFixed(1)} KB</div>
                          <div className="flex items-center gap-2 text-xs font-bold text-primary-container bg-primary-container/10 px-4 py-2 rounded-lg hover:bg-primary-container/20 transition-colors mt-2">
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
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6 lg:p-10 space-y-10">
          {sections.map((section, idx) => {
             const visibleFields = section.fields.filter(f => !f.visible || f.visible(values));
             if (visibleFields.length === 0) return null;
             
             return (
               <div key={idx} className="space-y-6">
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-tight text-on-surface mb-1">
                     {section.title}
                   </h3>
                   {section.description && (
                     <p className="text-xs text-on-surface-variant font-medium">{section.description}</p>
                   )}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                   {section.fields.map(renderField)}
                 </div>
                 {idx < sections.length - 1 && (
                   <div className="h-px w-full bg-surface-container-highest shrink-0 mt-10" />
                 )}
               </div>
             );
          })}
        </div>

        <div className="p-6 bg-surface-container-low border-t border-surface-container-highest/20 flex items-center justify-end gap-4 shrink-0 z-10 w-full">
           <div className="flex gap-4 w-full">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 font-bold py-4 h-auto rounded-xl">
                Cancel
              </Button>
            )}
            <Button type="submit" variant="default" className="flex-[2] font-bold py-4 h-auto rounded-xl flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              ) : null}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
