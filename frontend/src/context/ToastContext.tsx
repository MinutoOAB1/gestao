import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextData {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const TOAST_ICONS = {
    success: <CheckCircle2 size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
};

const TOAST_STYLES = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = generateId();
        setMessages((msgs) => [...msgs, { id, message, type }]);

        setTimeout(() => {
            setMessages((msgs) => msgs.filter((msg) => msg.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setMessages((msgs) => msgs.filter((msg) => msg.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {messages.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={clsx(
                                "pointer-events-auto flex items-start gap-3 w-80 p-3 rounded-xl border backdrop-blur-md shadow-xl",
                                "bg-app-card/90 border-app-stroke"
                            )}
                        >
                            <div className={clsx("p-1.5 rounded-lg shrink-0", TOAST_STYLES[toast.type].split(' ')[1])}>
                                {TOAST_ICONS[toast.type]}
                            </div>
                            <div className="flex-1 mt-0.5 min-w-0">
                                <p className="text-sm font-medium text-app-text-main pr-2 break-words">
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 p-1 rounded-md text-app-text-muted hover:bg-app-stroke/30 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
