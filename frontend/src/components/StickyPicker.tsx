import React, { useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { Layers } from 'lucide-react';

const STICKY_COLORS = [
  '#fff9b1', '#ffec70',
  '#ffb870', '#ff8a8a',
  '#ffcce5', '#ff80df',
  '#b3d9ff', '#b3b3ff',
  '#80e5ff', '#66a3ff',
  '#80ffd4', '#66e699',
  '#ccff99', '#aadd33',
  '#ffffff', '#222222',
];

interface StickyPickerProps {
  buttonRect: DOMRect;
  onClose: () => void;
}

export const StickyPicker: React.FC<StickyPickerProps> = ({ buttonRect, onClose }) => {
  const { setActiveTool, stickyColor, setStickyColor } = useCanvasStore();
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="floating-panel"
      style={{
        position: 'absolute',
        left: '70px',
        top: Math.max(20, buttonRect.top - 100) + 'px',
        width: '140px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '12px',
        zIndex: 300,
        backgroundColor: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        maxHeight: 'calc(100vh - 40px)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        overflowY: 'auto',
        paddingRight: '4px',
        maxHeight: '300px'
      }}>
        {STICKY_COLORS.map(color => (
          <button
            key={color}
            onClick={() => {
              setStickyColor(color);
              setActiveTool('sticky');
              onClose();
            }}
            style={{
              width: '100%',
              aspectRatio: '1',
              padding: 0,
              backgroundColor: color,
              border: stickyColor === color ? '2px solid #2d68ff' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: '2px',
              cursor: 'pointer',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
            }}
          />
        ))}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button style={{
          display: 'flex', alignItems: 'center', justifyItems: 'flex-start', gap: '6px',
          padding: '8px 12px', backgroundColor: '#f1f3f4', border: 'none', borderRadius: '4px',
          fontWeight: 600, color: '#050038', cursor: 'pointer', fontSize: '13px'
        }}>
          <Layers size={16} /> Stack
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', backgroundColor: '#f1f3f4', border: 'none', borderRadius: '4px',
          fontWeight: 600, color: '#050038', cursor: 'pointer', fontSize: '13px'
        }}>
          Templates
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>
      </div>
    </div>
  );
};
