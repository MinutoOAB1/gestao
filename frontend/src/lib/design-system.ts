/**
 * Design System - Blue Adv
 * 
 * Central design tokens for the application.
 * Import this file instead of hardcoding values.
 */

// ============================================
// COLORS
// ============================================

export const colors = {
    // Primary Brand
    primary: {
        DEFAULT: '#2563EB',
        dark: '#1D4ED8',
        light: '#60A5FA',
        glow: 'rgba(37, 99, 235, 0.5)',
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

    // Status Colors
    status: {
        success: {
            bg: 'rgba(34, 197, 94, 0.1)',
            text: '#22C55E',
            border: '#22C55E',
        },
        warning: {
            bg: 'rgba(234, 179, 8, 0.1)',
            text: '#EAB308',
            border: '#EAB308',
        },
        danger: {
            bg: 'rgba(239, 68, 68, 0.1)',
            text: '#EF4444',
            border: '#EF4444',
        },
        info: {
            bg: 'rgba(59, 130, 246, 0.1)',
            text: '#3B82F6',
            border: '#3B82F6',
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
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
    fontFamily: {
        sans: '"Plus Jakarta Sans", sans-serif',
        body: '"Inter", sans-serif',
    },
    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
} as const;

// ============================================
// BORDERS & RADIUS
// ============================================

export const borders = {
    radius: {
        sm: '0.375rem',  // 6px
        md: '0.5rem',    // 8px
        lg: '0.75rem',   // 12px
        xl: '1rem',      // 16px
        '2xl': '1.5rem', // 24px
        full: '9999px',
    },
    width: {
        DEFAULT: '1px',
        2: '2px',
    },
} as const;

// ============================================
// SHADOWS
// ============================================

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px -5px var(--tw-shadow-color)',
} as const;

// ============================================
// ANIMATIONS
// ============================================

export const animations = {
    duration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
    },
    easing: {
        DEFAULT: 'ease-out',
        in: 'ease-in',
        inOut: 'ease-in-out',
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
        sm: { height: '2rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem' },
        md: { height: '2.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' },
        lg: { height: '3rem', padding: '0.75rem 1.5rem', fontSize: '1rem' },
    },
    input: {
        sm: { height: '2rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem' },
        md: { height: '2.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' },
        lg: { height: '3rem', padding: '0.75rem 1rem', fontSize: '1rem' },
    },
    avatar: {
        sm: '2rem',    // 32px
        md: '2.5rem',  // 40px
        lg: '3rem',    // 48px
        xl: '4rem',    // 64px
    },
} as const;
