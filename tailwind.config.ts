import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          sidebar: 'var(--bg-sidebar)',
          canvas: 'var(--bg-canvas)',
          card: 'var(--bg-card)',
          border: 'var(--border-subtle)',
          highlight: 'var(--border-highlight)',
          hover: 'var(--bg-hover)',
          active: 'var(--bg-active)'
        },
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)'
        }
      },
      fontFamily: {
        editorial: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'card-light': '0 1px 3px rgba(28, 27, 24, 0.04), 0 1px 1px rgba(28, 27, 24, 0.02)',
        'card-lift': '0 10px 25px -5px rgba(28, 27, 24, 0.08), 0 8px 10px -6px rgba(28, 27, 24, 0.04)',
        'keycap': '0 3px 0 var(--border-subtle), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'keycap-pressed': '0 1px 0 var(--border-subtle), 0 1px 2px rgba(0, 0, 0, 0.1)'
      }
    }
  },
  plugins: []
} satisfies Config
