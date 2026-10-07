/**
 * QuoteCanvas — the ONE renderer for every theme (A9) and every surface:
 * library previews, the editor, and JPG export (A12: what you see is what
 * you get). No per-theme code: everything comes from theme.definition.
 *
 * All styling is inline (no Tailwind) so the DOM can be serialised into an
 * SVG <foreignObject> for export without losing anything.
 *
 * Design space is 1080px wide. Font sizes are `calc(var(--wq-s) * Npx)`,
 * where --wq-s is the fit scale found by planLayout (A10).
 */
import { forwardRef, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildPrintModel } from '../utils/engine/display';
import { DESIGN_WIDTH, planLayout } from '../utils/engine/layout';
import { normalizeNote } from '../utils/engine/notes';
import { fontStack, registerBundledFonts, registerThemeFonts } from '../utils/fonts';
import { cssUrl, resolveAsset } from '../utils/themeAssets';
import { T } from '../constants/strings';

export const BLOCK_IDS = ['title', 'subtitle', 'dates', 'deliverables', 'addOn', 'price', 'notes', 'footer'];

const sz = (n) => `calc(var(--wq-s, 1) * ${Math.round(n * 100) / 100}px)`;

// ---------------------------------------------------------------- editable text
const EditableText = ({ path, value, editable, onCommit, style, placeholder, as: Tag = 'div', label }) => {
  const ref = useRef(null);
  const [editing, setEditing] = useState(false);
  // Ref mirror: blur fires synchronously after Enter/Escape, before React re-renders.
  const editingRef = useRef(false);

  const start = () => {
    if (!editable) return;
    editingRef.current = true;
    setEditing(true);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  };

  const finish = (commit) => {
    const el = ref.current;
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);
    if (!el) return;
    const text = el.innerText.replace(/\u00a0/g, ' ').replace(/\n+$/, '');
    if (commit && text !== value) onCommit?.(path, text);
    else el.innerText = value ?? '';
  };

  if (!editable) return <Tag style={style}>{value}</Tag>;

  const showPlaceholder = !value && !editing;
  return (
    <Tag
      ref={ref}
      role="textbox"
      tabIndex={0}
      aria-label={label ?? path}
      data-wq-edit={path}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={(e) => { e.stopPropagation(); if (!editing) start(); }}
      onKeyDown={(e) => {
        if (!editing && (e.key === 'Enter' || e.key === 'F2')) { e.preventDefault(); start(); return; }
        if (editing && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(true); ref.current?.blur(); }
        if (editing && e.key === 'Escape') { e.preventDefault(); finish(false); ref.current?.blur(); }
      }}
      onBlur={() => finish(true)}
      style={{
        ...style,
        cursor: 'text',
        outline: editing ? '2px solid rgba(59,130,246,0.7)' : 'none',
        outlineOffset: 4,
        borderRadius: 4,
        minWidth: 24,
        opacity: showPlaceholder ? 0.35 : style?.opacity,
      }}
    >
      {showPlaceholder ? placeholder ?? T.editor.empty : value}
    </Tag>
  );
};

// ---------------------------------------------------------------- block wrapper
const Block = ({ id, theme, override = {}, styleKey, safeWidth, mode, selected, onSelect, onOverride, zoom = 1, children, align: forcedAlign }) => {
  const def = theme.definition;
  const bs = def.blocks?.[styleKey] ?? {};
  const [drag, setDrag] = useState(null); // live preview while dragging
  const ov = { ...override, ...(drag ?? {}) };
  const align = forcedAlign ?? bs.align ?? 'center';
  const widthPx = Math.min(safeWidth, ov.w ?? (bs.widthPct ? (safeWidth * bs.widthPct) / 100 : safeWidth));
  const editing = mode === 'edit';

  const startDrag = (kind) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const base = { x: override.x ?? 0, y: override.y ?? 0, w: widthPx, h: override.h ?? 0 };
    let latest = null;
    const move = (ev) => {
      const dx = (ev.clientX - sx) / zoom;
      const dy = (ev.clientY - sy) / zoom;
      const snap = (v) => (Math.abs(v) < 12 ? 0 : Math.round(v / 4) * 4);
      if (kind === 'w') latest = { w: Math.max(80, Math.min(safeWidth, Math.round(base.w + dx * (align === 'center' ? 2 : 1)))) };
      if (kind === 'h') latest = { h: Math.max(0, Math.round(base.h + dy)) };
      if (kind === 'move') latest = { x: snap(base.x + dx), y: snap(base.y + dy) };
      setDrag(latest);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDrag(null);
      if (latest) onOverride?.(id, latest);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const margin = align === 'left' ? '0 auto 0 0' : align === 'right' ? '0 0 0 auto' : '0 auto';
  const handle = { position: 'absolute', background: '#3B82F6', borderRadius: 4, zIndex: 5 };

  return (
    <div
      data-wq-block={id}
      onClick={editing ? (e) => { e.stopPropagation(); onSelect?.(id); } : undefined}
      style={{
        position: 'relative',
        width: widthPx,
        maxWidth: '100%',
        minHeight: ov.h ? ov.h : undefined,
        margin,
        transform: ov.x || ov.y ? `translate(${ov.x ?? 0}px, ${ov.y ?? 0}px)` : undefined,
        textAlign: align,
        boxShadow: editing && selected ? '0 0 0 2px rgba(59,130,246,0.85)' : undefined,
        borderRadius: 6,
        ['--wq-b']: ov.fontScale ?? 1,
      }}
    >
      {children}
      {editing && selected && (
        <>
          <div title="Drag to move" onPointerDown={startDrag('move')} style={{ ...handle, left: -14, top: -14, width: 22, height: 22, cursor: 'move' }} />
          <div title="Drag to change width" onPointerDown={startDrag('w')} style={{ ...handle, right: -7, top: '50%', width: 10, height: 36, marginTop: -18, cursor: 'ew-resize' }} />
          <div title="Drag to change height" onPointerDown={startDrag('h')} style={{ ...handle, bottom: -7, left: '50%', width: 36, height: 10, marginLeft: -18, cursor: 'ns-resize' }} />
          {drag && drag.x === 0 && (
            <div style={{ position: 'absolute', left: '50%', top: -4000, bottom: -4000, width: 1, background: 'rgba(236,72,153,0.8)', pointerEvents: 'none' }} />
          )}
        </>
      )}
    </div>
  );
};

/** Font size for a block: theme size × fit scale × block font scale. */
const fs = (n) => `calc(var(--wq-s, 1) * var(--wq-b, 1) * ${n}px)`;

const boxStyle = (bs, colors, fallbackBg, fallbackBorder) => ({
  background: bs.bg ?? fallbackBg ?? 'transparent',
  border: (bs.borderWidth ?? 0) > 0 ? `${bs.borderWidth}px solid ${bs.borderColor ?? fallbackBorder ?? colors.accent}` : 'none',
  borderRadius: bs.radius ?? 0,
  padding: `${sz(bs.paddingY ?? 0)} ${sz(bs.paddingX ?? 0)}`,
});

// ---------------------------------------------------------------- main renderer
export const QuoteCanvas = memo(
  forwardRef(function QuoteCanvas(
    { quote, theme, studio, mode = 'view', selectedBlock, onSelectBlock, onEditText, onBlockOverride, onPlan, plan: forcedPlan, zoom = 1 },
    outerRef,
  ) {
    const def = theme.definition;
    const colors = def.colors;
    const typo = def.typography;
    const gap = def.density?.gapScale ?? 1;
    const W = DESIGN_WIDTH;
    const safe = def.safeArea;
    const px = (pct) => (pct / 100) * W;
    const padTop = px(safe.top);
    const padBottom = px(safe.bottom);
    const padLeft = px(safe.left);
    const padRight = px(safe.right);
    const safeWidth = W - padLeft - padRight;
    const editable = mode === 'edit';
    // Capital letters for the main lines (package name, dates, add-on). Script
    // lines are left alone: capital letters in a script font are unreadable.
    const caps = quote.layout?.options?.caps !== false;
    const capsFor = (slot) => (caps && slot !== 'script' ? { textTransform: 'uppercase' } : {});
    const overrides = quote.layout?.blockOverrides ?? {};

    const model = useMemo(() => buildPrintModel(quote, { dateStyle: def.dateStyle, studio }), [quote, def.dateStyle, studio]);

    const [fontsVersion, setFontsVersion] = useState(0);
    useEffect(() => {
      let alive = true;
      Promise.all([registerBundledFonts(), registerThemeFonts(theme)]).then(() => alive && setFontsVersion((v) => v + 1));
      return () => { alive = false; };
    }, [theme]);

    const columnRef = useRef(null);
    const [plan, setPlan] = useState(forcedPlan ?? { scale: 1, height: W, warning: null });

    // A10: find the font scale and canvas height. Synchronous DOM measuring
    // (set --wq-s, read offsetHeight) so the binary search completes before paint.
    useLayoutEffect(() => {
      const el = columnRef.current;
      if (!el) return;
      if (forcedPlan) {
        el.style.setProperty('--wq-s', String(forcedPlan.scale));
        setPlan(forcedPlan);
        return;
      }
      const measure = (s) => {
        el.style.setProperty('--wq-s', String(s));
        return el.offsetHeight + padTop + padBottom;
      };
      const next = planLayout(measure, {
        width: W,
        dayCount: model.dayCount,
        minFontScale: def.density?.minFontScale ?? 0.6,
        maxFontScale: def.density?.maxFontScale ?? 1.2,
      });
      el.style.setProperty('--wq-s', String(next.scale));
      setPlan((prev) => (prev.scale === next.scale && prev.height === next.height && prev.warning === next.warning ? prev : next));
    }, [model, theme, overrides, fontsVersion, forcedPlan, padTop, padBottom, def.density, W]);

    useEffect(() => { onPlan?.(plan); }, [plan, onPlan]);

    const commit = useCallback((path, text) => onEditText?.(path, text), [onEditText]);
    const blockProps = (id, styleKey) => ({
      id,
      styleKey,
      theme,
      override: overrides[id],
      safeWidth,
      mode,
      zoom,
      selected: selectedBlock === id,
      onSelect: onSelectBlock,
      onOverride: onBlockOverride,
    });
    const B = (key) => def.blocks?.[key] ?? {};
    const font = (slot) => fontStack(theme, slot);
    const textOf = (bs, defaults) => ({
      fontFamily: font(bs.font ?? defaults.font),
      color: bs.color ?? defaults.color,
      textTransform: bs.uppercase ? 'uppercase' : undefined,
      letterSpacing: bs.letterSpacing ? `${bs.letterSpacing}px` : undefined,
    });
    const wrap = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'normal', margin: 0, lineHeight: 1.22 };
    const divider = resolveAsset(theme, def.dividers?.image);
    const Divider = () =>
      divider ? (
        <div aria-hidden="true" style={{ width: '62%', margin: `${sz(14 * gap)} auto`, aspectRatio: '15 / 1', backgroundImage: cssUrl(divider), backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
      ) : (
        <div style={{ height: sz(18 * gap) }} />
      );

    // ---------------------------------------------------------------- ornaments
    const ornaments = (def.ornaments ?? []).map((o, i) => {
      const url = resolveAsset(theme, o.image);
      if (!url) return null;
      const w = px(o.widthPct);
      const ox = px(o.offsetXPct ?? 0);
      const oy = px(o.offsetYPct ?? 0);
      const base = { position: 'absolute', width: w, opacity: o.opacity ?? 1, backgroundImage: cssUrl(url), backgroundRepeat: 'no-repeat', pointerEvents: 'none' };
      const square = { aspectRatio: '1 / 1', backgroundSize: 'contain' };
      const styles = {
        left: { ...base, left: ox, top: oy, bottom: -oy, backgroundSize: 'cover', backgroundPosition: 'left center' },
        right: { ...base, right: -ox, top: oy, bottom: -oy, backgroundSize: 'cover', backgroundPosition: 'right center' },
        top: { ...base, left: '50%', marginLeft: -w / 2 + ox, top: oy, aspectRatio: '4.4 / 1', backgroundSize: 'contain', backgroundPosition: 'center top' },
        bottom: { ...base, left: '50%', marginLeft: -w / 2 + ox, bottom: -oy, aspectRatio: '4.4 / 1', backgroundSize: 'contain', backgroundPosition: 'center bottom' },
        'top-left': { ...base, ...square, left: ox, top: oy, backgroundPosition: 'left top' },
        'top-right': { ...base, ...square, right: -ox, top: oy, backgroundPosition: 'right top' },
        'bottom-left': { ...base, ...square, left: ox, bottom: -oy, backgroundPosition: 'left bottom' },
        'bottom-right': { ...base, ...square, right: -ox, bottom: -oy, backgroundPosition: 'right bottom' },
      };
      return <div key={`orn-${i}`} aria-hidden="true" style={styles[o.anchor]} />;
    });

    const bgUrl = resolveAsset(theme, def.canvas.backgroundImage);
    const frameUrl = resolveAsset(theme, def.canvas.frame?.image);
    const inset = def.canvas.frame?.inset ?? 0;

    // ---------------------------------------------------------------- date rows
    const rowStyle = B('dateRow');
    const tileBg = colors.dateTileBg ?? colors.accent;
    const tileText = colors.dateTileText ?? '#ffffff';
    const dateRow = (group) => {
      const align = rowStyle.align ?? 'center';
      const labelText = (
        <EditableText
          path={group.labelPath}
          value={group.label}
          editable={editable}
          onCommit={commit}
          style={{ ...wrap, ...capsFor('number'), fontFamily: font('number'), color: colors.title, fontSize: fs(typo.dateSize), fontWeight: 700 }}
        />
      );
      const lines = group.lines.map((line) => (
        <EditableText
          key={line.path}
          path={line.path}
          value={line.text}
          editable={editable}
          onCommit={commit}
          style={{ ...wrap, fontFamily: font('body'), color: colors.text, fontSize: fs(typo.itemSize), fontWeight: 600, marginTop: sz(4) }}
        />
      ));
      const emptyLine = !group.lines.length && editable ? <div style={{ ...wrap, color: colors.muted, fontSize: fs(typo.itemSize * 0.8), fontFamily: font('body') }}>—</div> : null;
      const frame = { ...boxStyle(rowStyle, colors, undefined, colors.accent), marginTop: sz(14 * gap) };

      if (def.dateStyle === 'tile' && group.tile) {
        return (
          <div key={group.key} style={{ ...frame, display: 'flex', alignItems: 'center', gap: sz(22), textAlign: 'left' }}>
            <div style={{ flex: '0 0 auto', background: tileBg, color: tileText, borderRadius: sz(16), padding: `${sz(8)} ${sz(16)}`, textAlign: 'center', minWidth: sz(typo.dateSize * 2.4) }}>
              <div style={{ fontFamily: font('number'), fontSize: fs(typo.dateSize * 1.45), fontWeight: 700, lineHeight: 1 }}>{group.tile.big}</div>
              <div style={{ ...capsFor('number'), fontFamily: font('number'), fontSize: fs(typo.dateSize * 0.62), letterSpacing: 2, lineHeight: 1.3 }}>{group.tile.small}</div>
              {group.tile.year && <div style={{ fontFamily: font('body'), fontSize: fs(typo.dateSize * 0.45), lineHeight: 1.2 }}>{group.tile.year}</div>}
            </div>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              {editable && <EditableText path={group.labelPath} value={group.label} editable onCommit={commit} label="Date label" style={{ ...wrap, fontSize: fs(typo.itemSize * 0.6), color: colors.muted, fontFamily: font('body') }} />}
              {lines}
              {emptyLine}
            </div>
          </div>
        );
      }
      if (def.dateStyle === 'pill' || (def.dateStyle === 'tile' && !group.tile)) {
        return (
          <div key={group.key} style={{ ...frame, textAlign: align }}>
            <div style={{ display: 'inline-block', background: def.dateStyle === 'tile' ? tileBg : 'transparent', color: def.dateStyle === 'tile' ? tileText : colors.title, border: `2px solid ${colors.accent}`, borderRadius: 999, padding: `${sz(4)} ${sz(22)}` }}>
              <EditableText path={group.labelPath} value={group.label} editable={editable} onCommit={commit} style={{ ...wrap, ...capsFor('number'), fontFamily: font('number'), fontSize: fs(typo.dateSize * 0.85), fontWeight: 700, color: 'inherit' }} />
            </div>
            {lines}
            {emptyLine}
          </div>
        );
      }
      return (
        <div key={group.key} style={{ ...frame, textAlign: align }}>
          {labelText}
          {lines}
          {emptyLine}
        </div>
      );
    };

    // ---------------------------------------------------------------- blocks
    const titleBs = B('title');
    const subBs = B('subtitle');
    const boxBs = B('deliverablesBox');
    const badgeBs = B('addOnBadge');
    const priceBs = B('priceBox');
    const notesBs = B('notes');
    const footBs = B('footer');

    const showBlock = (has) => has || editable;

    const content = (
      <>
        {showBlock(model.title) && (
          <Block {...blockProps('title', 'title')}>
            <EditableText path="title" value={model.title} editable={editable} onCommit={commit} label="Title"
              style={{ ...wrap, ...textOf(titleBs, { font: 'title', color: colors.title }), ...capsFor(titleBs.font ?? 'title'), ...(caps && !titleBs.letterSpacing ? { letterSpacing: '1px' } : {}), fontSize: fs(typo.titleSize), fontWeight: 700, lineHeight: 1.08 }} />
          </Block>
        )}
        {showBlock(model.subtitle || model.description) && (
          <Block {...blockProps('subtitle', 'subtitle')}>
            <EditableText path="subtitle" value={model.subtitle} editable={editable} onCommit={commit} label="Subtitle"
              style={{ ...wrap, ...textOf(subBs, { font: 'script', color: colors.accent }), ...capsFor(subBs.font ?? 'script'), fontSize: fs(typo.subtitleSize), marginTop: sz(6) }} />
            {(model.description || editable) && (
              <EditableText path="description" value={model.description} editable={editable} onCommit={commit} label="Description" placeholder={editable ? '(description)' : undefined}
                style={{ ...wrap, fontFamily: font('body'), color: colors.muted, fontSize: fs(typo.itemSize * 0.8), marginTop: sz(6) }} />
            )}
          </Block>
        )}
        <Divider />
        {showBlock(model.dates.length) && (
          <Block {...blockProps('dates', 'dateRow')} align="center">
            <div style={{ textAlign: rowStyle.align ?? 'center' }}>
              {model.dates.length ? model.dates.map(dateRow) : <div style={{ ...wrap, color: colors.muted, fontFamily: font('body'), fontSize: fs(typo.itemSize) }}>—</div>}
            </div>
          </Block>
        )}
        {showBlock(model.deliverables.length) && (
          <Block {...blockProps('deliverables', 'deliverablesBox')}>
            <div style={{ ...boxStyle(boxBs, colors, colors.boxBg, colors.boxBorder ?? colors.badgeBorder), marginTop: sz(26 * gap), textAlign: boxBs.align ?? 'center' }}>
              <EditableText path="deliverablesHeading" value={model.deliverablesHeading} editable={editable} onCommit={commit} label="Deliverables heading"
                style={{ ...wrap, fontFamily: font('script'), color: colors.accent, fontSize: fs(typo.deliverableSize * 1.35) }} />
              {model.deliverables.map((line) => (
                <EditableText key={line.id} path={`deliverable.${line.id}`} value={line.text} editable={editable} onCommit={commit}
                  style={{ ...wrap, fontFamily: font('body'), color: colors.text, fontSize: fs(typo.deliverableSize), fontWeight: 600, marginTop: sz(4) }} />
              ))}
            </div>
          </Block>
        )}
        {model.addOn && (
          <Block {...blockProps('addOn', 'addOnBadge')}>
            <div style={{ ...boxStyle({ borderWidth: 2, radius: 999, paddingX: 30, paddingY: 12, ...badgeBs }, colors, colors.badgeBg, colors.badgeBorder), display: 'inline-block', marginTop: sz(24 * gap), color: badgeBs.color ?? colors.text, maxWidth: '100%' }}>
              {(model.addOn.badge || editable) && (
                <EditableText as="span" path="addOn.badge" value={model.addOn.badge} editable={editable} onCommit={commit} placeholder="(badge)"
                  style={{ ...wrap, ...capsFor('number'), display: 'inline-block', fontFamily: font('number'), fontWeight: 700, fontSize: fs(typo.itemSize * 0.72), letterSpacing: 2, background: colors.accent, color: '#fff', borderRadius: 999, padding: `${sz(2)} ${sz(12)}`, marginRight: sz(10) }} />
              )}
              <EditableText as="span" path="addOn.title" value={model.addOn.title} editable={editable} onCommit={commit}
                style={{ ...wrap, ...capsFor('title'), fontFamily: font('title'), fontWeight: 700, fontSize: fs(typo.itemSize), color: 'inherit' }} />
              {(model.addOn.text || editable) && (
                <EditableText path="addOn.text" value={model.addOn.text} editable={editable} onCommit={commit} placeholder="(text)"
                  style={{ ...wrap, fontFamily: font('body'), fontSize: fs(typo.itemSize * 0.82), color: 'inherit', marginTop: sz(2) }} />
              )}
              {(model.addOn.price || editable) && (
                <EditableText path="addOn.price" value={model.addOn.price} editable={editable} onCommit={commit} placeholder="(price)"
                  style={{ ...wrap, fontFamily: font('number'), fontWeight: 700, fontSize: fs(typo.itemSize * 0.95), color: colors.accent, marginTop: sz(4) }} />
              )}
            </div>
          </Block>
        )}
        <Block {...blockProps('price', 'priceBox')}>
          <div style={{ marginTop: sz(24 * gap), textAlign: priceBs.align ?? 'center' }}>
            {(model.price.showMrp || editable) && (
              <EditableText path="price.mrp" value={model.price.mrpText} editable={editable} onCommit={commit} label="MRP"
                style={{ ...wrap, fontFamily: font('number'), color: colors.priceStrike, fontSize: fs(typo.mrpSize), textDecoration: 'line-through', textDecorationThickness: 3, opacity: model.price.showMrp ? 1 : 0.35 }} />
            )}
            <EditableText path="price.selling" value={model.price.sellingText} editable={editable} onCommit={commit} label="Selling price"
              style={{ ...wrap, fontFamily: font('number'), color: colors.priceMain, fontSize: fs(typo.priceSize), fontWeight: 700, lineHeight: 1.05 }} />
          </div>
        </Block>
        {showBlock(model.notes.length) && (
          <Block {...blockProps('notes', 'notes')}>
            <div style={{ marginTop: sz(18 * gap), textAlign: notesBs.align ?? 'center' }}>
              {model.notes.map((note) => {
                const path = `note.${normalizeNote(note)}`;
                const value = quote.textOverrides?.[path] ?? note;
                return (
                  <EditableText key={path} path={path} value={value} editable={editable} onCommit={commit}
                    style={{ ...wrap, fontFamily: font('body'), color: notesBs.color ?? colors.muted, fontSize: fs(typo.noteSize ?? 24), fontStyle: 'italic' }} />
                );
              })}
              {!model.notes.length && editable && <div style={{ ...wrap, color: colors.muted, opacity: 0.35, fontSize: fs(22), fontFamily: font('body') }}>({T.editor.notes})</div>}
            </div>
          </Block>
        )}
        {showBlock(model.footer) && (
          <Block {...blockProps('footer', 'footer')}>
            <EditableText path="footer" value={model.footer} editable={editable} onCommit={commit} label="Footer"
              style={{ ...wrap, ...textOf(footBs, { font: 'body', color: colors.muted }), fontSize: fs(typo.footerSize ?? 24), marginTop: sz(22 * gap), fontWeight: 600 }} />
          </Block>
        )}
      </>
    );

    const availH = plan.height - padTop - padBottom;

    return (
      <div
        ref={outerRef}
        data-wq-canvas=""
        onClick={editable ? () => onSelectBlock?.(null) : undefined}
        style={{
          position: 'relative',
          width: W,
          height: plan.height,
          overflow: 'hidden',
          background: def.canvas.bg,
          fontFamily: font('body'),
          color: colors.text,
          boxSizing: 'border-box',
        }}
      >
        {bgUrl && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: cssUrl(bgUrl), backgroundSize: def.canvas.backgroundSize === 'repeat' ? 'auto' : def.canvas.backgroundSize ?? 'cover', backgroundRepeat: def.canvas.backgroundSize === 'repeat' ? 'repeat' : 'no-repeat', backgroundPosition: 'center' }} />
        )}
        {def.canvas.overlay && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: def.canvas.overlay }} />}
        {frameUrl && <div aria-hidden="true" style={{ position: 'absolute', inset, backgroundImage: cssUrl(frameUrl), backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />}
        {ornaments}
        <div
          style={{
            position: 'absolute',
            left: padLeft,
            width: safeWidth,
            top: padTop + Math.max(0, (availH - (columnRef.current?.offsetHeight ?? availH)) / 2),
          }}
        >
          <div ref={columnRef} style={{ width: '100%', ['--wq-s']: plan.scale }}>
            {content}
          </div>
        </div>
      </div>
    );
  }),
);

/** Scales a 1080-wide canvas into a box of `width` px (previews / zoom). */
export const ScaledCanvas = ({ width, children, height }) => {
  const scale = width / DESIGN_WIDTH;
  return (
    <div style={{ width, height: height ? height * scale : undefined, overflow: 'hidden', position: 'relative' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH }}>{children}</div>
    </div>
  );
};
