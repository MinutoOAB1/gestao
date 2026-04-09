import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    selectSize?: 'sm' | 'md' | 'lg';
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            helperText,
            options,
            placeholder,
            selectSize = 'md',
            className,
            id,
            ...props
        },
        ref
    ) => {
        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

        const baseStyles = 'w-full bg-app-input border rounded-xl text-app-text-main transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer';

        const sizes = {
            sm: 'h-8 px-3 pr-8 text-xs',
            md: 'h-10 px-4 pr-10 text-sm',
            lg: 'h-12 px-4 pr-10 text-base',
        };

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-app-text-main mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={clsx(
                            baseStyles,
                            error ? 'border-red-500' : 'border-app-stroke',
                            sizes[selectSize],
                            className
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none"
                        size={selectSize === 'sm' ? 14 : 18}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-red-500">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-xs text-app-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export { Select };
