import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Aperture, Camera, FileText, Sparkles } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const HIGHLIGHTS = [
  { icon: FileText, title: 'Proposal-grade documents', copy: 'Quotations, estimates and invoices from one place.' },
  { icon: Camera, title: 'Packages that fill themselves', copy: 'Pick a package — pricing and deliverables follow.' },
  { icon: Sparkles, title: 'Print-ready PDFs', copy: 'A4, vector, selectable text, on your letterhead.' },
];

/**
 * Split-screen shell for signed-out routes: an editorial brand panel on the
 * left (dark, gold-accented, echoing the letterhead) and the form on the right.
 */
export const AuthLayout = () => (
  <div className="flex min-h-screen bg-white">
    <aside className="relative hidden w-[46%] shrink-0 overflow-hidden bg-ink-950 lg:flex lg:flex-col">
      {/* Warm gold light bloom + fine grid, echoing the printed letterhead. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(120% 90% at 12% 0%, rgba(184,134,59,0.30) 0%, transparent 55%), radial-gradient(90% 70% at 100% 100%, rgba(92,102,80,0.26) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
        <Logo inverted size="md" />

        <div className="max-w-md">
          <Aperture className="mb-8 h-9 w-9 text-brand-400/80" aria-hidden="true" />
          <h2 className="font-display text-4xl font-medium leading-[1.15] text-white">
            The studio desk for
            <span className="block text-brand-300">every shoot you sell.</span>
          </h2>
          <p className="mt-5 text-pretty text-md leading-relaxed text-white/55">
            Clients, packages, documents and payments — organised the way a
            production house actually works.
          </p>

          <ul className="mt-12 space-y-6">
            {HIGHLIGHTS.map((item, index) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.09, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="flex gap-4"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] ring-1 ring-inset ring-white/10">
                  <item.icon className="h-4 w-4 text-brand-300" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-medium text-white/90">{item.title}</p>
                  <p className="mt-0.5 text-sm text-white/45">{item.copy}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p
          className="text-[0.5625rem] uppercase text-white/25"
          style={{ letterSpacing: '0.28em' }}
        >
          Capturing Moments, Creating Impact
        </p>
      </div>
    </aside>

    <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 lg:hidden">
          <Logo size="md" />
        </div>
        <Outlet />
      </div>
    </main>
  </div>
);
