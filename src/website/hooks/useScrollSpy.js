import { useEffect, useState } from 'react';

/**
 * Tracks which section is currently under the header.
 *
 * Uses a top-biased rootMargin rather than "most visible" scoring: on a page of
 * full-height sections the naive approach flickers between two neighbours at
 * the exact midpoint of a scroll. Anchoring the detection band just below the
 * sticky header matches what the reader actually perceives as "the section I am
 * looking at".
 */
export const useScrollSpy = (ids, { offset = 96 } = {}) => {
  const [activeId, setActiveId] = useState(ids[0] ?? null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (nodes.length === 0) return undefined;

    const visible = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        });

        // Preserve document order so ties resolve downward, never randomly.
        const current = ids.find((id) => visible.has(id));
        if (current) setActiveId(current);
      },
      {
        rootMargin: `-${offset}px 0px -55% 0px`,
        threshold: [0, 0.01, 0.25],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [ids, offset]);

  return activeId;
};
