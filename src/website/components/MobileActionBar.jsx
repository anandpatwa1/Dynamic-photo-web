import { MessageCircle, Phone, Send } from 'lucide-react';
import { useSiteContent } from '../content/SiteContent';
import { composePage } from '../navigation';

/**
 * Three big thumb-reach buttons pinned to the bottom of a phone screen.
 *
 * Most visitors arrive on a phone, and for a studio the next step is a call or
 * a WhatsApp message, not scrolling to a form. The numbers come from the
 * Contact screen in the admin, so changing them there changes this bar. It is
 * hidden from the tablet size up, where the header already carries the button.
 */
export const MobileActionBar = () => {
  const content = useSiteContent();
  const contact = content?.contact;
  const phone = contact?.phone?.replace(/[^\d+]/g, '');
  // wa.me wants digits only, with the country code and no leading + or zeros.
  const whatsapp = contact?.whatsapp?.replace(/\D/g, '').replace(/^0+/, '');
  const hasContactSection = composePage(content).some((entry) => entry.type === 'builtin' && entry.key === 'contact');
  const enquiryLabel = content?.settings?.enquiryLabel || 'Enquire';

  if (!phone && !whatsapp && !hasContactSection) return null;

  const base =
    'flex min-h-[48px] flex-1 items-center justify-center gap-2 px-2 text-[0.8125rem] font-medium uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-site-accent';

  return (
    <nav
      aria-label="Quick contact"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-site-line bg-site-paper/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
    >
      {phone && (
        <a href={`tel:${phone}`} className={`${base} text-site-ink`}>
          <Phone className="h-4 w-4" aria-hidden="true" /> Call
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border-l border-site-line text-site-ink`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
        </a>
      )}
      {hasContactSection && (
        <a href="/#contact" className={`${base} ${phone || whatsapp ? 'border-l border-site-line' : ''} bg-site-ink text-white`}>
          <Send className="h-4 w-4" aria-hidden="true" /> {enquiryLabel}
        </a>
      )}
    </nav>
  );
};

export default MobileActionBar;
