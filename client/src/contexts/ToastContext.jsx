import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message, options = {}) => {
    const { type = 'info', duration = 3000 } = options;
    const id = ++idSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'flex items-start gap-3 rounded-lg shadow-lg px-4 py-3 text-sm text-white',
            t.type === 'success' && 'bg-emerald-600',
            t.type === 'error' && 'bg-red-600',
            t.type === 'warning' && 'bg-amber-600',
            t.type === 'info' && 'bg-gray-800',
          ].filter(Boolean).join(' ')}
        >
          <span className="flex-1">{t.message}</span>
          <button
            className="opacity-80 hover:opacity-100"
            onClick={() => onClose(t.id)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
