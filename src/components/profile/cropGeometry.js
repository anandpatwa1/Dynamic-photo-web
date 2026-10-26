export const cropRect = (image, aspect, zoom, position) => {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const baseWidth = imageWidth / imageHeight > aspect ? imageHeight * aspect : imageWidth;
  const width = baseWidth / zoom;
  const height = width / aspect;
  return { x: (imageWidth - width) * position.x, y: (imageHeight - height) * position.y, width, height };
};
