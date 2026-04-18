import * as React from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type Toast = ToastOptions & {
  id: string;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const variantClasses: Record<ToastVariant, string> = {
  success:
    'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-300',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  warning:
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, variant: 'info', ...options }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(100%,22rem)] flex-col gap-3 sm:right-6">
        {toasts.map(({ id, title, description, variant }) => (
          <div
            key={id}
            className={
              `pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-150 ` +
              variantClasses[variant ?? 'info']
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{title}</p>
                {description ? (
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="ml-2 rounded-full border border-transparent bg-white/10 px-2 py-1 text-xs text-foreground transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
