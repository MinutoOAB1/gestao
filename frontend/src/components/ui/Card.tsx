import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered' | 'ghost';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    clickable?: boolean;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            children,
            variant = 'default',
            padding = 'md',
            clickable = false,
            header,
            footer,
            className,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'rounded-2xl transition-all duration-200';

        const variants = {
            default: 'bg-app-card border border-app-stroke',
            elevated: 'bg-app-card shadow-lg',
            bordered: 'bg-transparent border-2 border-app-stroke',
            ghost: 'bg-transparent',
        };

        const paddings = {
            none: '',
            sm: 'p-3',
            md: 'p-5',
            lg: 'p-6',
        };

        const clickableStyles = clickable
            ? 'cursor-pointer hover:border-primary/50 hover:shadow-md active:scale-[0.99]'
            : '';

        return (
            <div
                ref={ref}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    clickableStyles,
                    className
                )}
                {...props}
            >
                {header && (
                    <div className={clsx(
                        'border-b border-app-stroke',
                        paddings[padding]
                    )}>
                        {header}
                    </div>
                )}
                <div className={paddings[padding]}>
                    {children}
                </div>
                {footer && (
                    <div className={clsx(
                        'border-t border-app-stroke',
                        paddings[padding]
                    )}>
                        {footer}
                    </div>
                )}
            </div>
        );
    }
);

Card.displayName = 'Card';

export { Card };
