import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { websiteApi } from '@/api/websiteApi';

/**
 * Loads and saves the WebsiteContent singleton.
 *
 * Four admin screens (Homepage, Contact, SEO, Website Settings) edit different
 * slices of one document, so they share this hook rather than each holding
 * their own copy — two screens open at once with independent state is how a
 * save on one silently reverts the other.
 *
 * `save` takes only the slice being edited and the server merges it, so
 * concurrent edits to unrelated sections do not clobber each other.
 */
export const useWebsiteContent = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { content: next } = await websiteApi.getContent();
      setContent(next);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not load website content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (patch, { silent = false } = {}) => {
    setSaving(true);
    try {
      const { content: next } = await websiteApi.updateContent(patch);
      setContent(next);
      if (!silent) toast.success('Saved — the website is updated.');
      return next;
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That change could not be saved.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const uploadImage = useCallback(async ({ path, slot, alt, file }) => {
    const { content: next } = await websiteApi.uploadContentImage({ path, slot, alt, file });
    setContent(next);
    toast.success('Image uploaded.');
    return next;
  }, []);

  return { content, loading, saving, save, uploadImage, reload: load };
};
