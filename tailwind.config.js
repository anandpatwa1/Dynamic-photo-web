/** @type {import('tailwindcss').Config} */

/**
 * Design tokens for Dynamic Production CRM.
 *
 * The palette is sampled directly from the reference quotation layouts:
 *  - `brand`  — the warm gold of the classic quotation (headers, accents, rules)
 *  - `olive`  — the botanical variant used by the second reference
 *  - `ink`    — a warm neutral ramp (not pure gray) so whites feel like paper
 *
 * Shadows are deliberately low-contrast and layered — the Stripe/Linear look
 * comes from a hairline ring plus a very soft ambient shadow, never a blur halo.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF7EF',
          100: '#F5EAD4',
          200: '#EBD5A9',
          300: '#DFBB77',
          400: '#D0A050',
          500: '#B8863B',
          600: '#9C6D2C',
          700: '#7C5624',
          800: '#5F4321',
          900: '#4A351E',
          950: '#2A1D0F',
        },
        olive: {
          50: '#F2F4EF',
          100: '#E2E6DB',
          200: '#C6CDB9',
          300: '#A4AE93',
          400: '#838E71',
          500: '#5C6650',
          600: '#4A5341',
          700: '#3B4234',
          800: '#2F342B',
          900: '#262A23',
        },
        ink: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E9E7E4',
          300: '#D8D5D1',
          400: '#A9A29D',
          500: '#79726C',
          600: '#57514C',
          700: '#413B37',
          800: '#292421',
          900: '#1A1613',
          950: '#0D0B09',
        },
        cream: '#F7EDD9',

        /**
         * Marketing-site palette, sampled from `reference-images/`.
         *
         * Namespaced under `site` so it can never collide with the CRM's
         * `brand`/`ink` ramps — the two design systems live in one Tailwind
         * build but must not bleed into each other.
         */
        site: {
          // Warm near-black: hero overlay, stats band, footer.
          ink: '#1C1714',
          'ink-soft': '#2A231E',
          // Paper. The site's default canvas.
          paper: '#FAF8F5',
          'paper-alt': '#F4F0EA',
          // Beige — the "Want to know more?" band and the ENQUIRY NOW pill.
          sand: '#E9D8C7',
          'sand-deep': '#DCC4AC',
          // Gold-brown, used for kickers and small caps accents.
          accent: '#A8794F',
          'accent-soft': '#C9A582',
          // Body copy on paper. 7.1:1 on #FAF8F5 — passes AA comfortably.
          body: '#5A5049',
          muted: '#8A7F76',
          line: '#E2DAD1',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'sans-serif',
        ],
        display: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        // Marketing site only — the high-contrast serif of the reference
        // headlines, and the signature script used for accents like "of Love".
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        script: ['Parisienne', 'Snell Roundhand', 'Apple Chancery', 'cursive'],
      },
      fontSize: {
        // Tighter tracking on large text is what makes headings feel "Apple".
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        md: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.035em' }],

        /**
         * Marketing-site type scale. Every step is fluid, because the spec
         * demands one layout from Galaxy Fold (280px) to ultra-wide. Fixed
         * breakpoint jumps produce the "almost right" sizes in between; a
         * clamp() ramp does not.
         */
        'site-hero': ['clamp(2.75rem, 7vw, 6.5rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        'site-h2': ['clamp(2rem, 4.2vw, 3.75rem)', { lineHeight: '1.08', letterSpacing: '-0.015em' }],
        'site-h3': ['clamp(1.5rem, 2.6vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'site-stat': ['clamp(2.25rem, 4vw, 3.25rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'site-body': ['clamp(0.9375rem, 1.05vw, 1.0625rem)', { lineHeight: '1.75' }],
        // Wide-tracked uppercase: nav, kickers, button labels, stat captions.
        'site-eyebrow': ['clamp(0.6875rem, 0.8vw, 0.8125rem)', { lineHeight: '1.4', letterSpacing: '0.18em' }],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(16 24 40 / 0.05)',
        sm: '0 1px 3px 0 rgb(16 24 40 / 0.06), 0 1px 2px -1px rgb(16 24 40 / 0.04)',
        md: '0 4px 8px -2px rgb(16 24 40 / 0.06), 0 2px 4px -2px rgb(16 24 40 / 0.04)',
        lg: '0 12px 16px -4px rgb(16 24 40 / 0.07), 0 4px 6px -2px rgb(16 24 40 / 0.03)',
        xl: '0 20px 24px -4px rgb(16 24 40 / 0.08), 0 8px 8px -4px rgb(16 24 40 / 0.03)',
        '2xl': '0 32px 64px -12px rgb(16 24 40 / 0.14)',
        // Hairline ring + ambient lift — the default resting state for cards.
        card: '0 0 0 1px rgb(16 24 40 / 0.04), 0 1px 2px 0 rgb(16 24 40 / 0.05)',
        'card-hover': '0 0 0 1px rgb(16 24 40 / 0.06), 0 6px 16px -6px rgb(16 24 40 / 0.12)',
        popover: '0 0 0 1px rgb(16 24 40 / 0.05), 0 12px 40px -12px rgb(16 24 40 / 0.2)',
        focus: '0 0 0 3px rgb(184 134 59 / 0.16)',
        inset: 'inset 0 1px 2px 0 rgb(16 24 40 / 0.06)',
      },
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
        8.5: '2.125rem',
        9.5: '2.375rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        68: '17rem',
        76: '19rem',
        88: '22rem',
        128: '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      transitionTimingFunction: {
        // A soft ease-out that reads as "settled" rather than springy.
        smooth: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-up': 'fade-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        shimmer: 'shimmer 1.8s infinite',
      },
    },
  },
  plugins: [],
};
