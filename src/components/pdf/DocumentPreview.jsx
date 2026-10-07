import { useCallback, useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui';

// A4 at 96dpi. The template lays out at exactly this width, so the preview
// must scale rather than clip — otherwise the right-hand money column is cut off.
const SHEET_WIDTH = 794;
const SHEET_HEIGHT = 1123;

/**
 * Renders the document's real print markup, scaled to fit its container.
 *
 * The markup arrives as a string (fetched with auth) and is injected via
 * `srcDoc`. The sandbox grants `allow-same-origin` but deliberately NOT
 * `allow-scripts`: with scripting disabled nothing inside can act on that
 * origin, and same-origin access is what lets us measure the real content
 * height so a long document is not silently cut off at page one.
 */
export const DocumentPreview = ({ html, loading, className }) => {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(SHEET_HEIGHT);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      // Never scale up past 1: a small sheet blown up just looks blurry.
      setScale(Math.min(entry.contentRect.width / SHEET_WIDTH, 1));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** Measures the rendered sheet, rounded up to whole A4 pages. */
  const measure = useCallback(() => {
    const body = frameRef.current?.contentDocument?.body;
    if (!body) return;

    const natural = Math.max(body.scrollHeight, SHEET_HEIGHT);
    setContentHeight(Math.ceil(natural / SHEET_HEIGHT) * SHEET_HEIGHT);
  }, []);

  // Re-measure when the markup changes; fonts settle slightly after load and
  // can push content onto another page.
  useEffect(() => {
    if (!html) return undefined;

    const timer = setTimeout(measure, 250);
    return () => clearTimeout(timer);
  }, [html, measure]);

  return (
    <div ref={containerRef} className={className}>
      <div className="relative overflow-hidden bg-ink-100" style={{ height: contentHeight * scale }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <Spinner className="h-6 w-6 text-brand-500" />
          </div>
        )}

        <iframe
          ref={frameRef}
          title="Document preview"
          srcDoc={html}
          sandbox="allow-same-origin"
          scrolling="no"
          onLoad={measure}
          style={{
            width: SHEET_WIDTH,
            height: contentHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            border: 0,
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};
