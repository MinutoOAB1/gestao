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
            <div className={`${currentSize.box} flex items-center justify-center shrink-0 overflow-hidden bg-app-text-main`}>
                <Scale 
                    size={currentSize.icon} 
                    className="text-app-bg" 
                />
            </div>
            <div className={`flex items-baseline tracking-tight font-bold leading-none ${currentSize.text}`}>
                <span className={isDarkBg ? 'text-white' : 'text-app-text-main'}>Adv</span>
                <span className={isDarkBg ? 'text-white/70' : 'text-app-text-muted'}>us</span>
            </div>
        </div>
    );
}
