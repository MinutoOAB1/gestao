import { FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    className?: string;
}

export default function EmptyState({
    icon: Icon = FileText,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={clsx("py-12 flex flex-col items-center justify-center text-center", className)}>
            <div className="w-20 h-20 mb-6 rounded-full bg-app-bg border-4 border-app-stroke border-dashed flex items-center justify-center relative">
                <Icon size={32} className="text-app-text-muted absolute" />
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping opacity-20" />
            </div>
            
            <h3 className="text-xl font-bold text-app-text-main mb-2">{title}</h3>
            <p className="text-sm text-app-text-muted max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            
            {action && (
                <button 
                    onClick={action.onClick}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-white border border-primary/20 transition-all active:scale-95"
                >
                    {action.icon && (() => { const ActionIcon = action.icon; return <ActionIcon size={18} />; })()}
                    {action.label}
                </button>
            )}
        </div>
    );
}
