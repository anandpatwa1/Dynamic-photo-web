import clsx from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Merges conditional class names and resolves conflicting Tailwind utilities,
 * so a caller's `className` always wins over a component's defaults.
 *
 * The custom font sizes have to be declared explicitly. tailwind-merge groups
 * `text-*` utilities by inspecting the suffix, and it cannot tell that
 * `text-site-h2` is a font size while `text-site-ink` is a colour — both are
 * project-specific names it has never seen. Left undeclared it treats them as
 * the same group and keeps only the last one, which silently dropped every
 * heading down to the inherited 16px wherever a size and a colour were passed
 * through `cn()` together.
 */
const CUSTOM_FONT_SIZES = [
  'site-hero',
  'site-h2',
  'site-h3',
  'site-stat',
  'site-body',
  'site-eyebrow',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: CUSTOM_FONT_SIZES }],
    },
  },
});

export const cn = (...inputs) => twMerge(clsx(inputs));
