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
                    DEFAULT: '#000000', // Sophisticated Black
                    dark: '#000000',
                    light: '#404040',
                    glow: 'rgba(0, 0, 0, 0.1)',
                    gold: '#D4D4D4',    // Platinum/Silver accent
                },
                status: {
                    urgent: {
                        bg: 'rgba(0, 0, 0, 0.05)',
                        text: '#000000',
                        border: '#000000'
                    },
                    warning: {
                        bg: 'rgba(64, 64, 64, 0.05)',
                        text: '#404040',
                        border: '#404040'
                    },
                    success: {
                        bg: 'rgba(0, 0, 0, 0.05)',
                        text: '#000000',
                        border: '#000000'
                    },
                    info: {
                        bg: 'rgba(115, 115, 115, 0.05)',
                        text: '#737373',
                        border: '#737373'
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
