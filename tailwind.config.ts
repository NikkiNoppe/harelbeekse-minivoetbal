import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'transparent',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Updated purple theme colors with exact RGB values
				purple: {
					dark: '#60368c', // donkerpaars
					light: '#ab86dd', // lichtpaars
					white: '#ffffff', // wit
					'light-gray': '#faf8ff', // lichtgrijs
				},
				// Update all color references to use purple theme
				soccer: {
					green: '#60368c', // Changed to dark purple
					'dark-green': '#4a2a6b', // Darker purple variant
					'light-green': '#ab86dd', // Light purple
					black: '#60368c', // Changed to dark purple
					white: '#ffffff',
					gray: '#faf8ff', // Light gray
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			zIndex: {
				'modal': '1000',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-up': 'slide-up 200ms ease-in-out'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				body: ['var(--font-body)'],
				heading: ['var(--font-heading)'],
			},
			fontSize: {
				// Fluid typography system using clamp() for responsive scaling
				xs: ['clamp(0.75rem, 0.5vw + 0.65rem, 0.875rem)', { lineHeight: 'var(--line-height-normal)' }],
				sm: ['clamp(0.875rem, 0.7vw + 0.75rem, 1rem)', { lineHeight: 'var(--line-height-normal)' }],
				base: ['clamp(1rem, 1vw + 0.875rem, 1.125rem)', { lineHeight: 'var(--line-height-body)' }],
				lg: ['clamp(1.125rem, 1.2vw + 1rem, 1.25rem)', { lineHeight: 'var(--line-height-body)' }],
				xl: ['clamp(1.25rem, 1.5vw + 1.125rem, 1.5rem)', { lineHeight: 'var(--line-height-title)' }],
				'2xl': ['clamp(1.5rem, 2vw + 1.25rem, 2rem)', { lineHeight: 'var(--line-height-title)' }],
				'3xl': ['clamp(1.875rem, 2.5vw + 1.5rem, 2.5rem)', { lineHeight: 'var(--line-height-tight)' }],
				'4xl': ['clamp(2.25rem, 3vw + 1.75rem, 3rem)', { lineHeight: 'var(--line-height-tight)' }],
				'5xl': ['clamp(3rem, 4vw + 2rem, 4rem)', { lineHeight: 'var(--line-height-tight)' }],
				'6xl': ['clamp(3.75rem, 5vw + 2.5rem, 4.5rem)', { lineHeight: 'var(--line-height-tight)' }],
				// Semantic typography tokens
				body: ['clamp(0.875rem, 1vw + 0.75rem, 1rem)', { lineHeight: 'var(--line-height-body)' }],
				heading: ['clamp(1.125rem, 1.5vw + 1rem, 1.5rem)', { lineHeight: 'var(--line-height-title)' }],
				small: ['clamp(0.75rem, 0.8vw + 0.65rem, 0.875rem)', { lineHeight: 'var(--line-height-normal)' }],
				caption: ['clamp(0.625rem, 0.5vw + 0.55rem, 0.75rem)', { lineHeight: 'var(--line-height-normal)' }],
			},
			fontWeight: {
				normal: 'var(--font-weight-normal)',
				medium: 'var(--font-weight-medium)',
				semibold: 'var(--font-weight-semibold)',
				bold: 'var(--font-weight-bold)',
			},
			lineHeight: {
				tight: 'var(--line-height-tight)',
				normal: 'var(--line-height-normal)',
				relaxed: 'var(--line-height-relaxed)',
				loose: 'var(--line-height-loose)',
				body: 'var(--line-height-body)',
				title: 'var(--line-height-title)',
			},
			letterSpacing: {
				tight: 'var(--letter-spacing-tight)',
				normal: 'var(--letter-spacing-normal)',
				wide: 'var(--letter-spacing-wide)',
				wider: 'var(--letter-spacing-wider)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
