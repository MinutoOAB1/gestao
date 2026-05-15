/**
 * Utility for haptic feedback (vibration)
 * Primarily for mobile devices
 */
export const haptics = {
    /**
     * Subtle vibration for success or focus
     */
    light: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
    },

    /**
     * Standard vibration for confirmation
     */
    medium: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(25);
        }
    },

    /**
     * Heavy vibration for destructive actions
     */
    heavy: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    },

    /**
     * Double vibration for errors or warnings
     */
    error: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([30, 50, 30]);
        }
    }
};
