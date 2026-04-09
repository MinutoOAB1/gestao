import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    (
        {
            children,
            variant = 'default',
            size = 'md',
            dot = false,
            className,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center font-medium rounded-full';

        const variants = {
            default: 'bg-app-stroke/50 text-app-text-muted',
            success: 'bg-green-500/10 text-green-500 border border-green-500/30',
            warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/30',
            danger: 'bg-red-500/10 text-red-500 border border-red-500/30',
            info: 'bg-blue-500/10 text-blue-500 border border-blue-500/30',
            primary: 'bg-primary/10 text-primary border border-primary/30',
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-[10px]',
            md: 'px-2.5 py-0.5 text-xs',
            lg: 'px-3 py-1 text-sm',
        };

        const dotColors = {
            default: 'bg-app-text-muted',
            success: 'bg-green-500',
            warning: 'bg-amber-500',
            danger: 'bg-red-500',
            info: 'bg-blue-500',
            primary: 'bg-primary',
        };

        return (
            <span
                ref={ref}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {dot && (
                    <span className={clsx(
                        'w-1.5 h-1.5 rounded-full mr-1.5',
                        dotColors[variant]
                    )} />
                )}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
