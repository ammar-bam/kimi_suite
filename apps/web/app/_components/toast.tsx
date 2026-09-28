"use client";

import { useState, useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose?: () => void;
};

export function Toast({ message, type = "info", onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!visible) return null;

  const bgColors: Record<string, string> = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200"
  };

  const textColors: Record<string, string> = {
    success: "text-green-800",
    error: "text-red-800",
    warning: "text-yellow-800",
    info: "text-blue-800"
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-xs p-4 rounded-xl shadow-lg
      ${bgColors[type]} ${textColors[type]} flex items-center gap-3
      animate-slide-in fade-out-3000`}
    >
      <div className="flex-shrink-0">
        {type === "success" && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        )}
        {type === "error" && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2v-2zm-1 9a1 1 0 10-2 0v2H8a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2v-2z" clipRule="evenodd"/>
          </svg>
        )}
        {type === "warning" && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M8.257 3.099a.75.75 0 00-1.08.22l-4.5 10.5a.75.75 0 001.12 1.06l4.5-10.5a.75.75 0 00-.04-1.28z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
        )}
        {type === "info" && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
        )}
      </div>
      <div className="flex-1">{message}</div>
      <button
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414l-1.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </button>
    </div>
  );
}

// Toast container
export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{id: string; message: string; type: ToastProps["type"]}>>([]);

  const addToast = (message: string, type: ToastProps["type"] = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after delay
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="pointer-events-none">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Custom hook for using toast
export function useToast() {
  const [toasts, setToasts] = useState<Array<{id: string; message: string; type: ToastProps["type"]}>>([]);

  const addToast = (message: string, type: ToastProps["type"] = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after delay
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return { addToast };
}