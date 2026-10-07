import { api, unwrap, unwrapWithMeta } from './axios';

/**
 * Flattens `unwrapWithMeta`'s `{ data, meta }` into `{ ...data, meta }`.
 *
 * Without this a caller writing the obvious `const { portfolio } = await
 * list()` silently gets `undefined` and crashes one line later on
 * `.length` — which is exactly what happened. Paginated endpoints still get
 * their `meta`, just alongside the payload rather than wrapping it.
 */
const flatten = (promise) => promise.then(({ data, meta }) => ({ ...data, meta }));

/** Builds a multipart body, skipping empties and expanding arrays into repeats. */
const toForm = (fields) => {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((entry) => form.append(key, entry));
    else form.append(key, value);
  });

  return form;
};

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const websiteApi = {
  slots: () => api.get('/website/image-slots').then(unwrap),

  // Homepage, Contact, SEO and Website Settings all edit one singleton.
  getContent: () => api.get('/website/content').then(unwrap),
  updateContent: (payload) => api.patch('/website/content', payload).then(unwrap),
  uploadContentImage: ({ path, slot, alt, file }) =>
    api
      .post('/website/content/image', toForm({ path, slot, alt, image: file }), multipart)
      .then(unwrap),

  portfolio: {
    list: (params) => flatten(api.get('/website/portfolio', { params }).then(unwrapWithMeta)),
    get: (id) => api.get(`/website/portfolio/${id}`).then(unwrap),
    create: ({ file, slot, coverAlt, ...fields }) =>
      api
        .post('/website/portfolio', toForm({ ...fields, slot, coverAlt, coverImage: file }), multipart)
        .then(unwrap),
    update: (id, payload) => api.patch(`/website/portfolio/${id}`, payload).then(unwrap),
    updateCover: (id, { file, slot, alt }) =>
      api
        .patch(`/website/portfolio/${id}/cover`, toForm({ slot, alt, image: file }), multipart)
        .then(unwrap),
    createAlbum: (id, payload) => api.post(`/website/portfolio/${id}/albums`, payload).then(unwrap),
    updateAlbum: (id, albumId, payload) =>
      api.patch(`/website/portfolio/${id}/albums/${albumId}`, payload).then(unwrap),
    removeAlbum: (id, albumId) => api.delete(`/website/portfolio/${id}/albums/${albumId}`).then(unwrap),
    addGallery: async (id, entries, { onProgress } = {}) => {
      // Files and their slots/alts travel as parallel arrays, so a single
      // gallery can mix portrait and landscape frames.
      const albumId = entries[0]?.albumId;
      const keepShape = entries[0]?.keepShape !== false;

      /*
       * The server holds every photo of a request in memory, and DSLR frames
       * are 8-30 MB each. Sending them two at a time keeps memory flat however
       * many are chosen, and one failure no longer discards the whole batch.
       */
      const BATCH = 2;
      let last = null;
      for (let start = 0; start < entries.length; start += BATCH) {
        const form = new FormData();
        entries.slice(start, start + BATCH).forEach(({ file, slot, alt }) => {
          form.append('images', file);
          form.append('slots', slot ?? '');
          form.append('alts', alt ?? '');
        });
        if (albumId) form.append('albumId', albumId);
        form.append('keepShape', keepShape ? '1' : '0');

        // eslint-disable-next-line no-await-in-loop
        last = await api
          .post(`/website/portfolio/${id}/gallery`, form, { ...multipart, timeout: 300000 })
          .then(unwrap);
        onProgress?.(Math.min(start + BATCH, entries.length), entries.length);
      }
      return last;
    },
    // Google Drive file/folder link: stores references only, no upload.
    addGalleryFromDrive: (id, { url, albumId, alt }) =>
      api.post(`/website/portfolio/${id}/gallery/drive`, { url, albumId, alt }).then(unwrap),
    // Copy import: list what a Drive link holds, then bring the photos across
    // one request at a time (each is downloaded, resized and stored).
    listDriveImages: (id, { url, albumId }) =>
      api.post(`/website/portfolio/${id}/gallery/drive/list`, { url, albumId }, { timeout: 60000 }).then(unwrap),
    importDriveImage: (id, { fileId, name, albumId, alt }) =>
      api
        .post(`/website/portfolio/${id}/gallery/drive/import`, { fileId, name, albumId, alt }, { timeout: 180000 })
        .then(unwrap),
    reorderGallery: (id, order, albumId) =>
      api.patch(`/website/portfolio/${id}/gallery/reorder`, { order, albumId }).then(unwrap),
    removeGalleryImage: (id, publicId, albumId) =>
      api.delete(`/website/portfolio/${id}/gallery`, { data: { publicId, albumId } }).then(unwrap),
    reorder: (order) => api.patch('/website/portfolio/reorder', { order }).then(unwrap),
    remove: (id) => api.delete(`/website/portfolio/${id}`).then(unwrap),
  },

  // Sections the studio adds to the home page (a heading plus a grid of videos).
  sections: {
    list: () => api.get('/website/sections').then(unwrap),
    create: (payload) => api.post('/website/sections', payload).then(unwrap),
    update: (id, payload) => api.patch(`/website/sections/${id}`, payload).then(unwrap),
    reorder: (order) => api.patch('/website/sections/reorder', { order }).then(unwrap),
    remove: (id) => api.delete(`/website/sections/${id}`).then(unwrap),
  },

  testimonials: {
    list: () => api.get('/website/testimonials').then(unwrap),
    create: ({ file, ...fields }) =>
      api.post('/website/testimonials', toForm({ ...fields, avatar: file }), multipart).then(unwrap),
    update: (id, { file, ...fields }) =>
      api
        .patch(`/website/testimonials/${id}`, toForm({ ...fields, avatar: file }), multipart)
        .then(unwrap),
    reorder: (order) => api.patch('/website/testimonials/reorder', { order }).then(unwrap),
    remove: (id) => api.delete(`/website/testimonials/${id}`).then(unwrap),
  },

  packages: {
    list: () => api.get('/website/packages').then(unwrap),
    update: (id, payload) => api.patch(`/website/packages/${id}`, payload).then(unwrap),
    uploadImage: (id, { file, slot, alt }) =>
      api
        .patch(`/website/packages/${id}/image`, toForm({ slot, alt, image: file }), multipart)
        .then(unwrap),
    reorder: (order) => api.patch('/website/packages/reorder', { order }).then(unwrap),
  },

  inquiries: {
    list: (params) => flatten(api.get('/website/inquiries', { params }).then(unwrapWithMeta)),
    setStatus: (id, status) =>
      api.patch(`/website/inquiries/${id}/status`, { status }).then(unwrap),
    convert: (id) => api.post(`/website/inquiries/${id}/convert`).then(unwrap),
  },
};
