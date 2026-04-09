import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { springConfig, durations } from '../../utils/animations';
import { clsx } from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Optimized animation variants
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

// Desktop: scale + fade, Mobile: slide up
const contentVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: springConfig.medium,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: durations.fast },
    },
};

const mobileContentVariants = {
    hidden: { opacity: 0, y: "100%" },
    visible: {
        opacity: 1,
        y: 0,
        transition: springConfig.medium,
    },
    exit: {
        opacity: 0,
        y: "50%",
        transition: { duration: durations.medium },
    },
};

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]'
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'lg' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop - optimized blur */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: durations.fast }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] touch-manipulation"
                    />

                    {/* Mobile Content - slides up from bottom, full width */}
                    <motion.div
                        variants={mobileContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="sm:hidden relative w-full bg-app-card border-t border-app-stroke rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col will-animate"
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-app-stroke rounded-full" />
                        </div>

                        {title && (
                            <div className="flex justify-between items-center px-5 py-3 border-b border-app-stroke">
                                <h3 className="text-lg font-bold text-app-text-main">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 text-app-text-muted hover:text-app-text-main transition-colors touch-manipulation no-tap-highlight"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        )}

                        {!title && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-app-text-muted hover:text-app-text-main transition-colors touch-manipulation no-tap-highlight z-10"
                            >
                                <X size={22} />
                            </button>
                        )}

                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {children}
                        </div>

                        {footer && (
                            <div className="p-4 border-t border-app-stroke bg-app-bg/50 flex justify-end gap-3 pb-safe">
                                {footer}
                            </div>
                        )}
                    </motion.div>

                    {/* Desktop Content - centered with scale animation */}
                    <motion.div
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={clsx(
                            "hidden sm:block relative w-full bg-app-card border border-app-stroke rounded-2xl shadow-2xl overflow-hidden will-animate",
                            sizeClasses[size]
                        )}
                    >
                        {title && (
                            <div className="flex justify-between items-center p-5 border-b border-app-stroke">
                                <h3 className="text-lg font-bold text-app-text-main">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-1 text-app-text-muted hover:text-app-text-main transition-fast"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {!title && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-app-text-muted hover:text-app-text-main transition-fast z-10"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>

                        {footer && (
                            <div className="p-4 border-t border-app-stroke bg-app-bg/50 flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
