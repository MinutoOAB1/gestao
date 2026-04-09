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
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
                "surface-light": "#ffffff",
                "surface-dark": "#1e293b",
                "column-light": "#f0f2f4",
                "column-dark": "#1a2230",

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
                    DEFAULT: '#1E3A8A', // Executive Navy Blue (Blue-900)
                    dark: '#172554',    // Midnight Blue (Blue-950)
                    light: '#3B82F6',   // Highlighting Blue
                    glow: 'rgba(30, 58, 138, 0.3)',
                    gold: '#D4AF37',    // Champagne/Gold for premium accents
                },
                status: {
                    urgent: {
                        bg: 'rgba(225, 29, 72, 0.1)', // Rose-600
                        text: '#E11D48',
                        border: '#E11D48'
                    },
                    warning: {
                        bg: 'rgba(212, 175, 55, 0.1)', // Gold/Amber mix
                        text: '#D4AF37',
                        border: '#D4AF37'
                    },
                    success: {
                        bg: 'rgba(15, 118, 110, 0.1)', // Teal-700 (More formal green)
                        text: '#0F766E',
                        border: '#0F766E'
                    },
                    info: {
                        bg: 'rgba(51, 65, 85, 0.1)', // Slate-700 (Very sober blue/gray)
                        text: '#334155',
                        border: '#334155'
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
