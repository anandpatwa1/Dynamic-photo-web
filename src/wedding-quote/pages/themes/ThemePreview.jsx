import { useMemo, useState } from 'react';
import { QuoteCanvas } from '../../components/QuoteCanvas';
import { DESIGN_WIDTH } from '../../utils/engine/layout';
import { buildSampleQuote, SAMPLE_STUDIO } from '../../utils/sampleQuote';

/** Live preview of a theme with sample data, scaled to `width`. */
export const ThemePreview = ({ theme, dayCount = 3, width = 260 }) => {
  const quote = useMemo(() => buildSampleQuote(dayCount), [dayCount]);
  const [plan, setPlan] = useState(null);
  const scale = width / DESIGN_WIDTH;
  return (
    <div style={{ width, height: (plan?.height ?? DESIGN_WIDTH) * scale, overflow: 'hidden', position: 'relative' }} className="rounded-lg ring-1 ring-ink-200">
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, pointerEvents: 'none' }}>
        <QuoteCanvas quote={quote} theme={theme} studio={SAMPLE_STUDIO} mode="view" onPlan={setPlan} />
      </div>
    </div>
  );
};
