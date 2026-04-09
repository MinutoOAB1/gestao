import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: (event?: React.MouseEvent) => void;
    setTheme: (theme: Theme, event?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

// Calculate the maximum distance from a point to any corner of the screen
function getMaxRadius(x: number, y: number): number {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return Math.hypot(
        Math.max(x, w - x),
        Math.max(y, h - y)
    );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as Theme) || 'dark';
    });

    // Apply theme with wave transition effect
    const applyThemeWithWave = useCallback(async (newTheme: Theme, event?: React.MouseEvent) => {
        const root = document.documentElement;

        // Get position from event or default to center
        const x = event?.clientX ?? window.innerWidth / 2;
        const y = event?.clientY ?? window.innerHeight / 2;
        const maxRadius = getMaxRadius(x, y);

        // Check if View Transitions API is supported
        if (document.startViewTransition) {
            // Use View Transitions API for smooth wave effect
            const transition = document.startViewTransition(() => {
                if (newTheme === 'light') {
                    root.classList.add('light');
                    root.classList.remove('dark');
                } else {
                    root.classList.add('dark');
                    root.classList.remove('light');
                }
            });

            // Apply the circular clip-path animation
            transition.ready.then(() => {
                const clipPath = [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${maxRadius}px at ${x}px ${y}px)`
                ];

                // Animate the new view with expanding circle
                document.documentElement.animate(
                    { clipPath: newTheme === 'dark' ? clipPath : clipPath },
                    {
                        duration: 500,
                        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        pseudoElement: '::view-transition-new(root)',
                    }
                );
            });
        } else {
            // Fallback: Use CSS overlay for wave effect
            const overlay = document.createElement('div');
            overlay.className = 'theme-wave-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 99999;
                pointer-events: none;
                background-color: ${newTheme === 'dark' ? '#0f1419' : '#ffffff'};
                clip-path: circle(0px at ${x}px ${y}px);
            `;

            document.body.appendChild(overlay);

            // Animate the overlay
            overlay.animate(
                [
                    { clipPath: `circle(0px at ${x}px ${y}px)` },
                    { clipPath: `circle(${maxRadius}px at ${x}px ${y}px)` }
                ],
                {
                    duration: 500,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    fill: 'forwards'
                }
            ).onfinish = () => {
                // Apply theme after animation
                if (newTheme === 'light') {
                    root.classList.add('light');
                    root.classList.remove('dark');
                } else {
                    root.classList.add('dark');
                    root.classList.remove('light');
                }
                // Remove overlay
                setTimeout(() => overlay.remove(), 50);
            };
        }
    }, []);

    // Initial theme application (without animation)
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
            root.classList.remove('light');
        }
    }, []);

    // Save theme to localStorage
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback((event?: React.MouseEvent) => {
        setThemeState(prev => {
            const newTheme = prev === 'dark' ? 'light' : 'dark';
            applyThemeWithWave(newTheme, event);
            return newTheme;
        });
    }, [applyThemeWithWave]);

    const setTheme = useCallback((newTheme: Theme, event?: React.MouseEvent) => {
        applyThemeWithWave(newTheme, event);
        setThemeState(newTheme);
    }, [applyThemeWithWave]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
