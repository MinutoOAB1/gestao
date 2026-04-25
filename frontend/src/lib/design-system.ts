/**
 * Design System - Advus
 * 
 * Central design tokens for the application.
 * Import this file instead of hardcoding values.
 */

// ============================================
// COLORS
// ============================================

export const colors = {
    // Primary Brand - Premium Deep Indigo
    primary: {
        DEFAULT: '#312E81',
        dark: '#1E1B4B',
        light: '#4338CA',
        glow: 'rgba(49, 46, 129, 0.4)',
    },

    // Accent Brand - Refined Gold
    accent: {
        DEFAULT: '#D4AF37',
        dark: '#B8860B',
        light: '#F4D03F',
        glow: 'rgba(212, 175, 55, 0.3)',
    },

    // App Theme (CSS Variables)
    app: {
        bg: 'var(--app-bg)',
        card: 'var(--app-card)',
        input: 'var(--app-input)',
        stroke: 'var(--app-stroke)',
        text: {
            main: 'var(--app-text-main)',
            muted: 'var(--app-text-muted)',
            label: 'var(--app-text-label)',
        },
    },

    // Status Colors - Sophisticated Tones
    status: {
        success: {
            bg: 'rgba(5, 150, 105, 0.08)',
            text: '#059669',
            border: 'rgba(5, 150, 105, 0.2)',
        },
        warning: {
            bg: 'rgba(217, 119, 6, 0.08)',
            text: '#D97706',
            border: 'rgba(217, 119, 6, 0.2)',
        },
        danger: {
            bg: 'rgba(220, 38, 38, 0.08)',
            text: '#DC2626',
            border: 'rgba(220, 38, 38, 0.2)',
        },
        info: {
            bg: 'rgba(37, 99, 235, 0.08)',
            text: '#2563EB',
            border: 'rgba(37, 99, 235, 0.2)',
        },
    },
} as const;

// ============================================
// SPACING
// ============================================

export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
    fontFamily: {
        display: '"Plus Jakarta Sans", sans-serif',
        body: '"Inter", sans-serif',
        serif: '"Cormorant Garamond", serif', // Added for that classic legal touch
    },
    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '2rem',    // 32px
        '4xl': '2.5rem',  // 40px
    },
    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        black: 800,
    },
} as const;

// ============================================
// BORDERS & RADIUS - More rounded for modern premium feel
// ============================================

export const borders = {
    radius: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '2rem',
        full: '9999px',
    },
    width: {
        DEFAULT: '1px',
        2: '2px',
        3: '3px',
    },
} as const;

// ============================================
// SHADOWS - Layered shadows for depth
// ============================================

export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px -5px var(--tw-shadow-color)',
    premium: '0 0 40px -10px rgba(49, 46, 129, 0.2)',
} as const;

// ============================================
// ANIMATIONS
// ============================================

export const animations = {
    duration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
        gentle: '600ms',
    },
    easing: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
} as const;

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
    dropdown: 50,
    modal: 100,
    popover: 150,
    tooltip: 200,
    toast: 250,
} as const;

// ============================================
// COMPONENT SIZES
// ============================================

export const componentSizes = {
    button: {
        sm: { height: '2.25rem', padding: '0 1rem', fontSize: '0.8125rem' },
        md: { height: '2.75rem', padding: '0 1.5rem', fontSize: '0.875rem' },
        lg: { height: '3.25rem', padding: '0 2rem', fontSize: '1rem' },
    },
    input: {
        sm: { height: '2.25rem', padding: '0 0.875rem' },
        md: { height: '2.75rem', padding: '0 1rem' },
        lg: { height: '3.25rem', padding: '0 1.25rem' },
    },
    avatar: {
        xs: '1.5rem',
        sm: '2rem',
        md: '2.5rem',
        lg: '3.5rem',
        xl: '5rem',
    },
} as const;

