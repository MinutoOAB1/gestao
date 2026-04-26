import { memo } from 'react';

interface BrandLogoProps {
    className?: string;
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export const BrandLogo = memo(({ className = '', size = 'md' }: BrandLogoProps) => {
    // Size variants mapping for height
    const sizes = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-12',
        xl: 'h-16'
    };

    const currentHeight = sizes[size];

    return (
        <div className={`flex items-center select-none ${className}`}>
            <img 
                src="/Advus.png" 
                alt="Advus" 
                className={`${currentHeight} w-auto object-contain transition-transform duration-500 hover:scale-105`}
                draggable={false}
            />
        </div>
    );
});

