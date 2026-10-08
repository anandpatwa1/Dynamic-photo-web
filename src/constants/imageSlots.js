export const ORIENTATION = {
  LANDSCAPE: 'landscape',
  PORTRAIT: 'portrait',
  SQUARE: 'square',
};

const MB = 1024 * 1024;

const WIDE_LADDER = [640, 1024, 1440, 1920];
const CARD_LADDER = [480, 768, 1200];

export const IMAGE_SLOTS = {
  heroDesktop: {
    id: 'heroDesktop',
    label: 'Hero — Desktop',
    description: 'Full-bleed banner behind the headline.',
    width: 1920,
    height: 1080,
    aspect: 16 / 9,
    tolerance: 0.05,
    minWidth: 1600,
    minHeight: 900,
    orientation: ORIENTATION.LANDSCAPE,
    maxBytes: 10 * MB,
    variants: WIDE_LADDER,
  },
  heroMobile: {
    id: 'heroMobile',
    label: 'Hero — Mobile',
    description: 'Portrait crop of the hero, used below 640px.',
    width: 1080,
    height: 1350,
    aspect: 4 / 5,
    tolerance: 0.05,
    minWidth: 900,
    minHeight: 1125,
    orientation: ORIENTATION.PORTRAIT,
    maxBytes: 8 * MB,
    variants: [480, 768, 1080],
  },
  portfolioCover: {
    id: 'portfolioCover',
    label: 'Portfolio Cover',
    description: 'The tile shown in the portfolio grid.',
    width: 1200,
    height: 1600,
    aspect: 3 / 4,
    tolerance: 0.05,
    minWidth: 900,
    minHeight: 1200,
    orientation: ORIENTATION.PORTRAIT,
    autoCrop: true,
    maxBytes: 8 * MB,
    variants: CARD_LADDER,
  },
  galleryPortrait: {
    id: 'galleryPortrait',
    label: 'Gallery — Portrait',
    description: 'Portrait frame inside a portfolio gallery.',
    width: 1200,
    height: 1800,
    aspect: 2 / 3,
    tolerance: 0.05,
    minWidth: 900,
    minHeight: 1350,
    orientation: ORIENTATION.PORTRAIT,
    autoCrop: true,
    maxBytes: 8 * MB,
    variants: CARD_LADDER,
  },
  galleryLandscape: {
    id: 'galleryLandscape',
    label: 'Gallery — Landscape',
    description: 'Landscape frame inside a portfolio gallery.',
    width: 1800,
    height: 1200,
    aspect: 3 / 2,
    tolerance: 0.05,
    minWidth: 1350,
    minHeight: 900,
    orientation: ORIENTATION.LANDSCAPE,
    autoCrop: true,
    maxBytes: 8 * MB,
    variants: CARD_LADDER,
  },
  square: {
    id: 'square',
    label: 'Square',
    description: 'Package cards, testimonial portraits, social previews.',
    width: 1200,
    height: 1200,
    aspect: 1,
    tolerance: 0.03,
    minWidth: 800,
    minHeight: 800,
    orientation: ORIENTATION.SQUARE,
    maxBytes: 6 * MB,
    variants: [320, 640, 1200],
  },
};

export const IMAGE_SLOT_IDS = Object.keys(IMAGE_SLOTS);

export const getSlot = (slotId) => IMAGE_SLOTS[slotId] ?? null;

export const formatBytes = (bytes) => {
  if (bytes >= MB) return `${Math.round((bytes / MB) * 10) / 10} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

const orientationOf = (width, height) => {
  if (width > height) return ORIENTATION.LANDSCAPE;
  if (height > width) return ORIENTATION.PORTRAIT;
  return ORIENTATION.SQUARE;
};

export const validateImage = ({ slotId, width, height, bytes }) => {
  const slot = getSlot(slotId);
  if (!slot) return { valid: false, errors: [`Unknown image slot "${slotId}".`] };

  const errors = [];

  if (Number.isFinite(bytes) && bytes > slot.maxBytes) {
    errors.push(
      `File is ${formatBytes(bytes)}. The limit for ${slot.label} is ${formatBytes(slot.maxBytes)}.`,
    );
  }

  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    errors.push('Could not read the image dimensions. Is the file a valid image?');
    return { valid: false, errors, slot };
  }

  if (width < slot.minWidth || height < slot.minHeight) {
    errors.push(
      `Image is ${width}×${height}. ${slot.label} needs at least ${slot.minWidth}×${slot.minHeight} ` +
        `(ideally ${slot.width}×${slot.height}).`,
    );
  }

  if (!slot.autoCrop) {
    const actualOrientation = orientationOf(width, height);
    if (actualOrientation !== slot.orientation) {
      errors.push(`Image is ${actualOrientation}. ${slot.label} must be ${slot.orientation}.`);
    }

    const actualAspect = width / height;
    const drift = Math.abs(actualAspect - slot.aspect) / slot.aspect;
    if (drift > slot.tolerance) {
      errors.push(
        `Aspect ratio is ${actualAspect.toFixed(2)}:1. ${slot.label} expects ` +
          `${slot.aspect.toFixed(2)}:1 (${slot.width}×${slot.height}). Please crop before uploading.`,
      );
    }
  }

  return { valid: errors.length === 0, errors, slot };
};
