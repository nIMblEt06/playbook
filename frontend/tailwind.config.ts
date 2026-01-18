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
        // Converted from oklch to hex for html2canvas compatibility
        background: '#0f0f0f',
        'background-secondary': '#1a1a1a',
        'background-elevated': '#262626',
        foreground: '#fafafa',
        'foreground-muted': '#737373',
        card: '#1a1a1a',
        'card-foreground': '#fafafa',
        'card-border': '#404040',
        'card-hover': '#2a2a2a',
        primary: '#86EFAC',
        'primary-foreground': '#0f0f0f',
        secondary: '#f472b6',
        'secondary-foreground': '#0f0f0f',
        accent: '#fef08a',
        'accent-foreground': '#0f0f0f',
        muted: '#2e2e2e',
        'muted-foreground': '#6b6b6b',
        border: '#404040',
        'border-strong': '#fafafa',
        input: '#1f1f1f',
        'input-border': '#4a4a4a',
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
        primary: '4px 4px 0px 0px #86EFAC',
        secondary: '4px 4px 0px 0px #f472b6',
        accent: '4px 4px 0px 0px #fef08a',
      },
    },
  },
  plugins: [],
}

export default config
