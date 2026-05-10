import React, { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

const IPen = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M4 17 C6 14 8 10 11 8 C13 7 14 8 13 10 C12 12 10 14 11 16 C12 17 14 16 16 14 C17 13 18 11 18 11"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
  </svg>
);

const IMarker = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M5 16 L14 4 L18 7 L9 19 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
    <line x1="12.5" y1="5.5" x2="15.5" y2="8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
    <path d="M5 16 L3 19 L6.5 18.5 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ISmart = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M15.5 2 Q19.5 2 19.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    <polyline points="13.5,1 15.5,2 14,4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M19.5 9 Q19.5 13 15.5 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    <polyline points="13.5,12 15.5,13 14.5,15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ILasso = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <ellipse cx="11" cy="9" rx="7" ry="5.5"
      stroke="currentColor" strokeWidth="1.7"
      strokeDasharray="3.2 2.2" fill="none"
    />
    <path d="M15 13 Q17 16 16 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
    <circle cx="16" cy="19" r="1.2" fill="currentColor"/>
  </svg>
);

const PEN_TOOLS = [
  { tool: 'pen'          as const, label: 'Pen',          icon: <IPen /> },
  { tool: 'marker'       as const, label: 'Marker',        icon: <IMarker /> },
  { tool: 'smart-pen'    as const, label: 'Smart drawing', icon: <ISmart /> },
  { tool: 'lasso'        as const, label: 'Lasso select',  icon: <ILasso /> },
];

const STROKE_SIZES = [
  { label: 'Thin',   size: 2,  dotR: 3,  color: '#050038' },
  { label: 'Medium', size: 5,  dotR: 7,  color: '#ef4444' },
  { label: 'Thick',  size: 12, dotR: 12, color: '#22c55e' },
];

interface PenPickerProps {
  buttonRect: DOMRect;
  onClose: () => void;
}

export const PenPicker: React.FC<PenPickerProps> = ({ buttonRect, onClose }) => {
  const { activeTool, setActiveTool, penSize, setPenSize } = useCanvasStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const PANEL_HEIGHT = 390;
  const MARGIN = 12;
  const rawTop = buttonRect.top - 200;
  const clampedTop = Math.min(rawTop, window.innerHeight - PANEL_HEIGHT - MARGIN);
  const finalTop = Math.max(MARGIN, clampedTop);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: buttonRect.right + 10,
        top: finalTop,
        zIndex: 9999,
        pointerEvents: 'auto',
        backgroundColor: '#fff',
        borderRadius: '18px',
        boxShadow: '0 6px 32px rgba(5,0,56,0.14), 0 0 0 1px rgba(5,0,56,0.07)',
        padding: '8px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        minWidth: '54px',
        userSelect: 'none',
      }}
    >
      {PEN_TOOLS.map(({ tool, label, icon }) => {
        const active = activeTool === tool;
        return (
          <button
            key={tool}
            title={label}
            onClick={() => { setActiveTool(tool); onClose(); }}
            style={{
              width: '42px', height: '42px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              background: active ? '#eff3ff' : 'transparent',
              color: active ? '#2d68ff' : '#050038',
              transition: 'background 0.12s',
              flexShrink: 0,
              pointerEvents: 'auto',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {icon}
          </button>
        );
      })}

      <div style={{ width: '28px', height: '1px', background: '#e1e3e5', margin: '4px 0' }} />

      {STROKE_SIZES.map(({ label, size, dotR, color }) => {
        const active = penSize === size;
        return (
          <button
            key={size}
            title={label}
            onClick={() => setPenSize(size)}
            style={{
              width: '42px', height: '42px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${active ? '#2d68ff' : 'transparent'}`,
              borderRadius: '50%', cursor: 'pointer',
              background: 'transparent',
              transition: 'border-color 0.12s',
              flexShrink: 0,
              pointerEvents: 'auto',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = '#e1e3e5'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
          >
            <div style={{
              width: dotR * 2, height: dotR * 2,
              borderRadius: '50%',
              background: color,
            }} />
          </button>
        );
      })}
    </div>
  );
};
