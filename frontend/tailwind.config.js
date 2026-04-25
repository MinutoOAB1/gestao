/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                body: ['"Inter"', 'sans-serif'],
            },
            colors: {
                // Custom Kanban Palette
                "background-light": "#F8F8F8",
                "background-dark": "#000000",
                "surface-light": "#FFFFFF",
                "surface-dark": "#0D0D0D",
                "column-light": "#F2F2F2",
                "column-dark": "#141414",

                // Detailed App Palette
                app: {
                    bg: 'var(--app-bg)',
                    card: 'var(--app-card)',
                    input: 'var(--app-input)',
                    stroke: 'var(--app-stroke)',
                    text: {
                        main: 'var(--app-text-main)',
                        muted: 'var(--app-text-muted)',
                        label: 'var(--app-text-label)',
                    }
                },
                primary: {
                    DEFAULT: '#4F73F5', 
                    dark: '#3730A3',
                    light: '#6366F1',
                    glow: 'rgba(79, 115, 245, 0.2)',
                    accent: '#6B5CE7',
                },
                status: {
                    urgent: {
                        bg: 'rgba(239, 68, 68, 0.05)',
                        text: '#EF4444',
                        border: '#EF4444'
                    },
                    warning: {
                        bg: 'rgba(245, 158, 11, 0.05)',
                        text: '#F59E0B',
                        border: '#F59E0B'
                    },
                    success: {
                        bg: 'rgba(16, 185, 129, 0.05)',
                        text: '#10B981',
                        border: '#10B981'
                    },
                    info: {
                        bg: 'rgba(79, 115, 245, 0.05)',
                        text: '#4F73F5',
                        border: '#4F73F5'
                    }
                }
            },
            boxShadow: {
                'glow': '0 0 20px -5px var(--tw-shadow-color)',
                'nav': '0 -4px 20px rgba(0,0,0,0.2)',
            }
        },
    },
    plugins: [],
}
