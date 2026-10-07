import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profileApi } from '@/api/profileApi';
import { PublicProfilePage } from './PublicProfilePage';
import SiteRoot from '@/website/SiteRoot';

export const PublicProfileResolver = () => {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, profile: null, fallback: false });

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, profile: null, fallback: false });
    profileApi.publicBySlug(slug, controller.signal)
      .then(({ profile }) => setState({ loading: false, profile, fallback: false }))
      .catch((error) => {
        if (error.name === 'CanceledError') return;
        setState({ loading: false, profile: null, fallback: error.response?.status === 404 });
      });
    return () => controller.abort();
  }, [slug]);

  if (state.fallback) return <SiteRoot />;
  if (state.loading) return <div className="min-h-screen animate-pulse bg-[#f5f2ec]" />;
  if (!state.profile) return <div className="grid min-h-screen place-items-center bg-[#f5f2ec] px-6 text-center text-ink-700">This profile is temporarily unavailable.</div>;
  return <PublicProfilePage profile={state.profile} />;
};
