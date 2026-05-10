import React, { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

const IEraser = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M4 15 L9 6 L19 6 L19 15 L14 19 L4 19 Z"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"
    />
    <line x1="4" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const IPixelEraser = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M4 15 L9 6 L19 6 L19 15 L14 19 L4 19 Z"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"
    />
    <line x1="4" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="8"    cy="10.5" r="1.1" fill="currentColor" opacity="0.45"/>
    <circle cx="11"   cy="10.5" r="1.1" fill="currentColor" opacity="0.45"/>
    <circle cx="14"   cy="10.5" r="1.1" fill="currentColor" opacity="0.45"/>
    <circle cx="9.5"  cy="8"    r="1.1" fill="currentColor" opacity="0.30"/>
    <circle cx="12.5" cy="8"    r="1.1" fill="currentColor" opacity="0.30"/>
  </svg>
);

const ERASER_TOOLS = [
  { tool: 'eraser'       as const, label: 'Eraser',        icon: <IEraser /> },
  { tool: 'pixel-eraser' as const, label: 'Pixel eraser',  icon: <IPixelEraser /> },
];

interface EraserPickerProps {
  buttonRect: DOMRect;
  onClose: () => void;
}

export const EraserPicker: React.FC<EraserPickerProps> = ({ buttonRect, onClose }) => {
  const { activeTool, setActiveTool } = useCanvasStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const PANEL_HEIGHT = 120;
  const MARGIN = 12;
  const rawTop = buttonRect.top - 50;
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
      {ERASER_TOOLS.map(({ tool, label, icon }) => {
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
    </div>
  );
};
