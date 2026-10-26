import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Phone } from 'lucide-react';

export const EnquiryFollowUp = ({ links, onClose }) => {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const nodes = [...panel.current.querySelectorAll('button, a[href]')];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [onClose]);
  const action = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent';
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="enquiry-success-title" aria-describedby="enquiry-success-description" onClick={event => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-site-paper p-6 text-site-ink shadow-2xl sm:p-8">
        <h2 id="enquiry-success-title" className="font-serif text-3xl">Thank you for your enquiry</h2>
        <p id="enquiry-success-description" className="mt-4 text-site-muted">Your enquiry has been sent. We’ll be in touch shortly. You can also contact us directly.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" className={`${action} border border-site-line`} onClick={onClose}>Cancel</button>
          {links.whatsapp && <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={`${action} bg-site-ink text-white`}><MessageCircle className="h-4 w-4"/>Contact through WhatsApp</a>}
          {links.call && <a href={links.call} className={`${action} border border-site-line`}><Phone className="h-4 w-4"/>Call</a>}
        </div>
      </div>
    </div>, document.body,
  );
};
