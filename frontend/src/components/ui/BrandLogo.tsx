import { memo } from 'react';

interface BrandLogoProps {
    className?: string;
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export const BrandLogo = memo(({ className = '', variant = 'dark', size = 'md', showText = true }: BrandLogoProps) => {
    const isDarkBg = variant === 'light';

    // Size variants mapping
    const sizes = {
        sm: { img: 'h-6', text: 'text-lg', gap: 'gap-2' },
        md: { img: 'h-8', text: 'text-2xl', gap: 'gap-3' },
        lg: { img: 'h-12', text: 'text-3xl', gap: 'gap-4' },
        xl: { img: 'h-16', text: 'text-4xl', gap: 'gap-5' }
    };

    const current = sizes[size];

    return (
        <div className={`flex items-center ${current.gap} select-none group ${className}`}>
            <img 
                src="/Logo-PWA.png" 
                alt="Advus Icon" 
                className={`${current.img} w-auto object-contain rounded-lg shadow-sm transition-transform duration-500 group-hover:scale-105`}
                draggable={false}
            />
            
            {showText && (
                <div className={`flex items-baseline tracking-[-0.05em] font-black leading-none ${current.text}`}>
                    <span className={isDarkBg ? 'text-white' : 'text-slate-900'}>ADV</span>
                    <span className={isDarkBg ? 'text-white/60' : 'text-slate-400'}>US</span>
                </div>
            )}
        </div>
    );
});

