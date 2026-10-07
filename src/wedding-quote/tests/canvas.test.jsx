import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { QuoteCanvas } from '../components/QuoteCanvas';
import { BUILTIN_THEMES } from '../utils/engine/builtinThemes';
import { buildSampleQuote, SAMPLE_STUDIO } from '../utils/sampleQuote';

vi.mock('../utils/fonts', () => ({
  registerBundledFonts: () => Promise.resolve(),
  registerThemeFonts: () => Promise.resolve(),
  fontStack: () => 'serif',
}));

afterEach(cleanup);

beforeAll(() => {
  // jsdom has no layout; contentEditable focus + selection stubs.
  window.requestAnimationFrame = (cb) => cb();
  document.createRange = () => ({ selectNodeContents() {} });
  window.getSelection = () => ({ removeAllRanges() {}, addRange() {} });
});

describe('QuoteCanvas', () => {
  for (const theme of BUILTIN_THEMES) {
    for (const n of [1, 3, 7, 10]) {
      it(`${theme.key}: renders every date and line for ${n} dates (nothing dropped)`, () => {
        const q = buildSampleQuote(n);
        const { container } = render(<QuoteCanvas quote={q} theme={theme} studio={SAMPLE_STUDIO} />);
        const text = container.textContent;
        expect(text).toContain(q.packageSnapshot.name);
        expect(text).toContain('Deliverables');
        expect(text).toContain('300 Photos Album');
        expect(container.querySelectorAll('[data-wq-block="dates"] > div > div').length).toBe(n);
        // Nothing in the content column hides overflow → no text clipping inside blocks.
        const clipped = [...container.querySelectorAll('[data-wq-block] *')].filter((el) => el.style.overflow === 'hidden');
        expect(clipped).toHaveLength(0);
      });
    }
  }

  it('keyboard edit: focusable textboxes in print order; Enter edits, Enter commits, Escape cancels', () => {
    const onEdit = vi.fn();
    render(<QuoteCanvas quote={buildSampleQuote(1)} theme={BUILTIN_THEMES[0]} studio={SAMPLE_STUDIO} mode="edit" onEditText={onEdit} />);
    const boxes = screen.getAllByRole('textbox');
    const labels = boxes.map((b) => b.getAttribute('aria-label'));
    expect(labels.indexOf('Title')).toBeLessThan(labels.indexOf('Subtitle'));
    expect(labels.indexOf('Subtitle')).toBeLessThan(labels.indexOf('Selling price'));
    expect(labels.indexOf('Selling price')).toBeLessThan(labels.indexOf('Footer'));
    boxes.forEach((b) => expect(b.tabIndex).toBe(0));

    const title = screen.getByRole('textbox', { name: 'Title' });
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(title.getAttribute('contenteditable')).toBe('true');
    title.innerText = 'Royal Wedding';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onEdit).toHaveBeenCalledWith('title', 'Royal Wedding');

    const footer = screen.getByRole('textbox', { name: 'Footer' });
    fireEvent.keyDown(footer, { key: 'Enter' });
    footer.innerText = 'changed';
    fireEvent.keyDown(footer, { key: 'Escape' });
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('view mode exposes no editable text', () => {
    render(<QuoteCanvas quote={buildSampleQuote(3)} theme={BUILTIN_THEMES[1]} studio={SAMPLE_STUDIO} mode="view" />);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});
