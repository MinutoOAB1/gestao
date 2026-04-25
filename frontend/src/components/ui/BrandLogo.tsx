import { Scale, Sparkles } from 'lucide-react';
import { colors } from '../../lib/design-system';

interface BrandLogoProps {
    className?: string;
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export function BrandLogo({ className = '', variant = 'dark', size = 'md', showText = true }: BrandLogoProps) {
    const isDarkBg = variant === 'light';

    // Size variants
    const sizes = {
        sm: { box: 'w-7 h-7 rounded-lg', icon: 14, text: 'text-lg', gap: 'gap-2' },
        md: { box: 'w-10 h-10 rounded-xl', icon: 20, text: 'text-2xl', gap: 'gap-3' },
        lg: { box: 'w-12 h-12 rounded-2xl', icon: 24, text: 'text-3xl', gap: 'gap-4' },
        xl: { box: 'w-16 h-16 rounded-[1.25rem]', icon: 32, text: 'text-4xl', gap: 'gap-5' }
    };

    const currentSize = sizes[size];

    return (
        <div className={`flex items-center ${currentSize.gap} font-display select-none group ${className}`}>
            <div className={`relative ${currentSize.box} flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br from-primary via-accent to-primary-dark shadow-xl shadow-primary/20 border border-white/10 group-hover:scale-105 transition-transform duration-500`}>
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
                <div className="absolute -right-1 -top-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Sparkles size={currentSize.icon / 2} className="text-accent" />
                </div>
                
                <Scale 
                    size={currentSize.icon} 
                    className="text-white relative z-10 drop-shadow-md" 
                />
            </div>
            
            {showText && (
                <div className={`flex items-baseline tracking-[-0.05em] font-black leading-none ${currentSize.text}`}>
                    <span className={isDarkBg ? 'text-accent' : 'text-primary'}>ADV</span>
                    <span className={isDarkBg ? 'text-white' : 'text-slate-900'}>US</span>
                </div>
            )}
        </div>
    );
}

