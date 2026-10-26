export const storyMetadata = (item, brand = 'Photography') => {
  const previousTitle = document.title;
  const title = `${item.title} | ${brand}`;
  const canonical = `${window.location.origin}/${encodeURIComponent(item.slug)}`;
  const edits = [
    ['link[rel="canonical"]', 'link', 'rel', 'canonical', 'href', canonical],
    ...[['og:title', title], ['og:url', canonical], ['og:description', item.description || title], ['og:image', item.coverImage?.url || '']].map(([key, value]) => [`meta[property="${key}"]`, 'meta', 'property', key, 'content', value]),
    ...[['description', item.description || title], ['twitter:title', title], ['twitter:description', item.description || title], ['twitter:image', item.coverImage?.url || '']].map(([key, value]) => [`meta[name="${key}"]`, 'meta', 'name', key, 'content', value]),
  ].map(([selector, tag, key, name, attribute, value]) => {
    let element = document.head.querySelector(selector);
    const created = !element;
    if (created) { element = document.createElement(tag); element.setAttribute(key, name); document.head.appendChild(element); }
    const previous = element.getAttribute(attribute);
    element.setAttribute(attribute, value);
    return () => { if (created) element.remove(); else if (previous === null) element.removeAttribute(attribute); else element.setAttribute(attribute, previous); };
  });
  document.title = title;
  return () => { document.title = previousTitle; edits.forEach(restore => restore()); };
};
