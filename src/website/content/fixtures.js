/**
 * Phase-1 stand-in for `GET /api/v1/public/site`.
 *
 * The spec requires that no content is hardcoded, and it will not be: this
 * object is shaped *exactly* like the eventual API payload, so `SiteContent`
 * swaps `fixtures` for `await fetch(...)` and nothing downstream changes. Copy
 * here is transcribed from `reference-images/` so the built page matches the
 * approved design before the CMS exists.
 *
 * Images are intentionally `null`. Real photography arrives through Website
 * Management uploads; `SmoothImage` renders a considered placeholder until then
 * rather than a broken-image icon or a stretched stock photo.
 */
export const fixtures = {
  settings: {
    sectionsEnabled: {
      hero: true,
      featured: true,
      portfolio: true,
      packages: true,
      about: true,
      testimonials: true,
      contact: true,
    },
    // Section order is admin-controlled; this is the reference order.
    sectionOrder: ['hero', 'featured', 'portfolio', 'packages', 'about', 'testimonials', 'contact'],
    navLabels: {},
  },

  // Sections the studio adds in the admin (a heading plus a grid of videos).
  sections: [],

  brand: {
    name: 'Dynamic Production',
    monogram: 'DP',
    tagline: 'Wedding & Pre-Wedding Photography',
  },

  hero: {
    eyebrow: 'We Capture',
    title: 'Timeless Stories',
    titleScript: 'of Love',
    subtitle: 'Wedding & Pre-Wedding Photography',
    ctaLabel: 'View Our Work',
    ctaHref: '#portfolio',
    pillars: ['Cinematic', 'Emotional', 'Timeless'],
    // Assets, matching `GET /public/site` exactly — the API returns processed
    // images here, not wrappers. Empty until an admin uploads; Hero renders a
    // single toned panel in the meantime.
    slides: [],
  },

  featuredIn: [
    { name: 'WeddingWire' },
    { name: 'WedMeGood' },
    { name: 'Shaadi' },
    { name: 'Zoom' },
    { name: '(fp)' },
    { name: 'Fearless' },
  ],

  featured: {
    eyebrow: "We don't just take pictures",
    title: 'We Capture Emotions',
    body: 'From the big moments to the tiny details, we capture your story in the most beautiful way possible.',
    ctaLabel: 'Explore Portfolio',
    ctaHref: '#portfolio',
    cards: [
      { title: 'Weddings', caption: 'Timeless celebrations', image: null, href: '#portfolio' },
      { title: 'Pre-Weddings', caption: 'Beautiful beginnings', image: null, href: '#portfolio' },
      { title: 'Cinematic Films', caption: 'Stories in motion', image: null, href: '#portfolio' },
    ],
  },

  stats: [
    { value: '500+', label: 'Weddings', icon: 'rings' },
    { value: '300+', label: 'Pre-Weddings', icon: 'camera' },
    { value: '5+', label: 'Years Experience', icon: 'award' },
    { value: '98%', label: 'Happy Clients', icon: 'heart' },
  ],

  portfolio: {
    title: 'Portfolio',
    subtitle: "A glimpse of love stories we've captured",
    ctaLabel: 'View All Work',
    categories: [
      { id: 'all', label: 'All' },
      { id: 'weddings', label: 'Weddings' },
      { id: 'pre-weddings', label: 'Pre-Weddings' },
      { id: 'cinematic-films', label: 'Cinematic Films' },
      { id: 'engagements', label: 'Engagements' },
    ],
    items: [
      { id: 'p1', title: 'Aarav & Diya', category: 'weddings', image: null, span: 'tall' },
      { id: 'p2', title: 'Kabir & Meera', category: 'weddings', image: null, span: 'wide' },
      { id: 'p3', title: 'Rohan & Sara', category: 'pre-weddings', image: null, span: 'std' },
      { id: 'p4', title: 'Vivaan & Anaya', category: 'pre-weddings', image: null, span: 'wide' },
      { id: 'p5', title: 'Arjun & Isha', category: 'cinematic-films', image: null, span: 'tall' },
      { id: 'p6', title: 'Dev & Nisha', category: 'weddings', image: null, span: 'std' },
      { id: 'p7', title: 'Kunal & Riya', category: 'weddings', image: null, span: 'wide' },
      { id: 'p8', title: 'Ishaan & Tara', category: 'pre-weddings', image: null, span: 'tall' },
      { id: 'p9', title: 'Neil & Aanya', category: 'cinematic-films', image: null, span: 'wide' },
      { id: 'p10', title: 'Ayaan & Kiara', category: 'cinematic-films', image: null, span: 'std' },
      { id: 'p11', title: 'Samar & Myra', category: 'engagements', image: null, span: 'tall' },
      { id: 'p12', title: 'Veer & Ira', category: 'engagements', image: null, span: 'wide' },
      { id: 'p13', title: 'Reyansh & Siya', category: 'engagements', image: null, span: 'std' },
    ],
  },

  packages: {
    title: 'Packages',
    subtitle: 'Choose the perfect package for your special day',
    pillars: [
      { title: 'Cinematic Quality', icon: 'aperture' },
      { title: 'Creative Storytelling', icon: 'sparkles' },
      { title: 'Memories For Life', icon: 'gem' },
    ],
    items: [
      {
        id: 'essential',
        name: 'Essential',
        description: 'Perfect for intimate celebrations',
        features: ['Full-day coverage', 'Edited highlights gallery', 'Two photographers'],
        image: null,
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Most popular choice for weddings',
        features: ['Multi-day coverage', 'Cinematic highlight film', 'Premium album'],
        image: null,
      },
      {
        id: 'luxury',
        name: 'Luxury',
        description: 'Complete coverage with premium films',
        features: ['Unlimited coverage', 'Feature-length film', 'Heirloom album set'],
        image: null,
      },
    ],
    cta: {
      title: 'Want to know more?',
      body: 'Our packages are customized to suit your needs.',
      label: 'Enquire Now',
    },
  },

  about: {
    eyebrow: 'Passionate Photographers',
    title: 'Telling Your Story Through Our Lens',
    body: 'We are a team of passionate photographers and filmmakers who believe in capturing real emotions and creating timeless memories.',
    signature: 'Dynamic Production',
    ctaLabel: 'Know More About Us',
    portrait: null,
    pillars: [
      { title: 'Professional Team', icon: 'users' },
      { title: 'Premium Equipment', icon: 'camera' },
      { title: 'Customer Focused', icon: 'heart' },
      { title: 'On-Time Delivery', icon: 'clock' },
    ],
  },

  testimonials: {
    title: 'Kind Words',
    subtitle: 'What our couples say about their day',
    items: [
      {
        id: 't1',
        name: 'Ananya & Rohit',
        role: 'Wedding, Indore',
        rating: 5,
        quote:
          'They felt like friends with cameras. Every frame carries the exact feeling of that day — we still cry looking at the film.',
        avatar: null,
      },
      {
        id: 't2',
        name: 'Priya & Karan',
        role: 'Pre-Wedding, Udaipur',
        rating: 5,
        quote:
          'Effortless from the first call to the final album. The team read our mood perfectly and never once made the day feel staged.',
        avatar: null,
      },
      {
        id: 't3',
        name: 'Sneha & Aditya',
        role: 'Wedding, Bhopal',
        rating: 5,
        quote:
          'The cinematic film exceeded everything we imagined. Our families in three cities felt like they were in the room with us.',
        avatar: null,
      },
    ],
  },

  contact: {
    eyebrow: "Let's Create",
    title: 'Something Beautiful Together',
    phone: '+91 88822 10103',
    whatsapp: '+91 88822 10103',
    email: 'hello@dynamicproduction.com',
    address: 'Indore, Madhya Pradesh, India',
    mapEmbedUrl: '',
    hours: 'Mon – Sat · 10:00 – 19:00',
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'facebook', url: 'https://facebook.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
    ],
    image: null,
  },

  seo: {
    title: 'Dynamic Production — Wedding & Pre-Wedding Photography',
    description:
      'Cinematic wedding and pre-wedding photography in Indore. Timeless stories, beautifully told.',
    ogImage: null,
    canonicalUrl: '',
  },
};
