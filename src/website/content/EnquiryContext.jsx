import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const EnquiryContext = createContext(null);

/**
 * Carries the "which package did they click?" signal from the Packages section
 * to the Contact form.
 *
 * The spec requires that pressing Enquire Now on a package opens the enquiry
 * form with that package already selected, and that nothing is typed twice. A
 * context is the honest way to express that: the two sections are siblings, so
 * neither can own the state, and threading a prop through the page component
 * would couple every section in between to a concern none of them have.
 */
export const EnquiryProvider = ({ children }) => {
  const [selectedPackageId, setSelectedPackageId] = useState('');

  const enquireAbout = useCallback((packageId) => {
    setSelectedPackageId(packageId ?? '');

    const target = document.getElementById('contact');
    if (!target) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

    /*
     * Scrolling alone strands screen-reader and keyboard users, who have no idea
     * the page moved. Move focus to the form's first control as well.
     * `preventScroll` stops the browser fighting the smooth scroll above.
     */
    window.setTimeout(() => {
      document.getElementById('enquiry-name')?.focus({ preventScroll: true });
    }, reduced ? 0 : 600);
  }, []);

  const value = useMemo(
    () => ({ selectedPackageId, setSelectedPackageId, enquireAbout }),
    [selectedPackageId, enquireAbout],
  );

  return <EnquiryContext.Provider value={value}>{children}</EnquiryContext.Provider>;
};

export const useEnquiry = () => {
  const context = useContext(EnquiryContext);
  if (!context) throw new Error('useEnquiry must be used inside <EnquiryProvider>');
  return context;
};
