import React, { useEffect, useRef } from 'react';
import { useCanvasStore, type ToolType } from '../store/useCanvasStore';

/* ─── Inline SVG icons (match the reference screenshot exactly) ────────── */
const ILine        = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IArrow       = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="3" y1="15" x2="14" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><polyline points="8,4 14,4 14,10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
const IElbow       = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polyline points="3,15 3,5 14,5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><polyline points="10,2 14,5 10,8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
const IBlock       = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 6.5h9V4l5 5-5 5V11H2V6.5z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>;
const IRect        = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
const IOval        = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="9" rx="7" ry="5" stroke="currentColor" strokeWidth="1.8"/></svg>;
const IRhombus     = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polygon points="9,2 16,9 9,16 2,9" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>;
const ITriangle    = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polygon points="9,2 17,16 1,16" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/></svg>;
const IDivider     = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IMoreShapes  = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#6e7787" strokeWidth="1.5"/><line x1="9" y1="6" x2="9" y2="12" stroke="#6e7787" strokeWidth="1.5" strokeLinecap="round"/><line x1="6" y1="9" x2="12" y2="9" stroke="#6e7787" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IDiagram     = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="4" cy="4" r="2.5" fill="#f97316"/>
    <circle cx="14" cy="4" r="2.5" fill="#f97316" opacity="0.45"/>
    <circle cx="4" cy="14" r="2.5" fill="#f97316" opacity="0.45"/>
    <circle cx="14" cy="14" r="2.5" fill="#f97316"/>
    <line x1="4" y1="4" x2="14" y2="4" stroke="#f97316" strokeWidth="1.3"/>
    <line x1="4" y1="4" x2="4" y2="14" stroke="#f97316" strokeWidth="1.3"/>
    <line x1="14" y1="4" x2="14" y2="14" stroke="#f97316" strokeWidth="1.3"/>
    <line x1="4" y1="14" x2="14" y2="14" stroke="#f97316" strokeWidth="1.3"/>
  </svg>
);

/* ─── Data ────────────────────────────────────────────────────────────── */
const CONNECTORS: { tool: ToolType; label: string; shortcut?: string; icon: React.ReactNode }[] = [
  { tool: 'shape-line',        label: 'Line',         shortcut: 'L', icon: <ILine /> },
  { tool: 'shape-arrow',       label: 'Arrow',                       icon: <IArrow /> },
  { tool: 'shape-elbow-arrow', label: 'Elbow arrow',                 icon: <IElbow /> },
  { tool: 'shape-block-arrow', label: 'Block arrow',                 icon: <IBlock /> },
];

const SHAPES: { tool: ToolType; label: string; shortcut?: string; icon: React.ReactNode }[] = [
  { tool: 'shape-rectangle', label: 'Rectangle', shortcut: 'R', icon: <IRect /> },
  { tool: 'shape-oval',      label: 'Oval',       shortcut: 'O', icon: <IOval /> },
  { tool: 'shape-rhombus',   label: 'Rhombus',                   icon: <IRhombus /> },
  { tool: 'shape-triangle',  label: 'Triangle',                  icon: <ITriangle /> },
  { tool: 'shape-divider',   label: 'Divider',                   icon: <IDivider /> },
];

/* ─── Props ───────────────────────────────────────────────────────────── */
interface ShapePickerProps {
  /** top-left corner of the toolbar button that opened this menu */
  buttonRect: DOMRect;
  onClose: () => void;
}

export const ShapePicker: React.FC<ShapePickerProps> = ({ buttonRect, onClose }) => {
  const { activeTool, setActiveTool } = useCanvasStore();
  const panelRef = useRef<HTMLDivElement>(null);

  /* Close on outside-click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // slight delay so the opening click doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const select = (tool: ToolType) => { setActiveTool(tool); onClose(); };

  /* Position the panel to the right of the toolbar, aligned with the button.
     Clamp so it never overflows the bottom of the viewport. */
  const PANEL_HEIGHT = 460;
  const MARGIN = 12;
  const rawTop = buttonRect.top - 200;
  const clampedTop = Math.min(rawTop, window.innerHeight - PANEL_HEIGHT - MARGIN);
  const finalTop = Math.max(MARGIN, clampedTop);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: buttonRect.right + 10,
    top: finalTop,
    zIndex: 9999,
    pointerEvents: 'auto',           /* overrides inherited pointer-events:none from toolbar */
    backgroundColor: '#fff',
    borderRadius: '14px',
    boxShadow: '0 6px 32px rgba(5,0,56,0.14), 0 0 0 1px rgba(5,0,56,0.06)',
    padding: '8px 0',
    minWidth: '230px',
    maxHeight: `${window.innerHeight - MARGIN * 2}px`,
    overflowY: 'auto',
    userSelect: 'none',
  };

  const rowStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '7px 14px',
    background: active ? '#eef1ff' : 'transparent',
    color: active ? '#2d68ff' : '#1a1a2e',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? 500 : 400,
    textAlign: 'left' as const,
    transition: 'background 0.1s',
  });

  const iconStyle = (active: boolean): React.CSSProperties => ({
    color: active ? '#2d68ff' : '#6e7787',
    flexShrink: 0,
    display: 'flex',
  });

  const renderRow = (item: typeof CONNECTORS[0]) => {
    const active = activeTool === item.tool;
    return (
      <button
        key={item.tool}
        style={rowStyle(active)}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        onClick={() => select(item.tool)}
      >
        <span style={iconStyle(active)}>{item.icon}</span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.shortcut && <span style={{ color: '#adb5bd', fontSize: '13px', fontWeight: 400 }}>{item.shortcut}</span>}
      </button>
    );
  };

  return (
    <div ref={panelRef} style={style}>
      {CONNECTORS.map(renderRow)}

      <div style={{ height: '1px', background: '#e8e9eb', margin: '6px 0' }} />

      {SHAPES.map(renderRow)}

      <div style={{ height: '1px', background: '#e8e9eb', margin: '6px 0' }} />

      {/* More shapes */}
      <button
        style={rowStyle(false)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        onClick={onClose}
      >
        <span style={{ color: '#6e7787', display: 'flex' }}><IMoreShapes /></span>
        <span>More shapes</span>
      </button>

      {/* Diagram */}
      <button
        style={{ ...rowStyle(false), color: '#f97316', fontWeight: 500 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff4ed'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        onClick={onClose}
      >
        <span style={{ display: 'flex' }}><IDiagram /></span>
        <span>Diagram</span>
      </button>
    </div>
  );
};
