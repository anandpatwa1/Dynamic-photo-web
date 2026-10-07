/**
 * Every user-visible string in the Wedding Quote module (A1.6).
 * English only for now — add a `hi` object with the same keys to localise.
 */
export const STRINGS = {
  en: {
    module: 'Wedding Quote',
    nav: {
      create: 'Create Wedding Quote',
      all: 'All Quotes',
      items: 'Items',
      sets: 'Deliverable Sets',
      addOns: 'Add-ons',
      presets: 'Package Presets',
      themes: 'Theme Library',
      dayAssignment: 'Day Assignment',
      settings: 'Quote Settings',
      mastersGroup: 'Masters',
      themesGroup: 'Themes',
    },
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', back: 'Back', next: 'Next',
      search: 'Search…', active: 'Active', inactive: 'Inactive', none: 'None', loading: 'Loading…',
      moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', reset: 'Reset', close: 'Close',
      saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved changes', noPermission: 'You do not have permission to view this page.',
      confirmDelete: 'Delete this record?', deleted: 'Deleted', copy: 'Copy', copied: 'Copied to clipboard',
      sellingPrice: 'Selling price', costPrice: 'Cost price', mrpPrice: 'MRP', note: 'Note', name: 'Name',
      leaveWarning: 'You have unsaved changes. Leave anyway?', optional: 'optional',
    },
    sides: { none: 'No label', bride: 'Bride', groom: 'Groom', both: 'Both' },
    items: {
      title: 'Items', description: 'Sellable units placed on each wedding date.', add: 'Add item',
      deliverables: 'Deliverable lines', deliverablesHint: 'e.g. "2-3 Reels" — reel lines are counted automatically',
      addLine: 'Add line', empty: 'No items yet', emptyHint: 'Create items like Photo + Video, Candid, Cinematic, Drone.',
    },
    sets: {
      title: 'Deliverable Sets', description: 'Saved lists of deliverables. One set can be the default.', add: 'Add set',
      isDefault: 'Default set', makeDefault: 'Make default', lines: 'Lines', addLine: 'Add line', empty: 'No deliverable sets yet', defaultBadge: 'Default',
    },
    addOns: {
      title: 'Add-ons', description: 'One add-on (or none) per quote, shown as a badge. Its price is only printed on the quote; it never changes the total.', add: 'Add add-on',
      kind: 'Type', kinds: { free: 'Free', discount: 'Discount', surprise: 'Surprise', custom: 'Custom' },
      badge: 'Badge text', text: 'Text', titleField: 'Title', valueAmount: 'Worth (₹)',
      priceEffect: 'Price on quote', effects: { none: 'None (badge only)', add: 'Add to total', subtract: 'Subtract from total' },
      priceAmount: 'Price to print (₹)', priceHint: 'Printed as "Add ₹…". Leave 0 to print no price. It does not change the quote total.', printedPrice: 'Add-on price line', empty: 'No add-ons yet',
    },
    presets: { title: 'Package Presets', description: 'Ready-made package names and subtitles.', add: 'Add preset', subtitle: 'Subtitle', descriptionField: 'Description', empty: 'No presets yet' },
    settings: {
      title: 'Quote Settings', defaults: 'Defaults', export: 'Export defaults', permissions: 'Permissions',
      defaultSet: 'Default deliverable set', quality: 'JPG quality', width: 'Width (px)', scale: 'Scale',
      role: 'Role', savePermissions: 'Save permissions', adminLocked: 'Admins always keep "Manage permissions".',
      actions: {
        viewQuotes: 'View quotes', createQuote: 'Create quote', editQuote: 'Edit quote', deleteQuote: 'Delete quote',
        manageMasters: 'Manage masters', manageThemes: 'Manage themes', viewCosting: 'View costing',
        exportJpg: 'Export JPG', managePermissions: 'Manage permissions',
      },
    },
    wizard: {
      title: 'Create Wedding Quote',
      steps: ['Dates', 'Package', 'Items', 'Deliverables', 'Add-on'],
      datesTitle: 'Pick the wedding dates', datesHint: 'Tap dates to select (up to 10). Only day and month print.',
      printYear: 'Print year', printYearHint: 'Leave empty to print no year', selected: 'Selected dates', maxReached: 'Maximum 10 dates per quote',
      invalidDate: 'That date does not exist', noDates: 'Select at least one date',
      packageTitle: 'Choose a package', customPackage: 'Custom package', packageName: 'Package name', subtitle: 'Subtitle', description: 'Description',
      itemsTitle: 'Add items for', dayOf: 'Day {n} of {total}', subtotal: 'Day subtotal', addItem: 'Add', side: 'Side', addAs: 'Add services for', entryNote: 'Note for this entry', quantity: 'Qty',
      noItemsOnDay: 'No items on this date yet', searchItems: 'Search services…', selectedItems: 'Selected services',
      copyPreviousDay: 'Copy previous day', copiedPreviousDay: 'Previous day copied', availableItems: 'Available services', noMatchingItems: 'No matching services',
      quoteSummary: 'Quote summary', services: 'services', total: 'Total',
      setTitle: 'Choose deliverables', autoLine: 'Auto', resetAuto: 'Reset to auto', edited: 'Edited',
      addOnTitle: 'Choose an add-on', noAddOn: 'No add-on', finish: 'Open editor', creating: 'Creating draft…', label: 'Internal label (never printed)',
    },
    list: {
      title: 'All Quotes', description: 'Every wedding quote, newest first.', status: { all: 'All', draft: 'Draft', saved: 'Saved' },
      dates: 'Dates', price: 'Price', updated: 'Updated', open: 'Open', duplicate: 'Duplicate', breakdown: 'Breakdown', empty: 'No quotes yet', untitled: 'Untitled quote',
    },
    breakdown: {
      title: 'Price breakdown', item: 'Item', side: 'Side', selling: 'Selling', cost: 'Cost', mrp: 'MRP', deliverables: 'Deliverable lines',
      addOn: 'Add-on (printed only, not in total)', totals: 'Auto totals', override: 'Override', delta: 'Override delta', profit: 'Profit', margin: 'Margin',
      displayed: 'Shown on quote', costHidden: 'Costing is hidden for your role.', copy: 'Copy as text', print: 'Print', day: 'Date',
    },
    editor: {
      panel: 'Fields', theme: 'Theme', allThemes: 'All themes', assigned: 'Assigned for {n} dates', undo: 'Undo', redo: 'Redo', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'Fit',
      resetBlock: 'Reset block', resetQuote: 'Reset quote to auto', width: 'Width', fontScale: 'Font scale', groupDates: 'Group identical consecutive dates', showSides: 'Show side labels', caps: 'Capital letters for headings',
      priceAuto: 'Auto', priceOverride: 'Override', notes: 'Notes', addNote: 'Add note', overCap: 'Content is longer than the 9:16 cap even at the smallest font size — the image will be taller.',
      fields: { package: 'Package', dates: 'Dates', items: 'Items', deliverables: 'Deliverables', addOn: 'Add-on', price: 'Price', notes: 'Notes', footer: 'Footer' },
      empty: '(empty)', clickToEdit: 'Click any text on the quote to edit it', blocks: { title: 'Title', subtitle: 'Subtitle', dates: 'Dates', deliverables: 'Deliverables', addOn: 'Add-on badge', price: 'Price', notes: 'Notes', footer: 'Footer' },
      breakdown: 'Breakdown', recalc: 'Recalculate',
    },
    export: {
      title: 'Export JPG', quality: 'Quality', width: 'Width', estimated: 'Estimated size', dimensions: 'Dimensions', capped: 'Longest side capped at 4096 px for mobile safety.',
      saveDownload: 'Save & Download', downloadOnly: 'Download only', failed: 'This browser could not create the image (canvas too large or unsupported). Try a smaller width or another browser.', measuring: 'Measuring…',
    },
    themes: {
      title: 'Theme Library', description: 'Data-driven poster designs. Import new ones from a .zip or theme.json.',
      downloadExample: 'Download example', downloadKit: 'Download for other project', import: 'Import theme', copyPrompt: 'Copy basic AI prompt',
      builtIn: 'Built-in', forDays: 'For {days} dates', exportOne: 'Export', deactivate: 'Deactivate', activate: 'Activate',
      importTitle: 'Import theme', chooseFile: 'Choose .zip or theme.json', validating: 'Validating…', errors: 'Errors', warnings: 'Warnings', valid: 'Theme is valid',
      preview: 'Preview', confirm: 'Import theme', promptCopied: 'AI prompt copied. Paste it into ChatGPT, Gemini or Claude.',
      search: 'Search themes…', all: 'All', compatible: 'Fits selected dates', notCompatible: 'Designed for other date counts',
      previewTheme: 'Preview theme', chooseTheme: 'Choose theme', pickerDescription: 'See the real quote layout before choosing.', currentTheme: 'Current', compare: 'Compare', compareThemes: 'Compare themes', editDetails: 'Edit details', themeName: 'Theme name', supportedDays: 'Supported date counts',
      assignmentTitle: 'Day Assignment', assignmentDescription: 'Up to 5 themes per day count, one default. Empty rows fall back to the nearest lower day count, then built-ins.',
      days: '{n} date(s)', defaultTheme: 'Default', addTheme: 'Add theme…', fallback: 'Falls back to {source}', saveAssignment: 'Save assignment',
    },
    canvas: { deliverablesHeading: 'Deliverables' },
  },
};

export const LANG = 'en';
export const T = STRINGS[LANG];

/** "Day {n} of {total}" → "Day 2 of 5". */
export const fmt = (template, values = {}) => String(template).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
