import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      
      let message = 'Notification';
      let type: ToastType = 'success'; // default matches existing uses

      if (typeof detail === 'string') {
        message = detail;
      } else if (typeof detail === 'object' && detail !== null) {
        message = detail.message || message;
        type = detail.type || type;
      }

      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('toast', handleToastEvent);
    return () => window.removeEventListener('toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-0 right-0 z-[100] p-4 sm:p-6 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto rounded-2xl shadow-xl border overflow-hidden flex items-stretch 
              ${toast.type === 'success' ? 'bg-green-50 border-green-200' : ''}
              ${toast.type === 'error' ? 'bg-red-50 border-red-200' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 border-blue-200' : ''}
              ${toast.type === 'warning' ? 'bg-orange-50 border-orange-200' : ''}
            `}
          >
            <div className={`p-4 flex items-center justify-center
              ${toast.type === 'success' ? 'bg-green-100 text-green-600' : ''}
              ${toast.type === 'error' ? 'bg-red-100 text-red-600' : ''}
              ${toast.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
              ${toast.type === 'warning' ? 'bg-orange-100 text-orange-600' : ''}
            `}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 py-3 px-4 flex items-center">
              <p className={`text-sm font-semibold 
                ${toast.type === 'success' ? 'text-green-800' : ''}
                ${toast.type === 'error' ? 'text-red-800' : ''}
                ${toast.type === 'info' ? 'text-blue-800' : ''}
                ${toast.type === 'warning' ? 'text-orange-800' : ''}
              `}>
                {toast.message}
              </p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className={`p-3 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center
                ${toast.type === 'success' ? 'text-green-800 hover:bg-green-100' : ''}
                ${toast.type === 'error' ? 'text-red-800 hover:bg-red-100' : ''}
                ${toast.type === 'info' ? 'text-blue-800 hover:bg-blue-100' : ''}
                ${toast.type === 'warning' ? 'text-orange-800 hover:bg-orange-100' : ''}
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
