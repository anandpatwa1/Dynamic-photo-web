import { useTheme } from '../../hooks/useTheme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QuoteCanvas } from '../../components/QuoteCanvas';
import { DESIGN_WIDTH } from '../../utils/engine/layout';
import { buildSampleQuote, SAMPLE_STUDIO } from '../../utils/sampleQuote';

/** Live preview of a theme with sample data, scaled to `width`. */
export const ThemePreview = ({ theme: summary, dayCount = 3, width = 260, quote: realQuote, thumbnailOnly = false }) => {
  const host = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (thumbnailOnly && summary.thumbnail) return undefined;
    const observer = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, [thumbnailOnly, summary.thumbnail]);
  const { theme, error } = useTheme(summary, visible && !(thumbnailOnly && summary.thumbnail));
  const sample = useMemo(() => buildSampleQuote(dayCount), [dayCount]);
  const quote = realQuote ?? sample;
  const [plan, setPlan] = useState(null);
  const scale = width / DESIGN_WIDTH;
  if(thumbnailOnly&&summary.thumbnail)return <img src={summary.thumbnail} alt={`${summary.name} sample quotation`} style={{width,maxWidth:'100%',height:'auto'}} loading="lazy"/>;
  return (
    <div ref={host} style={{ width, flexShrink: 0, marginInline: 'auto', height: (plan?.height ?? DESIGN_WIDTH) * scale, overflow: 'hidden', position: 'relative' }} className="rounded-lg ring-1 ring-ink-200">
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, pointerEvents: 'none' }}>
        {theme ? <QuoteCanvas quote={quote} theme={theme} studio={SAMPLE_STUDIO} mode="view" onPlan={setPlan} /> : <p style={{ padding: 32 }}>{error ?? 'Loading preview…'}</p>}
      </div>
    </div>
  );
};
