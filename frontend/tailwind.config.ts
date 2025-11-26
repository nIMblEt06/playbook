import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(0.08 0 0)',
        'background-secondary': 'oklch(0.12 0 0)',
        'background-elevated': 'oklch(0.16 0 0)',
        foreground: 'oklch(0.98 0 0)',
        'foreground-muted': 'oklch(0.55 0 0)',
        card: 'oklch(0.12 0 0)',
        'card-foreground': 'oklch(0.98 0 0)',
        'card-border': 'oklch(0.28 0 0)',
        'card-hover': 'oklch(0.18 0 0)',
        primary: 'oklch(0.85 0.18 160)',
        'primary-foreground': 'oklch(0.08 0 0)',
        secondary: 'oklch(0.72 0.22 340)',
        'secondary-foreground': 'oklch(0.08 0 0)',
        accent: 'oklch(0.95 0.05 110)',
        'accent-foreground': 'oklch(0.08 0 0)',
        muted: 'oklch(0.20 0 0)',
        'muted-foreground': 'oklch(0.50 0 0)',
        border: 'oklch(0.30 0 0)',
        'border-strong': 'oklch(0.98 0 0)',
        input: 'oklch(0.14 0 0)',
        'input-border': 'oklch(0.35 0 0)',
      },
      fontFamily: {
        sans: ['var(--font-space-mono)', 'monospace'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      borderRadius: {
        none: '0px',
      },
      boxShadow: {
        '2xs': '4px 4px 0px 0px hsl(0 0% 0% / 0.50)',
        xs: '4px 4px 0px 0px hsl(0 0% 0% / 0.50)',
        sm: '4px 4px 0px 0px hsl(0 0% 0% / 1.00)',
        DEFAULT: '4px 4px 0px 0px hsl(0 0% 0% / 1.00)',
        md: '6px 6px 0px 0px hsl(0 0% 0% / 1.00)',
        lg: '8px 8px 0px 0px hsl(0 0% 0% / 1.00)',
        primary: '4px 4px 0px 0px oklch(0.85 0.18 160)',
        secondary: '4px 4px 0px 0px oklch(0.72 0.22 340)',
        accent: '4px 4px 0px 0px oklch(0.95 0.05 110)',
      },
    },
  },
  plugins: [],
}

export default config
