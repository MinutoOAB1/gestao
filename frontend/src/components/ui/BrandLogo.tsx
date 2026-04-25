import { Scale } from 'lucide-react';

interface BrandLogoProps {
    className?: string;
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ className = '', variant = 'dark', size = 'md' }: BrandLogoProps) {
    const isDarkBg = variant === 'light';

    // Size variants
    const sizes = {
        sm: { box: 'w-6 h-6 rounded-md', icon: 14, text: 'text-lg' },
        md: { box: 'w-8 h-8 rounded-lg', icon: 18, text: 'text-xl' },
        lg: { box: 'w-10 h-10 rounded-xl', icon: 22, text: 'text-2xl' }
    };

    const currentSize = sizes[size];

    return (
        <div className={`flex items-center gap-2.5 font-sans select-none ${className}`}>
            <div className={`${currentSize.box} flex items-center justify-center shrink-0 overflow-hidden bg-blue-600 shadow-lg shadow-blue-600/20`}>
                <Scale 
                    size={currentSize.icon} 
                    className="text-white" 
                />
            </div>
            <div className={`flex items-baseline tracking-tighter font-black leading-none ${size === 'sm' ? "text-lg" : size === 'md' ? "text-2xl" : "text-3xl"}`}>
                <span className={isDarkBg ? 'text-blue-400' : 'text-blue-600'}>ADV</span>
                <span className={isDarkBg ? 'text-white' : 'text-slate-800'}>US</span>
            </div>
        </div>
    );
}
