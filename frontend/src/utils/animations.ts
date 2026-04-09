/**
 * Centralized animation configurations for consistent, performant animations
 * across the entire application.
 */

// Optimized spring config for snappy, fluid animations
export const springConfig = {
    fast: { type: "spring" as const, stiffness: 400, damping: 30 },
    medium: { type: "spring" as const, stiffness: 300, damping: 25 },
    gentle: { type: "spring" as const, stiffness: 200, damping: 20 },
};

// Standard transition durations (in seconds)
export const durations = {
    fast: 0.15,
    medium: 0.25,
    slow: 0.35,
};

// Reusable animation variants
export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: springConfig.medium,
    },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: durations.medium },
    },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: springConfig.fast,
    },
};

// Container with staggered children - optimized for performance
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05, // Reduced from 0.1 for faster perceived loading
            delayChildren: 0.02,
        },
    },
};

// Item variants for use with staggerContainer
export const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: springConfig.fast,
    },
};

// Touch-friendly hover/tap animations
export const touchFeedback = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: springConfig.fast,
};

export const cardHover = {
    whileHover: { scale: 1.01, y: -2 },
    transition: springConfig.fast,
};

// Modal animations
export const modalOverlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

export const modalContent = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: springConfig.medium,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: durations.fast },
    },
};

// Mobile-specific modal (slide up from bottom)
export const modalContentMobile = {
    hidden: { opacity: 0, y: "100%" },
    visible: {
        opacity: 1,
        y: 0,
        transition: springConfig.medium,
    },
    exit: {
        opacity: 0,
        y: "100%",
        transition: { duration: durations.medium },
    },
};

// List item animations
export const listItem = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: springConfig.fast,
    },
};

// Page transition
export const pageTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.medium },
};
