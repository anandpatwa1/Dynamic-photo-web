import { cropRect } from './cropGeometry';

let original;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'prepare') {
      if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
        self.postMessage({ type: 'unsupported' });
        return;
      }
      original?.close();
      original = await createImageBitmap(data.file, { imageOrientation: 'from-image' });
      const scale = Math.min(1, 1600 / Math.max(original.width, original.height));
      const preview = await createImageBitmap(original, {
        resizeWidth: Math.max(1, Math.round(original.width * scale)),
        resizeHeight: Math.max(1, Math.round(original.height * scale)),
        resizeQuality: 'high',
      });
      self.postMessage({ type: 'ready', preview }, [preview]);
    } else if (data.type === 'crop') {
      if (!original) throw new Error('Please wait for the photo to finish loading.');
      const source = cropRect(original, data.aspect, data.zoom, data.position);
      const canvas = new OffscreenCanvas(data.width, Math.round(data.width / data.aspect));
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(original, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
      self.postMessage({ type: 'cropped', blob });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || 'Could not read this photo.' });
  }
};
