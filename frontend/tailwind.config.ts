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
        // True black color scheme for classy dark aesthetic
        background: '#000000',
        'background-secondary': '#0a0a0a',
        'background-elevated': '#141414',
        foreground: '#fafafa',
        'foreground-muted': '#a3a3a3',
        card: '#0a0a0a',
        'card-foreground': '#fafafa',
        'card-border': '#262626',
        'card-hover': '#171717',
        primary: '#86EFAC',
        'primary-foreground': '#000000',
        secondary: '#f472b6',
        'secondary-foreground': '#000000',
        accent: '#fef08a',
        'accent-foreground': '#000000',
        muted: '#171717',
        'muted-foreground': '#a3a3a3',
        border: '#262626',
        'border-strong': '#fafafa',
        input: '#0a0a0a',
        'input-border': '#262626',
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
